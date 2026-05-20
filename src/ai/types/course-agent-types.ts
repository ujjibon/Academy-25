export type AgentStepStatus = 'pending' | 'running' | 'done' | 'error';

export type AgentStep = {
  id: string;
  label: string;
  status: AgentStepStatus;
  detail?: string;
};
