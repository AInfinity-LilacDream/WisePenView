/**
 * AIDiff 示例数据
 *
 * 覆盖场景：
 * 1. 少量词替换 — 句中仅替换一个词/短语，其余文字保持不变
 * 2. 多处分散修改 — 同一句中多个不相邻改动（归一化后会拆成 text + 多个 AI-Edit）
 * 3. 纯新增段落 — AI-Create 节点
 * 4. 纯删除段落 — AI-Delete 节点
 * 5. 空白变动 (formatChange) — 仅改空格/标点间距，应显示弱样式
 * 6. 高变动率回退 — 大段重写(>60% token 变化)，回退为整块 delete + add
 * 7. 中英混排替换 — 含英文单词的中文句子中替换个别词
 * 8. 标点边界断开 — 跨句末标点的修改，验证 breakOnSentenceEnd 合并边界
 * 9. 前缀/后缀完全保留 — 只修改句子中间，plain span 贴合两端
 * 10. 纯删除内容(AI-Edit, no replace) — old_text 有内容，new_text 为空
 * 11. 跨片段合并块 — 相邻 AI-Edit（中间含共享 text）应合并为一整块 diff
 * 12. 合并块与独立块并存 — 前半段合并，后半段单独保留
 * 13–33. 写作常见排版 — 分隔线；符号/标点/货币/URL；学术中英混排；heading 1–3（改/增/删）；quote；嵌套 bullet；有序列表（含 start）；checkListItem；toggle 与子块；math 块（编辑/新增/删除）；inlineMath（编辑/新增/删除）；link（新增/删除）；NBSP 与连字符；邮箱/文件名式混排
 * 注：codeBlock 不参与 aiGeneratedBlocksToBlockNoteBlocks（管线排除），故 mock 不含代码块。
 */

