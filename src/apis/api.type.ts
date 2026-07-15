/** 与后端 OpenAPI 一致的标准 API 响应体 */
export interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

/** 数字枚举经 JSON 序列化后可能返回数值或对应字符串。 */
export type NumericEnumApiValue<Value extends number = number> = Value | `${Value}`;

/** Java Long 经 JSON 序列化后可能返回数字或十进制字符串。 */
export type JavaLongApiValue = NumericEnumApiValue;

/** Java 分页接口的公共请求参数。 */
export interface PageApiRequest {
  page: number;
  size: number;
}

export type OptionalPageApiRequest = Partial<PageApiRequest>;

/** 与 Java 后端 PageR<T> 一致的标准分页响应体 */
export interface PageR<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  totalPage: number;
}

/** OSS STS 接口返回的临时凭证。 */
export interface OssStsTokenApiResponse {
  accessKeyId?: string;
  accessKeySecret?: string;
  securityToken?: string;
  bucket?: string;
  region?: string;
  endpoint?: string;
  expiration?: string;
}

/** HTTP 4xx/5xx 时响应体可能携带的业务错误字段 */
export interface ApiErrorBody {
  code?: number;
  msg?: string;
  /** 部分网关/框架使用 message 而非 msg */
  message?: string;
}
