import CustomNode from './CustomNode';

export const nodeTypes = {
  'schedule-trigger': CustomNode,
  'agent-selector': CustomNode,
  'test-suite': CustomNode,
  'parallel-executor': CustomNode,
  'results-aggregator': CustomNode,
  'notification': CustomNode,
};
