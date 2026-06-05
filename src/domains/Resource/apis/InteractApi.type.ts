/** POST /resource/interaction/toggleLike 请求体 */
export interface ToggleLikeApiRequest {
  resourceId: string;
}

/** POST /resource/interaction/rate 请求体 */
export interface RateApiRequest {
  resourceId: string;
  /** 1–5 整数 */
  score: number;
}

/** POST /resource/interaction/read 请求体 */
export interface ReadApiRequest {
  resourceId: string;
}
