import { apiGet, apiPost } from '@/apis/request';
import type {
  AddTagApiRequest,
  ChangeTagApiRequest,
  GetTagTreeApiRequest,
  GetTagTreeApiResponse,
  MoveTagApiRequest,
  RemoveTagApiRequest,
} from './TagApi.type';

function getTagTree(req?: GetTagTreeApiRequest): Promise<GetTagTreeApiResponse> {
  return apiGet('/resource/tag/getTagTree', { params: req });
}

function addTag(req: AddTagApiRequest): Promise<string> {
  return apiPost('/resource/tag/addTag', req);
}

function changeTag(req: ChangeTagApiRequest): Promise<void> {
  return apiPost('/resource/tag/changeTag', req);
}

function removeTag(req: RemoveTagApiRequest): Promise<void> {
  return apiPost('/resource/tag/removeTag', req);
}

function moveTag(req: MoveTagApiRequest): Promise<void> {
  return apiPost('/resource/tag/moveTag', req);
}

export const TagApi = {
  getTagTree,
  addTag,
  changeTag,
  removeTag,
  moveTag,
};
