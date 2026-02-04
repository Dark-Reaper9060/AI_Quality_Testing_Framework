import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Clock, Users, CheckSquare, Zap, BarChart3, Bell, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { WorkflowNode } from '@/stores/workflowStore';

const nodeIcons = {
  'schedule-trigger': Clock,
  'agent-selector': Users,
  'test-suite': CheckSquare,
  'parallel-executor': Zap,
  'results-aggregator': BarChart3,
  'notification': Bell
};

const nodeColors = {
  'schedule-trigger': 'border-slate-500 bg-slate-500/10',
  'agent-selector': 'border-slate-500 bg-slate-500/10',
  'test-suite': 'border-slate-500 bg-slate-500/10',
  'parallel-executor': 'border-slate-500 bg-slate-500/10',
  'results-aggregator': 'border-slate-500 bg-slate-500/10',
  'notification': 'border-slate-500 bg-slate-500/10'
};

const statusConfig = {
  idle: { label: 'Ready', color: 'bg-gray-500', icon: null, animation: '' },
  running: { label: 'Running', color: 'bg-blue-500 animate-pulse', icon: <Loader2 className="w-3 h-3 animate-spin" />, animation: 'animate-pulse' },
  success: { label: 'Pass', color: 'bg-green-500', icon: <CheckCircle className="w-3 h-3" />, animation: 'animate-bounce' },
  error: { label: 'Fail', color: 'bg-red-500', icon: <XCircle className="w-3 h-3" />, animation: 'animate-pulse' }
};

export const CustomNode = memo(({ data, selected }: NodeProps) => {
  const Icon = nodeIcons[data.type as keyof typeof nodeIcons] || Clock;
  const colorClass = nodeColors[data.type as keyof typeof nodeColors] || 'border-gray-500 bg-gray-500/10';
  const status = data.status as keyof typeof statusConfig || 'idle';
  const statusInfo = statusConfig[status];

  return (
    <div className={`relative min-w-[200px] max-w-[250px] border-2 rounded-lg p-3 bg-slate-900 text-white transition-all duration-500 ${colorClass} ${selected ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900' : ''} ${status === 'running' ? 'scale-105 shadow-xl' : ''}`}>
      {/* Status Badge with Animation */}
      <div className={`absolute -top-2 -right-2 ${statusInfo.color} text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg transition-all duration-500 ${statusInfo.animation}`}>
        {statusInfo.icon}
        <span>{statusInfo.label}</span>
      </div>
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-600 border-2 border-gray-400"
      />
      
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="w-5 h-5 text-gray-300" />}
        <span className="font-medium text-sm truncate">{data.name as string}</span>
      </div>
      
      {/* Node-specific content */}
      <div className="text-xs text-gray-400 space-y-1">
        {data.type === 'schedule-trigger' && (
          <div>Cron: {data.cron as string}</div>
        )}
        
        {data.type === 'agent-selector' && (
          <React.Fragment>
            <div>Business Unit: {data.businessUnit as string}</div>
            <div>Agents: {Array.isArray(data.agents) ? data.agents.length : data.agents as number}</div>
          </React.Fragment>
        )}
        
        {data.type === 'test-suite' && (
          <React.Fragment>
            <div>Tests: {data.tests as number}</div>
            <div>Dimensions: {Array.isArray(data.dimensions) ? (data.dimensions as string[]).join(', ') : ''}</div>
          </React.Fragment>
        )}
        
        {data.type === 'parallel-executor' && (
          <div>Max Concurrent: {data.maxConcurrent as number}</div>
        )}
        
        {data.type === 'results-aggregator' && (
          <div>Pass Threshold: {data.passThreshold as number}%</div>
        )}
        
        {data.type === 'notification' && (
          <React.Fragment>
            <div>Channels: {Array.isArray(data.channels) ? (data.channels as string[]).join(', ') : ''}</div>
            <div>Recipients: {Array.isArray(data.recipients) ? (data.recipients as string[]).length : 0}</div>
          </React.Fragment>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-gray-600 border-2 border-gray-400"
      />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

export default CustomNode;
