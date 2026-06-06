import { apiGet, apiPost } from '@/apis/request';
import type {
  GetUserInteractionRecordApiRequest,
  GetUserInteractionRecordApiResponse,
  RateApiRequest,
  ReadApiRequest,
  ToggleLikeApiRequest,
} from './InteractApi.type';

/** /resource/interaction/* 子路由 API */
function toggleLike(req: ToggleLikeApiRequest): Promise<void> {
  return apiPost('/resource/interaction/toggleLike', req);
}

function rate(req: RateApiRequest): Promise<void> {
  return apiPost('/resource/interaction/rate', req);
}

function read(req: ReadApiRequest): Promise<void> {
  return apiPost('/resource/interaction/read', req);
}

function getUserInteractionRecord(
  req: GetUserInteractionRecordApiRequest
): Promise<GetUserInteractionRecordApiResponse> {
  return apiGet('/resource/interaction/getResourceUserInteractionRecord', { params: req });
}

export const ResourceInteractApi = { toggleLike, rate, read, getUserInteractionRecord };
