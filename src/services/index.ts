/**
 * services - 业务 Service 统一对外入口（barrel）
 *
 * 业务组件/视图请从 `@/services` 取用 ServicesProvider 与各 useXxxService，
 * 不要直接 import `@/services/_registry/*`（内部装配细节）。
 */

export {
  ServicesProvider,
  useAuthService,
  useChatService,
  useDocumentService,
  useFolderService,
  useGroupService,
  useImageService,
  useNoteService,
  useQuotaService,
  useResourceService,
  useStickerService,
  useTagService,
  useUserService,
  useWalletService,
} from './_registry';
export type { ServicesContextValue } from './_registry';
