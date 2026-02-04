import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Panel,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore } from '@/stores/workflowStore';
import { nodeTypes } from '@/components/workflow/nodeTypes';
import { NodeLibrary } from '@/components/workflow/NodeLibrary';
import { PropertiesPanel } from '@/components/workflow/PropertiesPanel';
import { 
  Play, Square, Save, RotateCcw, ChevronLeft, ChevronRight, 
  FolderOpen, Trash2, X, FileText, CheckCircle2, XCircle, MinusCircle 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mockAgents } from '@/lib/mockData';

export const WorkflowBuilder = () => {
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const prevIsExecutingRef = useRef(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showWorkflowList, setShowWorkflowList] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [showExecutionReport, setShowExecutionReport] = useState(false);
  const [executionReport, setExecutionReport] = useState<any>(null);
  const {
    nodes: storeNodes,
    edges: storeEdges,
    selectedNode,
    isExecuting,
    savedWorkflows,
    setNodes,
    setEdges,
    setSelectedNode,
    addNode,
    executeWorkflow,
    stopExecution,
    saveWorkflow,
    loadWorkflow,
    deleteWorkflow,
  } = useWorkflowStore();

  const [nodes, setNodesState, onNodesChange] = useNodesState([]);
  const [edges, setEdgesState, onEdgesChange] = useEdgesState([]);

  // Sync store nodes to local state when store changes
  useEffect(() => {
    setNodesState(storeNodes);
  }, [storeNodes, setNodesState]);

  useEffect(() => {
    setEdgesState(storeEdges);
  }, [storeEdges, setEdgesState]);

  // Sync local changes back to store
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nodes.length > 0 || edges.length > 0) {
        setNodes(nodes);
        setEdges(edges);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [nodes, edges, setNodes, setEdges]);

  // Show notification and report when execution completes
  useEffect(() => {
    const wasExecuting = prevIsExecutingRef.current;
    prevIsExecutingRef.current = isExecuting;

    if (wasExecuting && !isExecuting && storeNodes.length > 0) {
      const allSuccess = storeNodes.every(node => node.data.status === 'success');
      const hasRunning = storeNodes.some(node => node.data.status === 'running');
      const hasCompleted = storeNodes.some(node => node.data.status === 'success');
      
      if (hasCompleted && !hasRunning && allSuccess) {
        // Generate execution report
        const report = generateExecutionReport(storeNodes);
        setExecutionReport(report);
        setShowExecutionReport(false);
        
        toast({
          title: "Workflow Execution Complete",
          description: `All ${storeNodes.length} nodes executed successfully. Report is ready.`,
          duration: 5000,
        });
      }
    }
  }, [isExecuting, storeNodes, toast]);

  const generateExecutionReport = (nodes: any[]) => {
    const agentNode = nodes.find(n => n.type === 'agent-selector');
    const testSuiteNode = nodes.find(n => n.type === 'test-suite');
    
    const selectedAgents: string[] = agentNode?.data?.selectedAgents || [];
    const testCases: string[] = testSuiteNode?.data?.testCases || [];
    const dimensions: string[] = (testSuiteNode?.data?.dimensions || []).filter(Boolean);

    const stableHash = (input: string) => {
      let h = 2166136261;
      for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    };

    const mulberry32 = (seed: number) => {
      return () => {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };

    const dimPassBase: Record<string, number> = {
      accuracy: 0.9,
      robustness: 0.84,
      bias: 0.88,
      resilience: 0.78,
      latency: 0.86,
    };

    const skipReasons = [
      'Rate limited',
      'Timeout',
      'Unsupported input',
      'Dependency unavailable',
      'Validation failed',
    ];

    const effectiveDimensions = dimensions.length > 0 
      ? dimensions 
      : ['Accuracy', 'Robustness', 'Bias', 'Resilience', 'Latency'];

    const agentResults = selectedAgents.map((agentId: string) => {
      const agent = mockAgents.find(a => a.id === agentId);
      const totalTests = testCases.length;
      const seed = stableHash(`${agentId}|${totalTests}|${effectiveDimensions.join(',')}`);
      const rand = mulberry32(seed);

      const agentQuality = 0.82 + rand() * 0.12;
      const execRate = 0.88 + rand() * 0.1;

      const testResults = testCases.map((testCase: string, index: number) => {
        const dim = effectiveDimensions[index % effectiveDimensions.length] || 'Accuracy';
        const dimKey = String(dim).toLowerCase();

        const willExecute = rand() < execRate;
        if (!willExecute) {
          return {
            testCase,
            status: 'skipped',
            dimension: dim,
            executionTime: 0,
            skipReason: skipReasons[Math.floor(rand() * skipReasons.length)],
          };
        }

        const base = dimPassBase[dimKey] ?? 0.85;
        const passProb = Math.min(0.98, Math.max(0.4, base * agentQuality));
        const passed = rand() < passProb;

        const latencyJitter = Math.floor(120 + rand() * 420);
        const dimLatencyBoost = dimKey === 'latency' ? Math.floor(80 + rand() * 220) : 0;
        const executionTime = latencyJitter + dimLatencyBoost;

        return {
          testCase,
          status: passed ? 'passed' : 'failed',
          dimension: dim,
          executionTime,
        };
      });

      const executed = testResults.filter((t: any) => t.status !== 'skipped');
      const passed = executed.filter((t: any) => t.status === 'passed').length;
      const failed = executed.filter((t: any) => t.status === 'failed').length;
      const skipped = testResults.length - executed.length;
      const times = executed.map((t: any) => t.executionTime).sort((a: number, b: number) => a - b);
      const avgTime = times.length > 0 
        ? Math.round(times.reduce((s: number, v: number) => s + v, 0) / times.length) 
        : 0;
      const p95 = times.length > 0 ? times[Math.min(times.length - 1, Math.floor(times.length * 0.95))] : 0;

      return {
        agentId,
        agentName: agent?.name || 'Unknown Agent',
        agentVersion: agent?.version || '1.0',
        modelType: agent?.modelType || 'Unknown',
        totalTests,
        executed: executed.length,
        skipped,
        passed,
        failed,
        passRate: executed.length > 0 ? ((passed / executed.length) * 100).toFixed(1) : '0',
        avgTime,
        p95Time: p95,
        testResults,
      };
    });

    const totals = agentResults.reduce(
      (acc: any, r: any) => {
        acc.totalTests += r.totalTests;
        acc.executed += r.executed;
        acc.passed += r.passed;
        acc.failed += r.failed;
        acc.skipped += r.skipped;
        return acc;
      },
      { totalTests: 0, executed: 0, passed: 0, failed: 0, skipped: 0 }
    );

    const overallPassRate = totals.executed > 0 ? ((totals.passed / totals.executed) * 100).toFixed(1) : '0';
    const overallCoverage = totals.totalTests > 0 ? ((totals.executed / totals.totalTests) * 100).toFixed(1) : '0';

    const dimensionBreakdown = effectiveDimensions.reduce((acc: any, d: string) => {
      acc[d] = { passed: 0, failed: 0, skipped: 0 };
      return acc;
    }, {});

    agentResults.forEach((ar: any) => {
      ar.testResults.forEach((t: any) => {
        if (!dimensionBreakdown[t.dimension]) dimensionBreakdown[t.dimension] = { passed: 0, failed: 0, skipped: 0 };
        if (t.status === 'passed') dimensionBreakdown[t.dimension].passed += 1;
        else if (t.status === 'failed') dimensionBreakdown[t.dimension].failed += 1;
        else dimensionBreakdown[t.dimension].skipped += 1;
      });
    });

    return {
      totalAgents: selectedAgents.length,
      totalTestCases: testCases.length,
      dimensions: effectiveDimensions,
      executionTime: new Date().toLocaleString(),
      agentResults,
      totals,
      overallPassRate,
      overallCoverage,
      dimensionBreakdown,
    };
  };

  const onConnect = useCallback(
    (params: Connection) => setEdgesState((eds) => addEdge(params, eds)),
    [setEdgesState]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node as any);
  }, [setSelectedNode]);

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node as any);
    setIsRightSidebarCollapsed(false);
  }, [setSelectedNode]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const dataStr = event.dataTransfer.getData('application/reactflow-data');
      
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      // Calculate position relative to the canvas center for better visibility
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const parsedData = JSON.parse(dataStr || '{}');
      const newNode = {
        id: `${type}-${Date.now()}`,
        type: type as any,
        position,
        data: { ...parsedData, status: 'idle' }, // Initialize with idle status
      };

      setNodesState((nds) => nds.concat(newNode));
    },
    [setNodesState]
  );

  const nodeTypesMemo = useMemo(() => nodeTypes, []);

  const handleExecute = () => {
    // Ensure latest state is in store before execution
    setNodes(nodes);
    setEdges(edges);
    executeWorkflow();
  };

  const handleStop = () => {
    stopExecution();
  };

  const handleOpenReport = () => {
    if (!executionReport) {
      toast({
        title: 'No report available',
        description: 'Run the workflow first to generate a report.',
        duration: 3000,
      });
      return;
    }
    setShowExecutionReport(true);
  };

  const handleSave = () => {
    // Ensure latest state is in store before saving
    setNodes(nodes);
    setEdges(edges);
    setShowSaveModal(true);
  };

  const handleSaveWorkflow = () => {
    if (workflowName.trim()) {
      saveWorkflow(workflowName);
      setWorkflowName('');
      setShowSaveModal(false);
      toast({
        title: "Workflow Saved",
        description: `"${workflowName}" has been saved successfully!`,
        duration: 3000,
      });
    }
  };

  const handleLoadWorkflow = (id: string) => {
    loadWorkflow(id);
    setShowWorkflowList(false);
  };

  const handleDeleteWorkflow = (id: string) => {
    deleteWorkflow(id);
  };

  const handleReset = () => {
    // Clear workflow to empty state
    setNodesState([]);
    setEdgesState([]);
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
  };

  return (
    <div className="h-screen w-full bg-slate-900 flex">
      {/* Left Sidebar - Node Library (Always Visible) */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 overflow-y-auto">
        <NodeLibrary />
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onPaneClick={onPaneClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypesMemo}
          fitView
          snapToGrid
          snapGrid={[20, 20]}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          minZoom={0.3}
          maxZoom={2}
          className="bg-slate-900"
        >
          <Background color="#1e293b" gap={20} size={1} />
          <Controls 
            position="top-left"
            className="bg-slate-800 border border-slate-700"
            showZoom={true}
            showFitView={true}
            showInteractive={false}
          />
          <MiniMap 
            position="top-right"
            className="bg-slate-800"
            nodeColor={(node) => {
              const colors: Record<string, string> = {
                'schedule-trigger': '#3b82f6',
                'agent-selector': '#10b981',
                'test-suite': '#8b5cf6',
                'parallel-executor': '#f97316',
                'results-aggregator': '#6366f1',
                'notification': '#ec4899'
              };
              return colors[node.type as string] || '#6b7280';
            }}
            maskColor="rgba(15, 23, 42, 0.8)"
          />
          
          {/* Top Toolbar */}
          <Panel position="top-center" className="bg-slate-800 border border-slate-700 rounded-lg p-1.5 flex gap-1.5">
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 
                hover:bg-emerald-700 disabled:bg-slate-600 disabled:opacity-50 
                text-white rounded text-sm transition-colors font-medium"
            >
              <Play className="w-3.5 h-3.5" />
              Execute
            </button>
            <button
              onClick={handleStop}
              disabled={!isExecuting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 
                hover:bg-slate-700 disabled:bg-slate-700 disabled:opacity-50 
                text-white rounded text-sm transition-colors font-medium"
            >
              <Square className="w-3.5 h-3.5" />
              Stop
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 
                hover:bg-blue-700 text-white rounded text-sm transition-colors font-medium"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
            <button
              onClick={() => setShowWorkflowList(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm transition-colors font-medium"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Load
            </button>
            <button
              onClick={handleOpenReport}
              disabled={!executionReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 
                hover:bg-indigo-700 disabled:bg-slate-600 disabled:opacity-50 
                text-white rounded text-sm transition-colors font-medium"
            >
              <FileText className="w-3.5 h-3.5" />
              Report
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm transition-colors font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </Panel>

          {/* Workflow Status */}
          <Panel position="bottom-center" className="bg-slate-800 border border-slate-700 rounded-lg p-3">
            <div className="flex items-center gap-4 text-white">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isExecuting ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                }`} />
                <span className="text-sm">
                  {isExecuting ? 'Executing...' : 'Ready'}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                Nodes: {nodes.length} | Edges: {edges.length}
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Right Sidebar Toggle */}
      <button
        onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-slate-800 
          border border-slate-700 rounded-l-lg p-2 hover:bg-slate-700 transition-colors"
        style={{ right: isRightSidebarCollapsed ? '0' : '320px' }}
      >
        {isRightSidebarCollapsed ? <ChevronLeft className="w-4 h-4 text-white" /> : <ChevronRight className="w-4 h-4 text-white" />}
      </button>
      
      {/* Right Sidebar - Properties Panel */}
      <div className={`${isRightSidebarCollapsed ? 'w-0' : 'w-80'} bg-slate-800 border-l border-slate-700 overflow-y-auto transition-all duration-300`}>
        {!isRightSidebarCollapsed && <PropertiesPanel selectedNode={selectedNode} />}
      </div>

      {/* Save Workflow Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-96 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Save Workflow</h3>
              <button onClick={() => setShowSaveModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Workflow Name</label>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="Enter workflow name"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSaveWorkflow()}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveWorkflow}
                disabled={!workflowName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workflow List Modal */}
      {showWorkflowList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-[600px] max-h-[80vh] border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Saved Workflows</h3>
              <button onClick={() => setShowWorkflowList(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
              {savedWorkflows.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p>No saved workflows yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedWorkflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className="bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{workflow.name}</h4>
                          <p className="text-sm text-gray-400">
                            {workflow.nodes.length} nodes • {workflow.edges.length} connections
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Saved: {new Date(workflow.savedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleLoadWorkflow(workflow.id)}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => handleDeleteWorkflow(workflow.id)}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Execution Report Modal */}
      {showExecutionReport && executionReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg w-full max-w-6xl max-h-[90vh] border border-slate-700 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-400" />
                <div>
                  <h3 className="text-xl font-semibold text-white">Workflow Execution Report</h3>
                  <p className="text-sm text-gray-400">{executionReport.executionTime}</p>
                </div>
              </div>
              <button onClick={() => setShowExecutionReport(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              {/* Summary Section */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Total Agents</div>
                  <div className="text-2xl font-bold text-white">{executionReport.totalAgents}</div>
                </div>
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Total Test Cases</div>
                  <div className="text-2xl font-bold text-white">{executionReport.totalTestCases}</div>
                </div>
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Overall Pass Rate</div>
                  <div className="text-2xl font-bold text-green-400">{executionReport.overallPassRate}%</div>
                </div>
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Coverage</div>
                  <div className="text-2xl font-bold text-blue-400">{executionReport.overallCoverage}%</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-3">Overall Results</div>
                  {(() => {
                    const totals = executionReport.totals || { passed: 0, failed: 0, skipped: 0, executed: 0 };
                    const total = (totals.passed || 0) + (totals.failed || 0) + (totals.skipped || 0);
                    const passedPct = total > 0 ? ((totals.passed || 0) / total) * 100 : 0;
                    const failedPct = total > 0 ? ((totals.failed || 0) / total) * 100 : 0;
                    const skippedPct = Math.max(0, 100 - passedPct - failedPct);
                    const donutStyle: React.CSSProperties = {
                      background: `conic-gradient(#22c55e 0% ${passedPct}%, #ef4444 ${passedPct}% ${passedPct + failedPct}%, #94a3b8 ${passedPct + failedPct}% 100%)`,
                    };
                    return (
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full" style={donutStyle}>
                          <div className="w-14 h-14 rounded-full bg-slate-700 mx-auto mt-3" />
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-gray-300">Passed</span>
                            <span className="text-green-400 font-medium">{totals.passed}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-gray-300">Failed</span>
                            <span className="text-red-400 font-medium">{totals.failed}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-gray-300">Skipped</span>
                            <span className="text-gray-200 font-medium">{totals.skipped}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="bg-slate-700 rounded-lg p-4 md:col-span-2">
                  <div className="text-gray-400 text-sm mb-3">Pass Rate by Agent</div>
                  <div className="space-y-2">
                    {(executionReport.agentResults || []).map((ar: any) => {
                      const rate = Number(ar.passRate || 0);
                      return (
                        <div key={ar.agentId} className="flex items-center gap-3">
                          <div className="w-40 text-sm text-gray-200 truncate">{ar.agentName}</div>
                          <div className="flex-1 h-2 rounded bg-slate-800 overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${Math.max(0, Math.min(100, rate))}%` }} />
                          </div>
                          <div className="w-14 text-right text-sm text-blue-300 font-medium">{rate.toFixed(1)}%</div>
                        </div>
                      );
                    })}
                    {(executionReport.agentResults || []).length === 0 && (
                      <div className="text-sm text-gray-400">No agents selected.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-700 rounded-lg p-4 mb-6">
                <div className="text-gray-400 text-sm mb-3">Dimensions</div>
                <div className="flex flex-wrap gap-2">
                  {executionReport.dimensions.map((d: string) => (
                    <span key={d} className="px-2 py-1 rounded bg-slate-800 text-gray-200 text-xs">
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Agent Results */}
              <div className="space-y-6">
                {executionReport.agentResults.map((agentResult: any, index: number) => (
                  <div key={index} className="bg-slate-700 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-white">{agentResult.agentName}</h4>
                        <p className="text-sm text-gray-400">
                          Version {agentResult.agentVersion} • {agentResult.modelType}
                        </p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-gray-400">Total</div>
                          <div className="text-lg font-bold text-white">{agentResult.totalTests}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400">Executed</div>
                          <div className="text-lg font-bold text-white">{agentResult.executed}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400">Passed</div>
                          <div className="text-lg font-bold text-green-400">{agentResult.passed}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400">Failed</div>
                          <div className="text-lg font-bold text-red-400">{agentResult.failed}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400">Skipped</div>
                          <div className="text-lg font-bold text-gray-200">{agentResult.skipped}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400">Pass Rate</div>
                          <div className="text-lg font-bold text-blue-400">{agentResult.passRate}%</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                      <div className="bg-slate-800 rounded p-3">
                        <div className="text-xs text-gray-400">Avg time</div>
                        <div className="text-sm text-white font-medium">{agentResult.avgTime}ms</div>
                      </div>
                      <div className="bg-slate-800 rounded p-3">
                        <div className="text-xs text-gray-400">P95 time</div>
                        <div className="text-sm text-white font-medium">{agentResult.p95Time}ms</div>
                      </div>
                      <div className="bg-slate-800 rounded p-3">
                        <div className="text-xs text-gray-400">Exec rate</div>
                        <div className="text-sm text-white font-medium">
                          {agentResult.totalTests > 0 ? ((agentResult.executed / agentResult.totalTests) * 100).toFixed(1) : '0'}%
                        </div>
                      </div>
                    </div>

                    {/* Test Results Table */}
                    <div className="bg-slate-800 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-900">
                          <tr>
                            <th className="text-left p-3 text-gray-400 font-medium">#</th>
                            <th className="text-left p-3 text-gray-400 font-medium">Test Case</th>
                            <th className="text-left p-3 text-gray-400 font-medium">Dimension</th>
                            <th className="text-left p-3 text-gray-400 font-medium">Status</th>
                            <th className="text-left p-3 text-gray-400 font-medium">Execution Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {agentResult.testResults.map((test: any, testIndex: number) => (
                            <tr key={testIndex} className="border-t border-slate-700 hover:bg-slate-700/50">
                              <td className="p-3 text-gray-400">{testIndex + 1}</td>
                              <td className="p-3 text-white max-w-md truncate">{test.testCase}</td>
                              <td className="p-3">
                                <span className="px-2 py-1 bg-slate-600 text-gray-300 rounded text-xs">
                                  {test.dimension}
                                </span>
                              </td>
                              <td className="p-3">
                                {test.status === 'passed' ? (
                                  <div className="flex items-center gap-1 text-green-400">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="font-medium">Passed</span>
                                  </div>
                                ) : test.status === 'failed' ? (
                                  <div className="flex items-center gap-1 text-red-400">
                                    <XCircle className="w-4 h-4" />
                                    <span className="font-medium">Failed</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-gray-200">
                                    <MinusCircle className="w-4 h-4" />
                                    <span className="font-medium">Skipped</span>
                                    {test.skipReason ? (
                                      <span className="text-xs text-gray-400">({test.skipReason})</span>
                                    ) : null}
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-gray-400">{test.executionTime ? `${test.executionTime}ms` : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              {executionReport.agentResults.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p>No agents were selected for this workflow execution.</p>
                  <p className="text-sm mt-2">Please select agents in the Agent Selector node.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  const reportData = JSON.stringify(executionReport, null, 2);
                  const blob = new Blob([reportData], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `workflow-report-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Download Report
              </button>
              <button
                onClick={() => setShowExecutionReport(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
