export interface NoteRichTextAiDiffConfig {
  hunk: {
    highChangeRatio: number;
    maxGapCharacters: number;
    maxGapTokens: number;
    maxMergedCharacters: number;
  };
  limits: {
    maxMatrixCells: number;
  };
}

interface NoteConfig {
  aiDiff: {
    richText: NoteRichTextAiDiffConfig;
  };
}

/** Note 的静态行为配置；回归调参统一从组合根注入。 */
export const noteConfig = {
  aiDiff: {
    richText: {
      hunk: {
        highChangeRatio: 0.6,
        maxGapCharacters: 5,
        maxGapTokens: 3,
        maxMergedCharacters: 100,
      },
      limits: {
        maxMatrixCells: 250_000,
      },
    },
  },
} as const satisfies NoteConfig;
