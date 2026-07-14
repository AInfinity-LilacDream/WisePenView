import type { AgentDetail } from '../entity/agent';
import { DEFAULT_AGENT_SPEC } from '../mapper/AgentServices.map';
import type { IAgentService } from '../service/index.type';

const mockAgent: AgentDetail = {
  resourceId: 'mock-agent',
  title: '研究助手',
  name: '',
  description: '',
  publishedVersion: 0,
  draftVersion: 1,
  version: 1,
  status: 'DRAFT',
  spec: structuredClone(DEFAULT_AGENT_SPEC),
  assets: [],
  isOwner: true,
};

export const AgentServicesMock: IAgentService = {
  async createAgent() {
    return mockAgent.resourceId;
  },
  async getAgentDetail(resourceId) {
    return { ...structuredClone(mockAgent), resourceId };
  },
  async updateAgentInfo(_resourceId, name, description) {
    mockAgent.name = name ?? '';
    mockAgent.description = description ?? '';
  },
  async updateAgentSpec(_resourceId, _draftVersion, spec) {
    mockAgent.spec = structuredClone(spec);
  },
  async publishVersion() {
    mockAgent.publishedVersion += 1;
    mockAgent.draftVersion += 1;
  },
  async uploadAsset() {},
  async deleteAssets() {},
};
