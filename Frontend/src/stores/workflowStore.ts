import { create } from 'zustand';
import { Connection, Edge, Node } from '@xyflow/react';

export interface WorkflowData {
  id: string;
  name: string;
  status: 'READY' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  schedule: string;
  agents: number;
  testSuites: number;
  expectedDuration: string;
}

export interface WorkflowNode extends Node {
  type: 'schedule-trigger' | 'agent-selector' | 'test-suite' | 
        'parallel-executor' | 'results-aggregator' | 'notification';
  data: {
    name: string;
    [key: string]: any;
  };
}

export interface WorkflowConnection extends Connection {
  from: string;
  to: string;
}

interface SavedWorkflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: Edge[];
  savedAt: string;
}

interface WorkflowStore {
  workflow: WorkflowData;
  nodes: WorkflowNode[];
  edges: Edge[];
  selectedNode: WorkflowNode | null;
  isExecuting: boolean;
  savedWorkflows: SavedWorkflow[];
  
  // Actions
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  setSelectedNode: (node: WorkflowNode | null) => void;
  updateNodeData: (nodeId: string, data: Partial<WorkflowNode['data']>) => void;
  addNode: (node: WorkflowNode) => void;
  removeNode: (nodeId: string) => void;
  executeWorkflow: () => void;
  stopExecution: () => void;
  updateNodeStatus: (nodeId: string, status: 'idle' | 'running' | 'success' | 'error') => void;
  saveWorkflow: (name: string) => void;
  loadWorkflow: (id: string) => void;
  deleteWorkflow: (id: string) => void;
}

const initialWorkflow: WorkflowData = {
  id: 'batch-test-manufacturing-001',
  name: 'Manufacturing Batch Test Pipeline',
  status: 'READY',
  schedule: 'Every Thursday 2AM',
  agents: 12,
  testSuites: 3,
  expectedDuration: '45 minutes'
};

const initialNodes: WorkflowNode[] = [
  {
    id: 'trigger-1',
    type: 'schedule-trigger',
    position: { x: 100, y: 200 },
    data: { name: 'Weekly Trigger', cron: '0 2 * * 4' }
  },
  {
    id: 'agent-select-1',
    type: 'agent-selector',
    position: { x: 300, y: 200 },
    data: {
      name: 'Select 12 Agents',
      agents: ['SupplierAgent v1.0', 'Procurement Agent v1.0', 'Downtime Analysis Agent v1.0'],
      businessUnit: 'Manufacturing'
    }
  },
  {
    id: 'test-suite-1',
    type: 'test-suite',
    position: { x: 500, y: 100 },
    data: {
      name: 'Manufacturing Safety Suite',
      tests: 45,
      dimensions: ['Accuracy', 'Bias', 'Robustness', 'Resilience']
    }
  },
  {
    id: 'parallel-1',
    type: 'parallel-executor',
    position: { x: 700, y: 200 },
    data: { name: 'Run Tests Parallel', maxConcurrent: 4 }
  },
  {
    id: 'results-aggregator-1',
    type: 'results-aggregator',
    position: { x: 900, y: 200 },
    data: { name: 'Aggregate Results', passThreshold: 88 }
  },
  {
    id: 'notification-1',
    type: 'notification',
    position: { x: 1100, y: 200 },
    data: {
      name: 'Send Report',
      channels: ['slack', 'email', 'teams'],
      recipients: ['engineering@company.com']
    }
  }
];

const initialEdges: Edge[] = [
  { id: 'trigger-1-agent-select-1', source: 'trigger-1', target: 'agent-select-1' },
  { id: 'agent-select-1-test-suite-1', source: 'agent-select-1', target: 'test-suite-1' },
  { id: 'test-suite-1-parallel-1', source: 'test-suite-1', target: 'parallel-1' },
  { id: 'parallel-1-results-aggregator-1', source: 'parallel-1', target: 'results-aggregator-1' },
  { id: 'results-aggregator-1-notification-1', source: 'results-aggregator-1', target: 'notification-1' }
];

