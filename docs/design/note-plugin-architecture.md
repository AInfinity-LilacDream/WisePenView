# Note 内容插件架构

## 1. 核心原则

Note 的内容单位是 block 与 inline content。每种内容类型只有一个 owner plugin，owner 同时拥有该类型的 schema、render、Markdown、projection、AI Diff、comments、print 等能力。

Engine 只编排横切能力，不解释内容语义：

- plugin 决定某种内容是什么、如何渲染、如何投影；
- engine 遍历 plugin tree、保存运行时快照、派发命令；
- 页面容器只组装 editor、协同状态和 UI portal；
- Yjs 生命周期、provider、IndexedDB 不属于本轮重构范围。

因此 AI Diff 不是一种内容类型，也没有独立的 `AiChangePlugin`。正文 schema 中不存在 `ai-diff`、`ai-add`、`ai-delete`、`ai-link-add`、`ai-link-delete`。

## 2. 目录边界

```text
CustomBlockNote/
├── plugins/
│   ├── DefaultContentPlugin/
│   ├── CodeBlockPlugin/
│   ├── TablePlugin/
│   └── LatexPlugin/
├── content/
│   ├── types.ts
│   ├── registry.ts
│   ├── projection.ts
│   └── outline.ts
├── engines/
│   ├── aiDiff/
│   │   ├── action.ts
│   │   ├── contentState.ts
│   │   ├── runtime.ts
│   │   ├── store.ts
│   │   ├── wordDiff.ts
│   │   └── useAiDiffSidecarRuntime.ts
│   ├── comments/
│   │   ├── core/
│   │   ├── hooks/
│   │   └── ui/
│   ├── collaboration/
│   │   ├── useNoteCaptureKeyEvent.ts
│   │   └── useNoteYjsUndoStack.ts
│   ├── editor/
│   │   ├── dom.ts
│   │   ├── readOnly.ts
│   │   └── stripEscape.ts
│   ├── markdown/
│   └── print/
├── noteEditorComposition.ts
├── noteConfig.ts
├── index.type.ts
├── index.tsx
└── style.module.less
```

目录规则：

- `plugins/` 只放内容 owner；内容专属 UI、codec 和 comments 实现属于 owner，可留在对应 plugin 内；
- `content/` 放 plugin 契约、registry 和内容 projection 基础设施；
- `engines/` 放 Markdown、print、editor、collaboration、AI Diff、comments 等跨内容类型编排；
- Comment engine 只管理 thread、权限、可见性、range selection、持久化调度和通用 UI；
- `noteEditorComposition.ts` 是唯一组合入口，负责装配 plugin tree、runtime extensions 与最终 schema；
- 根目录只保留组件入口、组件 props/style 与组合根，不放横切实现；

## 3. Plugin Tree 与 Registry

当前树形结构：

```text
note
├── default-content
│   ├── text
│   ├── link
│   ├── paragraph / heading / quote / lists
│   └── audio / divider / file / image / video
├── codeBlock
├── table
└── latex
    ├── math
    └── inlineMath
```

Registry 负责：

1. 展平树并按 dependency 排序；
2. 保证 plugin id 唯一；
3. 保证每种 block/inline type 只有一个 owner；
4. 校验 capability 声明与实现一致；
5. 汇总 schema、extension、editorProps、print styles、slash menu；
6. 提供默认插入 block。

Registry 不实现 AI Diff，不维护 type 白名单，也不知道 `expression`、table cell 或 media props。

## 4. Capability 模型

每个内容 owner 必须显式声明以下切面：

```ts
interface NoteContentCapabilityDeclarations {
  markdownImport: NoteCapabilityDeclaration;
  markdownExport: NoteCapabilityDeclaration;
  aiDiff: NoteCapabilityDeclaration;
  projection: NoteCapabilityDeclaration;
  print: NoteCapabilityDeclaration;
}
```

声明值为 `default | inherited | custom | unsupported`。当声明为 `inherited` 或 `custom` 时必须提供实现；实现存在但声明不匹配时 registry 直接报错。

### 4.1 AI Diff owner

```ts
interface NoteInlineAiDiff {
  renderAiContent(aiContent, registry): HTMLElement;
}

interface NoteBlockAiDiff {
  resolve?(block, aiContent, registry): NoteAiDiffProjection | null;
  acceptAiContent?(block, aiContent, registry): NoteAiDiffAcceptedBlockUpdate | null;
  renderAiContent(aiBlock, registry): HTMLElement;
  comparison?: {
    render(current, aiBlock, registry, context?): HTMLElement;
  };
  applyGranular?(block, aiContent, action, target, registry): unknown | null;
}
```

