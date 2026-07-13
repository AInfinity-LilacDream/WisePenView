import { describe, expect, it } from 'vitest';

import { resolveNoteCommentsRuntimePolicy } from './commentPolicy';

describe('resolveNoteCommentsRuntimePolicy', () => {
  it.each([
    [
      { kind: 'disabled' as const },
      { enabled: false, uiEnabled: false, authorizable: false, writable: false },
    ],
    [
      { kind: 'connecting' as const, authorizable: true },
      { enabled: true, uiEnabled: false, authorizable: true, writable: false },
    ],
    [
      { kind: 'readOnly' as const },
      { enabled: true, uiEnabled: true, authorizable: false, writable: false },
    ],
    [
      { kind: 'writable' as const },
      { enabled: true, uiEnabled: true, authorizable: true, writable: true },
    ],
  ])('将 %o 映射为唯一运行时策略', (status, expected) => {
    expect(resolveNoteCommentsRuntimePolicy(status)).toEqual(expected);
  });
});
