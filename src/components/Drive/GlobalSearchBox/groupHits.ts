import type { SearchHitItem } from '@/domains/Resource';

export interface SearchHitGroup {
  key: string;
  label: string;
  items: SearchHitItem[];
}

/** 按 resourceType 桶排；Map 插入序保留后端相关性顺序 */
export function groupHits(hits: SearchHitItem[]): SearchHitGroup[] {
  const buckets = new Map<string, SearchHitItem[]>();
  for (const hit of hits) {
    const bucket = buckets.get(hit.resourceType);
    if (bucket) {
      bucket.push(hit);
    } else {
      buckets.set(hit.resourceType, [hit]);
    }
  }
  return [...buckets.entries()].map(([key, items]) => ({
    key,
    label: key === 'note' ? 'Note' : key.toUpperCase(),
    items,
  }));
}
