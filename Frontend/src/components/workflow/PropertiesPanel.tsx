import { useState } from 'react';
import { Clock, Users, CheckSquare, Zap, BarChart3, Bell, Trash2, Upload, X } from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { WorkflowNode } from '@/stores/workflowStore';
import { mockAgents } from '@/lib/mockData';

interface PropertiesPanelProps {
  selectedNode: WorkflowNode | null;
}

const nodeIcons = {
  'schedule-trigger': Clock,
  'agent-selector': Users,
  'test-suite': CheckSquare,
  'parallel-executor': Zap,
  'results-aggregator': BarChart3,
  'notification': Bell
};

export const PropertiesPanel = ({ selectedNode }: PropertiesPanelProps) => {
  const { updateNodeData, removeNode } = useWorkflowStore();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [uploadedTestCases, setUploadedTestCases] = useState<string[]>([]);

  if (!selectedNode) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold text-white mb-4">Properties</h2>
        <div className="text-center text-gray-400 py-8">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm">Select a node to view and edit its properties</p>
        </div>
      </div>
    );
  }

  const Icon = nodeIcons[selectedNode.type as keyof typeof nodeIcons];

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateNodeData(selectedNode.id, formData);
    setFormData({});
  };

  const handleDelete = () => {
    removeNode(selectedNode.id);
  };

  const renderPropertyFields = () => {
    switch (selectedNode.type) {
      case 'schedule-trigger':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input
                type="text"
                defaultValue={selectedNode.data.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Schedule Type</label>
              <select
                defaultValue={selectedNode.data.scheduleType || 'cron'}
                onChange={(e) => handleInputChange('scheduleType', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cron">Cron Expression</option>
                <option value="datetime">Specific Date & Time</option>
                <option value="interval">Interval</option>
              </select>
            </div>
            {(formData.scheduleType || selectedNode.data.scheduleType || 'cron') === 'cron' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Cron Expression</label>
                <input
                  type="text"
                  defaultValue={selectedNode.data.cron}
                  onChange={(e) => handleInputChange('cron', e.target.value)}
                  placeholder="0 2 * * 4"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Example: 0 2 * * 4 (Every Thursday at 2 AM)</p>
              </div>
            )}
            {(formData.scheduleType || selectedNode.data.scheduleType) === 'datetime' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  defaultValue={selectedNode.data.scheduledTime}
                  onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            {(formData.scheduleType || selectedNode.data.scheduleType) === 'interval' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Interval (minutes)</label>
                <input
                  type="number"
                  defaultValue={selectedNode.data.interval || 60}
                  onChange={(e) => handleInputChange('interval', parseInt(e.target.value))}
                  min="1"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </>
        );

      case 'agent-selector':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input
                type="text"
                defaultValue={selectedNode.data.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Business Unit</label>
              <select
                defaultValue={selectedNode.data.businessUnit}
                onChange={(e) => handleInputChange('businessUnit', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Manufacturing">Manufacturing</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Retail">Retail</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Select Agents</label>
              <div className="space-y-2 max-h-48 overflow-y-auto bg-slate-700 rounded-lg p-2">
                {mockAgents.map((agent) => (
                  <label key={agent.id} className="flex items-center text-sm text-gray-300 hover:bg-slate-600 p-2 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={selectedNode.data.selectedAgents?.includes(agent.id)}
                      onChange={(e) => {
                        const selectedAgents = selectedNode.data.selectedAgents || [];
                        if (e.target.checked) {
                          handleInputChange('selectedAgents', [...selectedAgents, agent.id]);
                        } else {
                          handleInputChange('selectedAgents', selectedAgents.filter((id: string) => id !== agent.id));
                        }
                      }}
                      className="mr-2 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-xs text-gray-400">{agent.version} - {agent.modelType}</div>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Selected: {(formData.selectedAgents || selectedNode.data.selectedAgents || []).length} agent(s)
              </p>
            </div>
          </>
        );

      case 'test-suite':
        const currentTestCases = formData.testCases || selectedNode.data.testCases || [];
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input
                type="text"
                defaultValue={selectedNode.data.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Test Dimensions</label>
              <div className="space-y-2">
                {['Accuracy', 'Bias', 'Robustness', 'Resilience'].map((dimension) => (
                  <label key={dimension} className="flex items-center text-sm text-gray-300">
                    <input
                      type="checkbox"
                      defaultChecked={selectedNode.data.dimensions?.includes(dimension)}
                      onChange={(e) => {
                        const dimensions = selectedNode.data.dimensions || [];
                        if (e.target.checked) {
                          handleInputChange('dimensions', [...dimensions, dimension]);
                        } else {
                          handleInputChange('dimensions', dimensions.filter((d: string) => d !== dimension));
                        }
                      }}
                      className="mr-2 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                    />
                    {dimension}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Upload Test Cases</label>
              <input
                type="file"
                accept=".json,.csv,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const content = event.target?.result as string;
                        let testCases: string[] = [];
                        if (file.name.endsWith('.json')) {
                          testCases = JSON.parse(content);
                        } else if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
                          testCases = content.split('\n').filter(line => line.trim());
                        }
                        const updatedCases = [...currentTestCases, ...testCases];
                        handleInputChange('testCases', updatedCases);
                        handleInputChange('tests', updatedCases.length);
                      } catch (error) {
                        console.error('Error parsing file:', error);
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
              <p className="text-xs text-gray-400 mt-1">Supports JSON, CSV, or TXT files</p>
            </div>
            {currentTestCases.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Test Cases ({currentTestCases.length})</label>
                <div className="max-h-48 overflow-y-auto bg-slate-700 rounded-lg p-2 space-y-1">
                  {currentTestCases.map((testCase: string, index: number) => (
                    <div key={index} className="flex items-center justify-between text-xs text-gray-300 bg-slate-600 p-2 rounded">
                      <span className="flex-1 truncate">{testCase}</span>
                      <button
                        onClick={() => {
                          const updated = currentTestCases.filter((_: any, i: number) => i !== index);
                          handleInputChange('testCases', updated);
                          handleInputChange('tests', updated.length);
                        }}
                        className="ml-2 text-red-400 hover:text-red-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );

      case 'parallel-executor':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input
                type="text"
                defaultValue={selectedNode.data.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Max Concurrent</label>
              <input
                type="number"
                defaultValue={selectedNode.data.maxConcurrent}
                onChange={(e) => handleInputChange('maxConcurrent', parseInt(e.target.value))}
                min="1"
                max="10"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        );

      case 'results-aggregator':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input
                type="text"
                defaultValue={selectedNode.data.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Pass Threshold (%)</label>
              <input
                type="number"
                defaultValue={selectedNode.data.passThreshold}
                onChange={(e) => handleInputChange('passThreshold', parseInt(e.target.value))}
                min="0"
                max="100"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        );

      case 'notification':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input
                type="text"
                defaultValue={selectedNode.data.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Notification Channels</label>
              <div className="space-y-2">
                {['email', 'slack', 'teams'].map((channel) => (
                  <label key={channel} className="flex items-center text-sm text-gray-300">
                    <input
                      type="checkbox"
                      defaultChecked={selectedNode.data.channels?.includes(channel)}
                      onChange={(e) => {
                        const channels = selectedNode.data.channels || [];
                        if (e.target.checked) {
                          handleInputChange('channels', [...channels, channel]);
                        } else {
                          handleInputChange('channels', channels.filter((c: string) => c !== channel));
                        }
                      }}
                      className="mr-2 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                    />
                    {channel.charAt(0).toUpperCase() + channel.slice(1)}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Recipients</label>
              <textarea
                defaultValue={selectedNode.data.recipients?.join(', ')}
                onChange={(e) => handleInputChange('recipients', e.target.value.split(',').map(r => r.trim()))}
                placeholder="email1@company.com, email2@company.com"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Properties</h2>
        <button
          onClick={handleDelete}
          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-4 p-3 bg-slate-700 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-5 h-5 text-gray-300" />
          <span className="font-medium text-white capitalize">{selectedNode.type.replace('-', ' ')}</span>
        </div>
        <div className="text-xs text-gray-400">Node ID: {selectedNode.id}</div>
      </div>

      <div className="space-y-4">
        {renderPropertyFields()}
      </div>

      {Object.keys(formData).length > 0 && (
        <div className="mt-6 flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Save Changes
          </button>
          <button
            onClick={() => setFormData({})}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
