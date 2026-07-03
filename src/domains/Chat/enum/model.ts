export const MODEL_PROVIDER_ID = {
  ZHIZENGZENG: 1,
  APIYI: 2,
  MODELSCOPE: 3,
} as const;

export type ModelProviderId = (typeof MODEL_PROVIDER_ID)[keyof typeof MODEL_PROVIDER_ID];

export const MODEL_TYPE = {
  CUSTOM_MODEL: 0,
  STANDARD_MODEL: 1,
  ADVANCED_MODEL: 2,
  UNKNOWN_MODEL: 3,
} as const;

export type ModelType = (typeof MODEL_TYPE)[keyof typeof MODEL_TYPE];
