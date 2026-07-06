import { apiGet, apiPost } from '@/apis/request';
import type {
  CreateSessionApiRequest,
  CreateSessionApiResponse,
  DeleteSessionApiRequest,
  DeleteSessionApiResponse,
  InitTemporaryAttachmentUploadApiRequest,
  InitTemporaryAttachmentUploadApiResponse,
  ListHistoryMessagesApiRequest,
  ListHistoryMessagesApiResponse,
  ListModelsApiResponse,
  ListSessionsApiRequest,
  ListSessionsApiResponse,
  RenameSessionApiRequest,
  RenameSessionApiResponse,
} from './ChatApi.type';

/** Chat API: /chat/* */

function listModels(): Promise<ListModelsApiResponse> {
  return apiGet('/chat/model/listAvailableModels');
}

function initTemporaryAttachmentUpload(
  req: InitTemporaryAttachmentUploadApiRequest
): Promise<InitTemporaryAttachmentUploadApiResponse> {
  return apiPost('/chat/attachment/initUploadTemporaryAttachment', req);
}

export const ChatApi = {
  listModels,
  initTemporaryAttachmentUpload,
};

/** Chat Session API: /chat/session/* */

function createSession(req: CreateSessionApiRequest): Promise<CreateSessionApiResponse> {
  return apiPost('/chat/session/createSession', req);
}

function renameSession(req: RenameSessionApiRequest): Promise<RenameSessionApiResponse> {
  return apiPost(
    '/chat/session/renameSession',
    { new_title: req.new_title },
    {
      params: { session_id: req.session_id },
    }
  );
}

function deleteSession(req: DeleteSessionApiRequest): Promise<DeleteSessionApiResponse> {
  return apiPost('/chat/session/deleteSession', undefined, {
    params: { session_id: req.session_id },
  });
}

function listSessions(req: ListSessionsApiRequest): Promise<ListSessionsApiResponse> {
  return apiGet('/chat/session/listSessions', { params: req });
}

function listHistoryMessages(
  req: ListHistoryMessagesApiRequest
): Promise<ListHistoryMessagesApiResponse> {
  return apiGet('/chat/session/listHistoryMessages', {
    params: req,
  });
}

export const ChatSessionApi = {
  createSession,
  renameSession,
  deleteSession,
  listSessions,
  listHistoryMessages,
};
