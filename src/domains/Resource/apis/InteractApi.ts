import { apiPost } from '@/apis/request';
import type { RateApiRequest, ReadApiRequest, ToggleLikeApiRequest } from './InteractApi.type';

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

export const ResourceInteractApi = { toggleLike, rate, read };
