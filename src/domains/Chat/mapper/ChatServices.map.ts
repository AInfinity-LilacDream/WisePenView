import type {
  CreateSessionApiRequest,
  CreateSessionApiResponse,
  ListHistoryMessagesApiRequest,
  ListHistoryMessagesApiResponse,
  ListModelsApiResponse,
  ListSessionsApiRequest,
  ListSessionsApiResponse,
  RenameSessionApiRequest,
  RenameSessionApiResponse,
} from '../apis/ChatApi.type';
import type {
  ChatSession,
  CreateSessionRequest,
  ListHistoryMessagesRequest,
  ListSessionsRequest,
  MessageResponse,
  ModelListResponse,
  PageResult,
  RenameSessionRequest,
} from '../service/index.type';

const mapGetModelsFromApi = (data: ListModelsApiResponse): ModelListResponse => ({
  system_models: data.system_models,
  user_models: data.user_models,
});

const mapCreateSessionRequest = (params?: CreateSessionRequest): CreateSessionApiRequest => {
  const title = params?.title;
  const hasTitle = title !== undefined;

  return {
    ...(hasTitle ? { title } : {}),
  };
};

const mapCreateSessionFromApi = (data: CreateSessionApiResponse): ChatSession => data;

const mapRenameSessionRequest = (params: RenameSessionRequest): RenameSessionApiRequest => {
  const newTitle = params.newTitle;
  const hasNewTitle = newTitle !== undefined;

  return {
    sessionId: params.sessionId,
    ...(hasNewTitle ? { newTitle } : {}),
  };
};

const mapRenameSessionFromApi = (data: RenameSessionApiResponse): ChatSession => data;

const mapListSessionsRequest = (params?: ListSessionsRequest): ListSessionsApiRequest => ({
  ...(params?.page !== undefined ? { page: params.page } : {}),
  ...(params?.size !== undefined ? { size: params.size } : {}),
});

const mapListSessionsFromApi = (data: ListSessionsApiResponse): PageResult<ChatSession> => {
  const totalPage = data.totalPage ?? data.total_page ?? 1;
  return {
    list: data.list,
    total: data.total,
    page: data.page,
    size: data.size,
    totalPage,
  };
};

const mapListHistoryMessagesRequest = (
  params: ListHistoryMessagesRequest
): ListHistoryMessagesApiRequest => ({
  sessionId: params.sessionId,
  ...(params.page !== undefined ? { page: params.page } : {}),
  ...(params.size !== undefined ? { size: params.size } : {}),
});

const mapListHistoryMessagesFromApi = (
  data: ListHistoryMessagesApiResponse
): PageResult<MessageResponse> => {
  const totalPage = data.totalPage ?? data.total_page ?? 1;
  return {
    list: data.list,
    total: data.total,
    page: data.page,
    size: data.size,
    totalPage,
  };
};

export const ChatServicesMap = {
  mapGetModelsFromApi,
  mapCreateSessionRequest,
  mapCreateSessionFromApi,
  mapRenameSessionRequest,
  mapRenameSessionFromApi,
  mapListSessionsRequest,
  mapListSessionsFromApi,
  mapListHistoryMessagesRequest,
  mapListHistoryMessagesFromApi,
};
