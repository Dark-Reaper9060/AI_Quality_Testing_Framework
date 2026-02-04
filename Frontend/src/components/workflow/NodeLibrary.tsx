import { Clock, Users, CheckSquare, Zap, BarChart3, Bell } from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflowStore';

const nodeTemplates = [
  {
    type: 'schedule-trigger',
    name: 'Schedule Trigger',
    icon: Clock,
    description: 'Trigger workflow on schedule',
    color: 'border-slate-500 bg-slate-500/10 hover:border-slate-400',
    defaultData: {
      name: 'Schedule Trigger',
      cron: '0 2 * * 4'
    }
  },
  {
    type: 'agent-selector',
    name: 'Agent Selector',
    icon: Users,
    description: 'Select test agents',
    color: 'border-slate-500 bg-slate-500/10 hover:border-slate-400',
    defaultData: {
      name: 'Agent Selector',
      agents: [],
      businessUnit: 'Manufacturing'
    }
  },
  {
    type: 'test-suite',
    name: 'Test Suite',
    icon: CheckSquare,
    description: 'Define test cases',
    color: 'border-slate-500 bg-slate-500/10 hover:border-slate-400',
    defaultData: {
      name: 'Test Suite',
      tests: 0,
      dimensions: ['Accuracy', 'Bias', 'Robustness', 'Resilience']
    }
  },
  {
    type: 'parallel-executor',
    name: 'Parallel Executor',
    icon: Zap,
    description: 'Run tests in parallel',
    color: 'border-slate-500 bg-slate-500/10 hover:border-slate-400',
    defaultData: {
      name: 'Parallel Executor',
      maxConcurrent: 4
    }
  },
  {
    type: 'results-aggregator',
    name: 'Results Aggregator',
    icon: BarChart3,
    description: 'Aggregate test results',
    color: 'border-slate-500 bg-slate-500/10 hover:border-slate-400',
    defaultData: {
      name: 'Results Aggregator',
      passThreshold: 88
    }
  },
  {
    type: 'notification',
    name: 'Notification',
    icon: Bell,
    description: 'Send notifications',
    color: 'border-slate-500 bg-slate-500/10 hover:border-slate-400',
    defaultData: {
      name: 'Notification',
      channels: ['email'],
      recipients: []
    }
  }
];

export const NodeLibrary = () => {
  const { addNode } = useWorkflowStore();

  const handleDragStart = (event: React.DragEvent, nodeType: string, defaultData: any) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow-data', JSON.stringify(defaultData));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-white mb-4">Node Library</h2>
      
      <div className="space-y-3">
        {nodeTemplates.map((template) => {
          const Icon = template.icon;
          
          return (
            <div
              key={template.type}
              draggable
              onDragStart={(e) => handleDragStart(e, template.type, template.defaultData)}
              className={`border-2 rounded-lg p-3 cursor-move transition-all hover:scale-105 ${template.color} bg-slate-900 text-white`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5 text-gray-300" />
                <span className="font-medium text-sm">{template.name}</span>
              </div>
              <p className="text-xs text-gray-400">{template.description}</p>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 p-3 bg-slate-700 rounded-lg">
        <h3 className="text-sm font-medium text-white mb-2">How to use:</h3>
        <ul className="text-xs text-gray-300 space-y-1">
          <li>• Drag nodes to canvas</li>
          <li>• Click to select nodes</li>
          <li>• Connect nodes by dragging handles</li>
          <li>• Edit properties in right panel</li>
        </ul>
      </div>
    </div>
  );
};