- rich-text block owner 负责组合 text、link、inlineMath owner；
- table owner 直接读取 row/cell，并委托 cell 内 inline owner；
- codeBlock owner 按 native content 渲染代码；
- `comparison` 只声明 owner 是否提供组合对比视图，不表示操作粒度；
- `applyGranular` 单独声明 owner 是否支持逐 hunk 接受与拒绝；
- rich-text 始终使用 hunk 操作；无法按文本范围安全切分时收敛为一个整段 content hunk；
- codeBlock 可按行展示差异但仍按 block 操作，table 按 block 展示和操作；
- 默认由 engine 派生 `{ ...block, content: aiContent }` 并在接受时写回 `content`；
- props-only owner 可通过 `resolve` 和 `acceptAiContent` 把同一份 sidecar 候选投影、写回到自身主内容字段；
- math 的 sidecar 值是公式字符串，owner 将其映射到 `props.expression`，不持久化整份 props；
- 局部操作只返回变换后的 content，engine 根据 accept/discard 决定写回正文或 AI-content。

owner 只负责自身主内容的投影、比较展示与变换，不新增正文 schema 节点，也不持久化 diff、hunk 或 UI 状态。

### 4.2 Comment Facet

Facet 是内容 plugin 对某个横切 engine 提供的能力接口，不是独立模块或 AOP 运行时。Comment 使用判别联合声明三种模式：

```ts
type NoteCommentFacet =
  | { mode: 'range' }
  | { mode: 'dedicated'; anchor: NoteCommentAnchorFacet }
  | { mode: 'unsupported'; reason?: string };
```

- `range` 由 Comment engine 的通用相对选区策略处理；
- `dedicated` 必须由内容 owner 提供 anchor facet；
- `unsupported` 明确拒绝正文批注入口。

专用 anchor facet 负责解析自身 payload、选择内容、恢复位置、生成引用文本、比较锚点，并可选择同步 PM mark。Engine 只按 registry 派发，不出现 `math`、`inlineMath`、`formula` 等内容分支。

MathBlock 与 InlineMath 各自注册 comments facet，并共享 Latex plugin 内部的公式锚点 store。现有 Yjs map 名称继续作为持久协议使用，但它的类型、读写和解析只存在于 Latex plugin；Comment engine 不知道该 map 的名称或 payload。

`CustomBlockNote` 只装配一次 `NoteCommentRuntimeProvider`。内容 plugin 的渲染组件通过通用 comment runtime command 发起专用批注，不允许 host 再挂内容特定 Provider 或 hook。

## 5. AI-content 持久协议

### 5.1 唯一物理载体

AI-content 只存放在 Y.Doc 顶层：

```ts
doc.getMap('ai-content-store');
```

map key 是 block id。默认 block 的 value 与 native `content` 同形；props-only block 使用 owner 声明的主内容值。不存在第二条 `<AI-content>` XML 路径。

逻辑上前端只感知一个 block JSON：

```ts
interface NoteBlockWithAiContent {
  id: string;
  type: string;
  props: Record<string, unknown>;
  content: unknown;
  'ai-content'?: unknown;
  children: NoteBlockWithAiContent[];
}
```

物理上采用 sparse map，无 key 等价于 block 没有 `ai-content`。适配器负责在 block JSON 与 Y.Map 之间拆装，不改变字段语义。

### 5.2 Content 约束

- `content` 是默认 block 的当前正文，`ai-content` 是 AI 期望的主内容；
- 默认 block 的两者必须使用相同 native content 结构；math 的 `ai-content` 直接使用公式字符串；
- AI-content 不包装 payload、candidate、operation 或整份 props；
- map value 是 plain JSON，每次整体 set，不使用嵌套 Y.Map/Y.Array；
- owner 判定当前主内容与 AI-content 相同表示审阅完成，此时删除 map entry；
- 当前主内容为空且 AI-content 非空表示新增；反向表示删除；两者都非空表示修改；
- 除 props-only owner 声明的主内容字段外，props/type 变化不进入 AI-content；结构变化由后端以删除旧 block、创建新 placeholder 表达；
- 子 block 各自拥有 AI-content，父 block 不包含子树候选。

后端写入新增 block 时，必须在同一个 Yjs transaction 中创建带 id 的空主内容 placeholder，并写入 AI-content。

版本校验属于 Node.js tool 的原子读写接口，不进入 block JSON 或 `ai-content-store`。

