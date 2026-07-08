/** 与后端 OpenAPI 一致的标准 API 响应体 */
export interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

/** 与 Java 后端 PageR<T> 一致的标准分页响应体 */
export interface PageR<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  totalPage: number;
}

/** HTTP 4xx/5xx 时响应体可能携带的业务错误字段 */
export interface ApiErrorBody {
  code?: number;
  msg?: string;
  /** 部分网关/框架使用 message 而非 msg */
  message?: string;
}
