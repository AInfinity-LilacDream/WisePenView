export interface ResourceCommentSectionProps {
  resourceId: string;
  resourceOwnerId?: string | null;
  totalCommentCount?: number | null;
  onCommentsChanged?(): unknown | Promise<unknown>;
}
