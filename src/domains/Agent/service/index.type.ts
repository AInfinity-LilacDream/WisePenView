import type { AgentDetail, AgentSpec } from '../entity/agent';

export interface UploadAgentAssetRequest {
  file: File;
  path?: string;
}

export interface IAgentService {
  createAgent(title: string, name?: string, description?: string): Promise<string>;
  getAgentDetail(resourceId: string, version?: number): Promise<AgentDetail>;
  updateAgentInfo(resourceId: string, name?: string, description?: string): Promise<void>;
  updateAgentSpec(resourceId: string, draftVersion: number, spec: AgentSpec): Promise<void>;
  publishVersion(resourceId: string): Promise<void>;
  uploadAsset(
    resourceId: string,
    draftVersion: number,
    request: UploadAgentAssetRequest
  ): Promise<void>;
  deleteAssets(resourceId: string, draftVersion: number, assetIds: string[]): Promise<void>;
}