### 5.3 不兼容迁移

新前端不读取以下旧数据：

- 正文中的五种 `ai-*` inline node；
- `AI-Create`、`AI-Delete`、`AI-Edit`；
- math/inlineMath 的 `aiDiffType/Key/Origin/Replace` props；
- block 内 `<AI-content>` XML element。
- 包含 revision、baseHash、operation、candidate 的 payload envelope。

上线前必须由后端或一次性数据迁移清除已持久化旧节点，并把 sidecar value 切换为原生 content。前端不保留 wrapper、alias 或双路径兼容。

## 6. AI Diff Engine

Engine 的 PM plugin state 只保存：

```ts
{
  displayMode;
  aiContentByBlockId;
  actionsEnabled;
  onAction;
  decorations;
}
```

运行过程：

1. hook 观察 `ai-content-store` 与正文 fragment；
2. 读取 block content 与 AI-content；
3. 通过 PM transaction meta 同步 engine state；
4. engine 遍历 `blockContainer`，用 block id 找 sidecar；
5. owner 解析当前主内容与 AI-content，engine 据此生成对比视图；
6. 根据显示模式生成 Decoration 与 AI-content widget；
7. store 变化主动更新 React presence。

整个投影过程是只读的，不需要 awareness leader，也不监听 provider sync。普通观察永远不会改写正文或 AI-content。

### 6.1 三种显示模式

| 模式    | content                               | AI-content       | 操作按钮 |
| ------- | ------------------------------------- | ---------------- | -------- |
| oldOnly | 显示；新增 placeholder 隐藏           | 不显示           | 不显示   |
| compare | 旧侧删除态；新增 placeholder 内容隐藏 | owner 渲染新增态 | 显示     |
| newOnly | 隐藏；AI-content 为空时隐藏整个 block | owner 渲染普通态 | 不显示   |

Decoration 不进入 PM document，因此不会污染 selection、Yjs、正文 hash 或 schema。

rich-text hunk 的合并阈值与计算量上限集中在 `noteConfig.aiDiff.richText`，由组合根注入 owner。`hunk` 用于回归调参，`limits` 只表示性能安全线；二者不进入 block JSON 或 runtime state。

### 6.2 接受与拒绝

所有动作点击时重新读取当前 block 与 AI-content，不信任 widget 闭包中的内容。

| 动作          | content                              | AI-content                           |
| ------------- | ------------------------------------ | ------------------------------------ |
| 接受一个 hunk | 把对应 AI-content 片段迁移进 content | 保持不变                             |
| 拒绝一个 hunk | 保持不变                             | 把对应 content 片段迁移进 AI-content |
| 全部接受      | owner 将正文主内容替换为 AI-content  | 删除 entry                           |
| 全部拒绝      | 保持不变                             | 删除 entry                           |

每次动作后若两份主内容相同，删除 AI-content；若收敛结果为空 placeholder，则删除 block。正文修改与 sidecar 更新放在同一个 Yjs transaction 中，UndoManager 同时跟踪正文 fragment 与 `ai-content-store`。

删除 block 会连带清理子树 sidecar，避免孤儿 AI-content。

### 6.3 并发边界

- 前端只操作当前 Y.Doc 中的 content 与 AI-content，不实现版本协议；
- AI tool 的读取校验与写入必须由 Node.js 在文档级串行临界区内原子执行；
- 版本不一致由 tool 返回 conflict，不把 token 持久化进 AI-content；
- Y.Map plain content 使用 Yjs 的 LWW 语义。

## 7. 派生输出

Markdown、HTML、PDF、clipboard 不能从 widget 读取新内容。

- Markdown/HTML：先从 engine state 读取 AI-content，再生成 old/new native block，最后交给 BlockNote serializer；
- PDF：临时切换 oldOnly，等待双 rAF 后克隆 DOM；
- outline 与正文 hash：读取 native 正文，只反映已接受内容；
- comments：待审阅 block 的范围批注入口由 engine sidecar presence 判断，不扫描 synthetic inline node。

COMPARE 没有可序列化的正文形态；导出时按 old snapshot 处理，除非调用方明确请求 NEW_ONLY。

## 8. 后续切面

在当前 block 级闭环稳定后，按同一结构逐步实现：

1. clipboard 的显式 old/new 选择；
2. Node.js 原子 read/apply tool；
3. 必要时扩展更多 native content owner。

这些增强不得重新引入 synthetic schema、正文内 diff props 或双持久化路径。