// Load from localStorage
const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem('workflow-nodes');
    const savedEdges = localStorage.getItem('workflow-edges');
    const savedWorkflows = localStorage.getItem('saved-workflows');
    return {
      nodes: saved ? JSON.parse(saved) : [],
      edges: savedEdges ? JSON.parse(savedEdges) : [],
      savedWorkflows: savedWorkflows ? JSON.parse(savedWorkflows) : []
    };
  } catch (error) {
    console.error('Error loading from storage:', error);
    return { nodes: [], edges: [], savedWorkflows: [] };
  }
};

const saveToStorage = (nodes: WorkflowNode[], edges: Edge[]) => {
  try {
    localStorage.setItem('workflow-nodes', JSON.stringify(nodes));
    localStorage.setItem('workflow-edges', JSON.stringify(edges));
  } catch (error) {
    console.error('Error saving to storage:', error);
  }
};

const initialStorage = loadFromStorage();

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflow: initialWorkflow,
  nodes: initialStorage.nodes,
  edges: initialStorage.edges,
  selectedNode: null,
  isExecuting: false,
  savedWorkflows: initialStorage.savedWorkflows,

  setNodes: (nodes) => {
    saveToStorage(nodes, get().edges);
    set({ nodes });
  },
  
  setEdges: (edges) => {
    saveToStorage(get().nodes, edges);
    set({ edges });
  },
  
  setSelectedNode: (node) => set({ selectedNode: node }),
  
  updateNodeData: (nodeId, data) => {
    const newNodes = get().nodes.map((node) =>
      node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
    );
    saveToStorage(newNodes, get().edges);
    set({ nodes: newNodes });
  },
  
  addNode: (node) => {
    const newNodes = [...get().nodes, node];
    saveToStorage(newNodes, get().edges);
    set({ nodes: newNodes });
  },
  
  removeNode: (nodeId) => {
    const newNodes = get().nodes.filter((node) => node.id !== nodeId);
    const newEdges = get().edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);
    saveToStorage(newNodes, newEdges);
    set({ nodes: newNodes, edges: newEdges });
  },
  
  executeWorkflow: () => {
    set({ isExecuting: true });
    // Simulate workflow execution - all nodes pass with 3-second animations
    const nodes = get().nodes;
    
    if (nodes.length === 0) {
      set({ isExecuting: false });
      return;
    }

    nodes.forEach((node, index) => {
      setTimeout(() => {
        // Set to running status
        get().updateNodeStatus(node.id, 'running');
        
        // After 3 seconds, set to success (green/pass)
        setTimeout(() => {
          get().updateNodeStatus(node.id, 'success');
          
          // If this is the last node, mark execution as complete
          if (index === nodes.length - 1) {
            setTimeout(() => {
              set({ isExecuting: false });
            }, 500);
          }
        }, 3000); // 3 seconds animation per node
      }, index * 3500); // Start next node 3.5 seconds after previous
    });
  },
  
  stopExecution: () => set({ isExecuting: false }),
  
  updateNodeStatus: (nodeId, status) => {
    const newNodes = get().nodes.map((node) =>
      node.id === nodeId ? { ...node, data: { ...node.data, status } } : node
    );
    saveToStorage(newNodes, get().edges);
    set({ nodes: newNodes });
  },

  saveWorkflow: (name) => {
    const { nodes, edges, savedWorkflows } = get();
    const newWorkflow: SavedWorkflow = {
      id: `workflow-${Date.now()}`,
      name,
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      savedAt: new Date().toISOString()
    };
    const updatedWorkflows = [...savedWorkflows, newWorkflow];
    localStorage.setItem('saved-workflows', JSON.stringify(updatedWorkflows));
    set({ savedWorkflows: updatedWorkflows });
  },

  loadWorkflow: (id) => {
    const { savedWorkflows } = get();
    const workflow = savedWorkflows.find(w => w.id === id);
    if (workflow) {
      saveToStorage(workflow.nodes, workflow.edges);
      set({ nodes: workflow.nodes, edges: workflow.edges });
    }
  },

  deleteWorkflow: (id) => {
    const { savedWorkflows } = get();
    const updatedWorkflows = savedWorkflows.filter(w => w.id !== id);
    localStorage.setItem('saved-workflows', JSON.stringify(updatedWorkflows));
    set({ savedWorkflows: updatedWorkflows });
  }
}));

export type { SavedWorkflow };