export const MOCK_AI_BLOCKS = [
  // ────────────────────────────────────────────────────────────
  // 场景 1：少量词替换
  // 期望：两端 plain 文字连成一片，中间 "严重干扰" 红底 + "显著影响" 绿底
  // ────────────────────────────────────────────────────────────
  {
    id: 'p_word_replace',
    type: 'paragraph',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      {
        type: 'AI-Edit',
        old_text: '尽管实验样本量充足，但环境因素对结果产生的严重干扰未被充分考虑。',
        new_text: '尽管实验样本量充足，但环境因素对结果产生的显著影响未被充分考虑。',
        styles: {},
      },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 2：多处分散修改
  // 期望：一个整体 ai-diff（单套 Keep/Undo），词级 delete/add/context 在块内渲染
  // ────────────────────────────────────────────────────────────
  {
    id: 'p_multi_change',
    type: 'paragraph',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      {
        type: 'AI-Edit',
        old_text:
          '在数据分析的过程中，我们通过使用了错误的回归模型，从而导致了最终得出的结论是存在着明显的偏差和误导性的。',
        new_text: '在数据分析过程中，由于误用了回归模型，导致最终结论存在明显偏差。',
        styles: {},
      },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 3：纯新增段落
  // 期望：整段绿底
  // ────────────────────────────────────────────────────────────
  {
    id: 'p_pure_add',
    type: 'paragraph',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      {
        type: 'AI-Create',
        text: '此外，研究人员建议在后续实验中引入双盲对照组，以进一步排除安慰剂效应的干扰。',
        styles: {},
      },
    ],
    children: [],
  },
  {
    id: 'p_pure_add',
    type: 'paragraph',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      {
        type: 'text',
        text: '          ',
        styles: {},
      },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 4：纯删除段落
  // 期望：整段红底
  // ────────────────────────────────────────────────────────────
  {
    id: 'p_pure_delete',
    type: 'paragraph',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      {
        type: 'AI-Delete',
        text: '量子计算的发展对传统加密算法构成了严峻挑战，其强大的并行处理能力可实现快速破解。',
        styles: {},
      },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 5：空白变动 (formatChange)
  // 只改了"，"前后的空格 / 把全角空格换成半角空格
  // 期望：变动处显示极弱底色，不抢夺阅读注意力
  // ────────────────────────────────────────────────────────────
  {
    id: 'p_format_change',
    type: 'paragraph',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      {
        type: 'AI-Edit',
        old_text: '结论  一：方案可行。结论  二：需要补充数据。',
        new_text: '结论 一：方案可行。结论 二：需要补充数据。',
        styles: {},
      },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 6：高变动率回退（>60% token 变化）
  // 大段重写，回退为整块红底 + 整块绿底
  // ────────────────────────────────────────────────────────────
  {
    id: 'p_high_change_ratio',
    type: 'paragraph',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      {
        type: 'AI-Edit',
        old_text:
          '为了提高软件的鲁棒性，开发者必须在编写代码的时候，应该时刻保持着对异常处理机制的充分考虑。若不定期维护和更新代码库，软件的性能与安全性将随时间推移而逐渐下降。',
        new_text:
          '健壮的软件离不开严格的错误边界设计与完善的单元测试覆盖。持续集成与自动化部署可将人工操作失误降至最低，从而保障系统长期稳定运行。',
        styles: {},
      },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 7：中英混排替换
  // 期望：英文单词 "API" → "REST API" 精确高亮，不影响周边中文
  // ────────────────────────────────────────────────────────────
  {
    id: 'p_mixed_lang',
    type: 'paragraph',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      {
        type: 'AI-Edit',
        old_text:
          '前端通过调用后端 API 获取用户数据，并在 React 组件中完成渲染。接口响应时间需控制在 200ms 以内。',
        new_text:
          '前端通过调用后端 REST API 获取用户数据，并在 React 组件中完成渲染。接口响应时间需控制在 100ms 以内。',
        styles: {},
      },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 8：标点边界断开
  // 两个句子各有改动；词级叙事仍按句界在块内分段着色
  // 期望：一个整体 ai-diff，句与句之间在块内可见叙事分段（非多个独立按钮）
  // ────────────────────────────────────────────────────────────
  {
    id: 'p_sentence_boundary',
    type: 'paragraph',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      {
        type: 'AI-Edit',
        old_text:
          '气候变化导致极端天气事件频率上升，对农业生产造成了深远影响。与此同时，海平面的持续抬升也威胁着沿海城市的长期安全。',
        new_text:
          '气候变化导致极端气候事件发生频率显著增加，对全球农业生产造成了深远影响。与此同时，海平面的持续上升也威胁着沿海地区的长期安全。',
        styles: {},
      },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 9：前缀/后缀完全保留，只改中间
  // 期望：两端 plain 连续显示，中间精准红→绿高亮
  // ────────────────────────────────────────────────────────────
  {
    id: 'p_middle_change',
    type: 'paragraph',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      {
        type: 'text',
        text: '研究结论指出，',
        styles: {},
      },
      {
        type: 'AI-Edit',
        old_text:
          '该疫苗在临床三期试验中表现出高达 92% 的有效性，且未观察到严重不良反应，符合上市标准。',
        new_text:
          '该疫苗在临床三期试验中表现出高达 95% 的有效性，且未观察到严重不良反应，符合紧急授权标准。',
        styles: {},
      },
      {
        type: 'text',
        text: '预计将于下季度正式获批。',
        styles: {},
      },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 10：AI-Edit 中 new_text 为空（纯删除语义，走 ai-diff 节点）
  // 期望：整个 origin 显示为红底，无绿底内容
  // ────────────────────────────────────────────────────────────
  {
    id: 'p_edit_to_empty',
    type: 'paragraph',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      {
        type: 'AI-Edit',
        old_text: '（此段内容存在事实性错误，建议整体删除。）',
        new_text: '',
        styles: {},
      },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 11：跨片段合并块（共享 text 作为 old/new 共同上下文）
  // 期望：前两段 AI-Edit + 中间 text 合并后，呈现为一个整体 diff 块（单套 Keep/Undo）
  // ────────────────────────────────────────────────────────────
  {
    id: 'p_cross_item_merge',
    type: 'paragraph',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      {
        type: 'AI-Edit',
        old_text: '天气',
        new_text: '气候',
        styles: {},
      },
      {
        type: 'text',
        text: '变化',
        styles: {},
      },
      {
        type: 'AI-Edit',
        old_text: '明显',
        new_text: '显著',
        styles: {},
      },
      {
        type: 'text',
        text: '，有必要提前准备应对方案。',
        styles: {},
      },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 12：合并块与独立块并存
  // 期望：前两段构成一个合并块，后续独立 AI-Edit 仍保持独立按钮
  // ────────────────────────────────────────────────────────────
  {
    id: 'p_merge_and_single_mix',
    type: 'paragraph',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      {
        type: 'AI-Edit',
        old_text: '该研究',
        new_text: '本研究',
        styles: {},
      },
      {
        type: 'text',
        text: '在样本规模上',
        styles: {},
      },
      {
        type: 'AI-Edit',
        old_text: '较小',
        new_text: '存在局限',
        styles: {},
      },
      {
        type: 'text',
        text: '；',
        styles: {},
      },
      {
        type: 'AI-Edit',
        old_text: '但结论仍具参考价值',
        new_text: '但结论仍具有一定参考价值',
        styles: {},
      },
      {
        type: 'text',
        text: '。',
        styles: {},
      },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 13：分隔线（无 AI，用于分隔 mock 区块）
  // ────────────────────────────────────────────────────────────
  {
    id: 'div_section_writing',
    type: 'divider',
    props: {},
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 14：符号/标点/单位混排（箭头、破折号、引号、货币、全角半角等）
  // ────────────────────────────────────────────────────────────
  {
    id: 'p_symbols_punctuation',
    type: 'paragraph',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      {
        type: 'AI-Edit',
        old_text:
          '"智能手环"——续航时间>=7天(实测5~6天);售价￥199/$29.99,详见URL:example.com/path?id=1&x=100%.',
        new_text:
          '「智能手环」——续航时间 ≥7 天（实测 5–6 天）；售价 ￥199 / US$29.99，详见 https://example.com/path?id=1&x=100%。',
        styles: {},
      },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 15：学术/工程风中英混杂 + 上下标与希腊字母读法（仍以纯文本形式走 diff）
  // ────────────────────────────────────────────────────────────
  {
    id: 'p_academic_mixed',
    type: 'paragraph',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      {
        type: 'AI-Edit',
        old_text:
          '在 GPU 上 benchmark 显示，batch size=32 时 throughput 约 1200 img/s；与论文 Fig.3 的 baseline 对比，latency 下降 15%(p<0.01)。',
        new_text:
          'GPU 基准测试表明，当 batch size 为 32 时吞吐量约 1200 images/s；相对论文图 3 的基线，延迟下降 15%（p < 0.01）。',
        styles: {},
      },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 16：Heading 2 — 标题内少量改写
  // ────────────────────────────────────────────────────────────
  {
    id: 'h2_section_title',
    type: 'heading',
    props: {
      level: 2,
      textColor: 'default',
      backgroundColor: 'default',
      textAlignment: 'left',
    },
    content: [
      {
        type: 'AI-Edit',
        old_text: '3.2 实验 setup 与 metrics',
        new_text: '3.2 实验设置与评价指标',
        styles: {},
      },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 17：Heading 3 — 整段为 AI 新增标题
  // ────────────────────────────────────────────────────────────
  {
    id: 'h3_new_subsection',
    type: 'heading',
    props: {
      level: 3,
      textColor: 'default',
      backgroundColor: 'default',
      textAlignment: 'left',
    },
    content: [
      {
        type: 'AI-Create',
        text: '3.2.1 与既有 SOTA 的公平比较说明',
        styles: {},
      },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 18：Heading 1 — 整段删除（大标题回滚）
  // ────────────────────────────────────────────────────────────
  {
    id: 'h1_strike_section',
    type: 'heading',
    props: {
      level: 1,
      textColor: 'default',
      backgroundColor: 'default',
      textAlignment: 'left',
    },
    content: [
      {
        type: 'AI-Delete',
        text: '[草稿] 与本章无关的重复小节标题',
        styles: {},
      },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 19：引用块 — 《》与英文并列
  // ────────────────────────────────────────────────────────────
  {
    id: 'quote_citation',
    type: 'quote',
    props: { textColor: 'default', backgroundColor: 'default' },
    content: [
      {
        type: 'AI-Edit',
        old_text: '正如《The Art of Readable Code》所言："命名即文档 "; 中文写作里同理。',
        new_text: '正如《The Art of Readable Code》所述：“命名即文档”；中文写作同理。',
        styles: {},
      },
    ],
    children: [],
  },
  {
    id: 'quote_pure_create',
    type: 'quote',
    props: { textColor: 'default', backgroundColor: 'default' },
    content: [
      {
        type: 'AI-Create',
        text: '新增引用：该段落仅存在于新版本中，用于验证 oldOnly 下整块折叠。',
        styles: {},
      },
    ],
    children: [],
  },
  {
    id: 'quote_pure_delete',
    type: 'quote',
    props: { textColor: 'default', backgroundColor: 'default' },
    content: [
      {
        type: 'AI-Delete',
        text: '删除引用：该段落仅存在于旧版本中，用于验证 newOnly 下整块折叠。',
        styles: {},
      },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 20：无序列表 — 主项改写 + 嵌套子项改写
  // ────────────────────────────────────────────────────────────
  {
    id: 'bullet_parent_nested',
    type: 'bulletListItem',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      {
        type: 'AI-Edit',
        old_text: '上线前需要完成 QA checklist 中的 smoke test',
        new_text: '上线前需完成 QA 清单中的冒烟测试',
        styles: {},
      },
    ],
    children: [
      {
        id: 'bullet_nested_detail',
        type: 'bulletListItem',
        props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
        content: [
          {
            type: 'AI-Edit',
            old_text: '包含 login / pay / refund 三条主线',
            new_text: '覆盖登录、支付与退款三条主线',
            styles: {},
          },
        ],
        children: [],
      },
      {
        id: 'bullet_nested_detail_2',
        type: 'bulletListItem',
        props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
        content: [
          {
            type: 'text',
            text: '跨端兼容：',
            styles: {},
          },
          {
            type: 'AI-Edit',
            old_text: 'iOS & Android WebView',
            new_text: 'iOS 与 Android WebView',
            styles: {},
          },
        ],
        children: [],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 21：有序列表 — 带 start，模拟「从 4 继续编号」
  // ────────────────────────────────────────────────────────────
  {
    id: 'numbered_resume_4',
    type: 'numberedListItem',
    props: {
      start: 4,
      textColor: 'default',
      backgroundColor: 'default',
      textAlignment: 'left',
    },
    content: [
      {
        type: 'AI-Edit',
        old_text: 'Step IV: run E2E tests in CI pipeline (GitHub Actions)',
        new_text: '步骤四：在 CI（GitHub Actions）中运行端到端测试',
        styles: {},
      },
    ],
    children: [],
  },
  {
    id: 'numbered_resume_5',
    type: 'numberedListItem',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      {
        type: 'AI-Edit',
        old_text: 'Step V: tag release v1.0-rc1',
        new_text: '步骤五：打标签发布 v1.0-rc1',
        styles: {},
      },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 22：勾选列表 — 未完成 → 已勾选 文案修正
  // ────────────────────────────────────────────────────────────
  {
    id: 'check_todo_open',
    type: 'checkListItem',
    props: {
      checked: false,
      textColor: 'default',
      backgroundColor: 'default',
      textAlignment: 'left',
    },
    content: [
      {
        type: 'AI-Edit',
        old_text: '补充 Related Work 中 2023–2024 年的引用',
        new_text: '补充相关工作（2023–2024）中的文献引用',
        styles: {},
      },
    ],
    children: [],
  },
  {
    id: 'check_done',
    type: 'checkListItem',
    props: {
      checked: true,
      textColor: 'default',
      backgroundColor: 'default',
      textAlignment: 'left',
    },
    content: [
      {
        type: 'AI-Edit',
        old_text: '已 proofread abstract (EN)',
        new_text: '已完成英文摘要校对',
        styles: {},
      },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 23：折叠列表 — 标题行 diff，子块为新增段落
  // ────────────────────────────────────────────────────────────
  {
    id: 'toggle_outline',
    type: 'toggleListItem',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      {
        type: 'AI-Edit',
        old_text: '附录：补充材料（draft）',
        new_text: '附录：补充材料（定稿）',
        styles: {},
      },
    ],
    children: [
      {
        id: 'toggle_child_paragraph',
        type: 'paragraph',
        props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
        content: [
          {
            type: 'AI-Create',
            text: '此处可附超参数表、额外消融实验曲线与开源仓库链接。',
            styles: {},
          },
        ],
        children: [],
      },
      {
        id: 'toggle_child_paragraph',
        type: 'paragraph',
        props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
        content: [
          {
            type: 'AI-Delete',
            text: '666666666666',
            styles: {},
          },
        ],
        children: [],
      },
    ],
  },
  {
    id: 'toggle_pure_create',
    type: 'toggleListItem',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      {
        type: 'AI-Create',
        text: '新增折叠列表：仅新版本存在（用于验证 oldOnly 下父块整体折叠）。',
        styles: {},
      },
    ],
    children: [],
  },
  {
    id: 'toggle_pure_delete',
    type: 'toggleListItem',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      {
        type: 'AI-Delete',
        text: '删除折叠列表：仅旧版本存在（用于验证 newOnly 下父块整体折叠）。',
        styles: {},
      },
    ],
    children: [],
  },
  {
    id: 'toggle_pure_create_with_children',
    type: 'toggleListItem',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      {
        type: 'AI-Create',
        text: '新增折叠列表（带子块）：用于验证父块折叠时子块也一并折叠。',
        styles: {},
      },
    ],
    children: [
      {
        id: 'toggle_pure_create_child_plain',
        type: 'paragraph',
        props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
        content: [
          {
            type: 'text',
            text: '子块（plain text）：父块在 oldOnly 折叠时，该子块不应单独残留。',
            styles: {},
          },
        ],
        children: [],
      },
    ],
  },
  {
    id: 'toggle_pure_delete_with_children',
    type: 'toggleListItem',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      {
        type: 'AI-Delete',
        text: '删除折叠列表（带子块）：用于验证父块折叠时子块也一并折叠。',
        styles: {},
      },
    ],
    children: [
      {
        id: 'toggle_pure_delete_child_plain',
        type: 'paragraph',
        props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
        content: [
          {
            type: 'text',
            text: '子块（plain text）：父块在 newOnly 折叠时，该子块不应单独残留。',
            styles: {},
          },
        ],
        children: [],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 24：行间公式块 — AI-Edit（展示旧式/新式写法）
  // ────────────────────────────────────────────────────────────
  {
    id: 'math_block_edit',
    type: 'math',
    props: { expression: '' },
    content: [
      {
        type: 'AI-Edit',
        old_text: '\\int_0^1 x^2\\,dx = \\frac{1}{3}',
        new_text: '\\int_{0}^{1} x^{2}\\,\\mathrm{d}x = \\tfrac{1}{3}',
        styles: {},
      },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 25：行间公式块 — AI-Create
  // ────────────────────────────────────────────────────────────
  {
    id: 'math_block_create',
    type: 'math',
    props: { expression: '' },
    content: [
      {
        type: 'AI-Create',
        text: '\\hat{\\beta} = (X^{\\top}X)^{-1}X^{\\top}y',
        styles: {},
      },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 26：行间公式块 — AI-Delete
  // ────────────────────────────────────────────────────────────
  {
    id: 'math_block_delete',
    type: 'math',
    props: { expression: '' },
    content: [
      {
        type: 'AI-Delete',
        text: 'a^2 + b^2 = c^2 \\quad \\text{(错位示例，整段删)}',
        styles: {},
      },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 27：行内公式 — edit
  // 期望：compare 模式下同时显示旧公式/新公式，并支持 Keep / Undo
  // ────────────────────────────────────────────────────────────
  {
    id: 'p_inline_math_edit',
    type: 'paragraph',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      { type: 'text', text: '积分结果可写为 ', styles: {} },
      {
        type: 'inlineMath',
        props: {
          autoOpenEdit: false,
          aiDiffType: 'edit',
          aiDiffOrigin: '\\frac{1}{5}',
          aiDiffReplace: '\\tfrac{1}{9}',
        },
      },
      { type: 'text', text: '，与上文记号保持一致。', styles: {} },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 28：行内公式 — create
  // 期望：OLD_ONLY 隐藏，NEW_ONLY / COMPARE 显示新增公式
  // ────────────────────────────────────────────────────────────
  {
    id: 'p_inline_math_create',
    type: 'paragraph',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      { type: 'text', text: '根据推导可补充方差项 ', styles: {} },
      {
        type: 'inlineMath',
        props: {
          autoOpenEdit: false,
          aiDiffType: 'create',
          aiDiffOrigin: '',
          aiDiffReplace: '\\sigma^2',
        },
      },
      { type: 'text', text: ' 以说明噪声规模。', styles: {} },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 29：行内公式 — delete
  // 期望：NEW_ONLY 隐藏，OLD_ONLY / COMPARE 显示待删除公式
  // ────────────────────────────────────────────────────────────
  {
    id: 'p_inline_math_delete',
    type: 'paragraph',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      { type: 'text', text: '原稿中的冗余占位公式 ', styles: {} },
      {
        type: 'inlineMath',
        props: {
          autoOpenEdit: false,
          aiDiffType: 'delete',
          aiDiffOrigin: 'x_0 + y_0 = z_0',
          aiDiffReplace: '',
        },
      },
      { type: 'text', text: ' 已不再需要。', styles: {} },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 30：link — create
  // 期望：compare 模式下显示为带链接样式的新增 diff，并支持 Keep / Undo
  // ────────────────────────────────────────────────────────────
  {
    id: 'p_link_create',
    type: 'paragraph',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      { type: 'text', text: '更多背景资料可参见 ', styles: {} },
      {
        type: 'link',
        href: 'https://example.com/reference/new-paper',
        aiDiffType: 'create',
        content: [{ type: 'text', text: '99999999', styles: {} }],
      },
      { type: 'text', text: '，便于继续核对来源。', styles: {} },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 31：link — delete
  // 期望：compare 模式下显示为带链接样式的删除 diff，并支持 Keep / Undo
  // ────────────────────────────────────────────────────────────
  {
    id: 'p_link_delete',
    type: 'paragraph',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      { type: 'text', text: '原文中的链接说明 ', styles: {} },
      {
        type: 'link',
        href: 'https://example.com/reference/old-paper',
        aiDiffType: 'delete',
        content: [{ type: 'text', text: '8888888888', styles: {} }],
      },
      { type: 'text', text: ' 已被移除。', styles: {} },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 32：空白/窄字符类 formatChange（窄不间断空格、连字符）
  // ────────────────────────────────────────────────────────────
  {
    id: 'p_format_nbsp_hyphen',
    type: 'paragraph',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      {
        type: 'AI-Edit',
        old_text: '产品代号\u00A0MN‑02 与型号 MN-02 在不同文档中不一致。',
        new_text: '产品代号 MN-02 与型号 MN-02 现已统一写法。',
        styles: {},
      },
    ],
    children: [],
  },

  // ────────────────────────────────────────────────────────────
  // 场景 33：邮件/版本号/文件名式中英混排
  {
    id: 'p_meta_strings',
    type: 'paragraph',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      {
        type: 'AI-Edit',
        old_text:
          '请联系 tech.lead@company.com；附件名 report_final_v2(1).pdf 与 changelog.md 已更新。',
        new_text: '请联系 tech-lead@company.com；附件 report_final_v2.pdf 与 CHANGELOG.md 已更新。',
        styles: {},
      },
    ],
    children: [],
  },
] as const;
