import type { SearchScope } from '@/domains/Resource';

export interface SearchResultListProps {
  keyword: string;
  scope: SearchScope;
  onClose: () => void;
}
