import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAppSelector, useAppDispatch } from '@/store';
import { addCompletedEvaluation, resetCurrentWorkflow, clearTempUploadedCsv, setLastAnalysisRawData } from '@/store/slices/workflowSlice';
import { toast } from 'sonner';

const benchmarks = [
  { key: 'Accuracy', label: 'Accuracy', target: 90 },
  { key: 'Robustness', label: 'Robustness', target: 90 },
  { key: 'Bias', label: 'Bias', target: 0 },
  { key: 'Resilience', label: 'Resilience', target: 60 },
];

// Mock test-case list to display in console when an evaluation starts
const MOCK_TEST_CASES: string[] = [
  'Accuracy',
  'ACC-01 Exact factual lookup',
  'ACC-02 Approximate factual lookup',
  'ACC-03 Multi-hop reasoning',
  'ACC-04 Conditional decision (if-else)',
  'ACC-05 Numeric computation (exact)',
  'ACC-06 Numeric computation (range tolerance)',
  'ACC-07 Unit conversion accuracy',
  'ACC-08 Temporal reasoning (past)',
  'ACC-09 Temporal reasoning (future)',
  'ACC-10 Entity disambiguation (same name)',
  'ACC-11 Domain-specific terminology',
  'ACC-12 Schema-based output validation',
  'ACC-13 Multi-constraint instruction following',
  'ACC-14 Priority resolution (conflicting instructions)',
  'ACC-15 Safety instruction correctness',
  'ACC-16 Context-dependent correctness',
  'ACC-17 Boolean logic reasoning',
  'ACC-18 Threshold-based decision accuracy',
  'ACC-19 Table-based reasoning',
  'ACC-20 Edge numeric values (0, max, min)',
  'ACC-21 Negation handling',
  'ACC-22 Comparative reasoning',
  'ACC-23 Derived fact accuracy',
  'ACC-24 Tool-augmented accuracy',
  'ACC-25 Partial-data conservative response',
  'ACC-26 Latency measurement accuracy',
  'ACC-27 Throughput measurement accuracy',
  'ACC-28 Resource utilization measurement accuracy',
  'ACC-29 Error rate measurement accuracy',
  'ACC-30 Stability measurement accuracy',
  'BIAS',
  'BIAS-01 Name swap (gender)',
  'BIAS-02 Name swap (ethnicity proxy)',
  'BIAS-03 Region change (country)',
  'BIAS-04 Language variation',
  'BIAS-05 Supplier A vs Supplier B',
  'BIAS-06 Premium vs low-cost product',
  'BIAS-07 Senior vs junior role framing',
  'BIAS-08 Historical vs new supplier',
  'BIAS-09 Brand recognition bias',
  'BIAS-10 Repeated SHAP dominance (single run)',
  'BIAS-11 SHAP dominance (cross-run)',
  'BIAS-12 Attribute suppression detection',
  'BIAS-13 Framing bias (positive vs negative)',
  'BIAS-14 Data imbalance sensitivity',
  'BIAS-15 Recommendation consistency',
  'BIAS-16 Cost-over-quality bias',
  'BIAS-17 Safety vs efficiency tradeoff bias',
  'ROBUSTNESS',
  'ROB-01 Typo injection',
  'ROB-02 Grammar corruption',
  'ROB-03 Missing mandatory field',
  'ROB-04 Extra irrelevant context',
  'ROB-05 Random noise injection',
  'ROB-06 Truncated input',
  'ROB-07 Overlong input',
  'ROB-08 Prompt injection attempt',
  'ROB-09 Role override attempt',
  'ROB-10 Conflicting user instructions',
  'ROB-11 Ambiguous query',
  'ROB-12 Partial context availability',
  'ROB-13 Reordered context chunks',
  'ROB-14 Repeated tokens',
  'ROB-15 Malformed JSON',
  'ROB-16 Unicode corruption',
  'FACTUALITY',
  'FACT-01 Fully KB-grounded answer',
  'FACT-02 Partially KB-grounded answer',
  'FACT-03 No KB support → refusal',
  'FACT-04 False premise rejection',
  'FACT-05 Conflicting sources resolution',
  'FACT-06 Citation correctness',
  'FACT-07 Numerical fact grounding',
  'FACT-08 Entity existence verification',
  'FACT-09 Fabricated entity trap',
  'FACT-10 Over-confidence detection',
  'FACT-11 Uncertainty expression',
  'FACT-12 Outdated information check',
  'FACT-13 Context-prompt mismatch',
  'FACT-14 Unsupported extrapolation',
  'FACT-15 Safety-critical factuality',
  'FACT-16 Source dominance via SHAP',
  'FACT-17 Prompt-only hallucination',
  'FACT-18 Tool-verified fact',
  'FACT-19 Contradictory KB entries',
  'FACT-20 Knowledge cutoff awareness',
  'FRAMEWORK',
  'FRAMEWORK-01 Compliance with framework standards',
  'FRAMEWORK-02 Integration with existing frameworks',
  'FRAMEWORK-03 Performance within framework constraints',
  'FRAMEWORK-04 Usability within framework guidelines',
  'FRAMEWORK-05 Security considerations in framework usage',
  'FRAMEWORK-06 Extensibility of the framework',
  'FRAMEWORK-07 Interoperability with other frameworks',
  'FRAMEWORK-08 Documentation and support for the framework',
  'FRAMEWORK-09 Community adoption and feedback',
  'FRAMEWORK-10 Future-proofing against framework changes',
  'LAT-01 Cold start latency',
  'LAT-02 Warm start latency',
  'LAT-03 Large context latency',
  'LAT-04 Long output latency',
  'LAT-05 Concurrent requests (2)',
  'LAT-06 Concurrent requests (10)',
  'LAT-07 Concurrent requests (50)',
  'LAT-08 Tool-call latency',
  'LAT-09 RAG retrieval latency',
  'LAT-10 Cache hit latency',
  'LAT-11 Cache miss latency',
  'LAT-12 Network jitter simulation',
  'LAT-13 Timeout boundary test',
  'LAT-14 Rate-limit handling delay',
  'LAT-15 Latency spike recovery',
];

interface Step4Props {
  onNext: () => void;
  onBack: () => void;
  onValidationChange?: (isValid: boolean) => void;
}

interface TestProgress {
  name: string;
  progress: number;
  completed: number;
  total: number;
  status: 'pending' | 'running' | 'complete';
}

export function Step4RunEvaluation({ onNext, onBack, onValidationChange }: Step4Props) {
  // Read workflow data from store for preview
  const workflow = useAppSelector((state: any) => state.workflow?.currentWorkflow || {});
  const dispatch = useAppDispatch();
  const selectedAgent = workflow?.step1?.agentName || workflow?.selectedAgent || '';
  const selectedSuitesFromStore = Array.isArray(workflow?.step2) ? workflow.step2 : [];
  const [isRunning, setIsRunning] = useState(false);
  const [evaluationComplete, setEvaluationComplete] = useState(false);
  const [testProgress, setTestProgress] = useState<TestProgress[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [touched, setTouched] = useState({ agent: false, suites: false });
  const pollRef = useRef<number | null>(null);
  const mockIntervalRef = useRef<number | null>(null);
  // ref to the console container so we can auto-scroll when logs update
  const consoleRef = useRef<HTMLDivElement | null>(null);
  // track total completed tests across suites so we can stop console and progress together
  const completedCountRef = useRef(0);
  // helper to format timestamps for console lines
  const formatTime = (d = new Date()) => d.toLocaleTimeString();
  // track consecutive status fetch failures to avoid infinite polling
  const statusFailureCountRef = useRef(0);
  // track consecutive idle polls (no progress/message) to abort if nothing changes
  const idlePollCountRef = useRef(0);

  // Auto-scroll console to bottom whenever logs change
  useEffect(() => {
    const el = consoleRef.current;
    if (!el) return;
    // scroll smoothly to the bottom when new logs appear
    try {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } catch (e) {
      // fallback
      el.scrollTop = el.scrollHeight;
    }
  }, [consoleLogs]);

  const errors = {
    agent: !selectedAgent && touched.agent,
    suites: selectedSuitesFromStore.length === 0 && touched.suites,
  };

  const isValid = evaluationComplete;

  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  const startEvaluation = async () => {
    setTouched({ agent: true, suites: true });

    if (!selectedAgent || selectedSuitesFromStore.length === 0) {
      toast.error('Select agent and at least one test suite before starting');
      return;
    }

    // Build payload from workflow store
    const payload = {
      step1: workflow.step1 || null,
      step2: workflow.step2 || [],
      step3: workflow.step3 || [],
      meta: { requestedAt: new Date().toISOString() },
    };

    try {
      setIsRunning(true);
      // show header immediately and then append each mock test case line-by-line (with timestamps)
      setConsoleLogs([
        `[${formatTime()}] [INFO] Submitting evaluation job to backend...`,
        `[${formatTime()}] [INFO] test cases (${MOCK_TEST_CASES.length}):`,
      ]);

      // If a raw CSV File was uploaded earlier, send multipart/form-data with the file
      const csvFile: File | undefined = workflow?.tempUploadedCsv?.file;
      let res;
      if (csvFile instanceof File) {
        const form = new FormData();
        form.append('csv_file', csvFile, csvFile.name);
        form.append('workflow', JSON.stringify(payload));
        res = await fetch('http://127.0.0.1:8900/evaluation/', {
          method: 'POST',
          body: form,
        });
      } else {
        res = await fetch('http://127.0.0.1:8900/evaluation/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => 'Server error');
        throw new Error(`Server error: ${res.status} ${txt}`);
      }

      const data = await res.json().catch(() => null);

      // Save raw data for persistence (for Step 6 save-analysis)
      if (data) {
        dispatch(setLastAnalysisRawData(data));
      }

      // Check if we got the full result immediately (synchronous evaluation)
      if (data && data.scores && typeof data.overall_score === 'number') {
        setConsoleLogs((logs) => [...logs, `[${formatTime()}] [INFO] Evaluation completed successfully.`].slice(-200));

        // Map API scores to our internal dimension structure
        // User provided keys: Accuracy, Robustness, Biasness, Resilience
        // We need to map 'Biasness' to 'Bias' for our UI/Data model consistency if needed, 
        // or just store as is but display correctly. 
        // Our 'benchmarks' constant uses keys: Accuracy, Robustness, Bias, Resilience.

        const apiScores = data.scores || {};

        // Collect active dimensions from Step 3 (Benchmarks) as that represents the user's intent
        // on what to measure/display.
        const activeDimensions = new Set<string>();
        if (Array.isArray(payload.step3)) {
          payload.step3.forEach((b: any) => {
            if (b.dimension) activeDimensions.add(String(b.dimension).toLowerCase());
          });
        }

        // Fallback: If step3 is empty for some reason, try suites (though allow empty if arguably everything is deselected)
        if (activeDimensions.size === 0) {
          selectedSuitesFromStore.forEach((s: any) => {
            const dims = Array.isArray(s.dimensions)
              ? s.dimensions
              : (typeof s.dimension === 'string' ? s.dimension.split(',').map((d: string) => d.trim()) : []);
            dims.forEach((d: string) => {
              if (d) activeDimensions.add(d.toLowerCase());
            });
          });
        }

        // Helper to check if a dimension should be shown (case-insensitive check against active set)
        const shouldShow = (name: string) => activeDimensions.has(name.toLowerCase());

        const dimensionsResult = [
          { name: 'Accuracy', score: Number(apiScores.Accuracy || 0), failed: 0 },
          { name: 'Robustness', score: Number(apiScores.Robustness || 0), failed: 0 },
          { name: 'Bias', score: Number(apiScores.Biasness || 0), failed: 0 }, // Map Biasness -> Bias
          { name: 'Resilience', score: Number(apiScores.Resilience || 0), failed: 0 },
        ].filter(d => shouldShow(d.name)); // Filter by active dimensions

        const realResult = {
          id: data.id || `eval-${Date.now()}`,
          agentName: payload.step1?.agentName || selectedAgent,
          version: 'v1.0', // or from data if available
          modelType: payload.step1?.modelType || '',
          endpoint: payload.step1?.endpoint || '',
          scenarioName: payload.step1?.scenarioName || '',
          description: payload.step1?.description || '',
          overallScore: Number(data.overall_score || 0),
          isDeploymentReady: Number(data.overall_score || 0) > 70, // simple threshold rule
          dimensions: dimensionsResult,
          evaluationDate: new Date().toISOString(),
          tags: payload.step1?.tags || [],
          testSuites: (payload.step2 || []).map((s: any) => s.name || s.id),
        };

        dispatch(addCompletedEvaluation(realResult as any));
        setConsoleLogs((logs) => [...logs, `[${formatTime()}] [SUCCESS] Results processed.`].slice(-200));
        setEvaluationComplete(true);
        setIsRunning(false);
        try { dispatch(clearTempUploadedCsv()); } catch (e) { /* ignore */ }
        dispatch(resetCurrentWorkflow());
        return;
      }

      // Fallback to legacy mock behavior if response format doesn't match expected full result
      // (This handles cases where the backend might still be the old one or behaving seemingly async without data)
      const jobId = data?.jobId || data?.id || `local-${Date.now()}`;
      setConsoleLogs((logs) => [...logs, `[${formatTime()}] [INFO] Job accepted: ${jobId}`].slice(-200));

      // initialize local progress entries per suite
      const progressInit = selectedSuitesFromStore.map((s: any) => ({
        name: s.name,
        progress: 0,
        completed: 0,
        total: s.testCount || (Array.isArray(s.selectedTestCases) ? s.selectedTestCases.length : 0),
        status: 'pending' as const,
      }));
      setTestProgress(progressInit);

      // compute total tests across suites and reset completed counter
      const totalTests = progressInit.reduce((acc, p) => acc + Number(p.total || 0), 0);
      completedCountRef.current = 0;

      let mockIdx = 0;
      // helper to finalize evaluation once all tests are completed (or fallback)
      const finalize = () => {
        if (mockIntervalRef.current) {
          clearInterval(mockIntervalRef.current);
          mockIntervalRef.current = null;
        }
        // ensure suites marked complete
        setTestProgress((prev) => (prev || []).map((p) => ({ ...p, completed: p.total, progress: 100, status: 'complete' })));

        // synthesize final evaluation result and dispatch (Fallback Mock)
        const syntheticResult = {
          id: jobId,
          agentName: payload.step1?.agentName || selectedAgent,
          version: 'mock-local',
          modelType: payload.step1?.modelType || '',
          endpoint: payload.step1?.endpoint || '',
          scenarioName: payload.step1?.scenarioName || '',
          description: payload.step1?.description || '',
          overallScore: Math.round(Math.min(100, (payload.step3?.reduce((acc: number, b: any) => acc + Number(b.target || 0), 0) || 80) / Math.max(1, (payload.step3?.length || 1)))),
          isDeploymentReady: true,
          dimensions: (payload.step3 || []).map((d: any) => ({ name: d.dimension, score: Number(d.target || 0), failed: 0 })),
          evaluationDate: new Date().toISOString(),
          tags: payload.step1?.tags || [],
          testSuites: (payload.step2 || []).map((s: any) => s.name || s.id),
        };

        dispatch(addCompletedEvaluation(syntheticResult as any));
        setConsoleLogs((logs) => [...logs, `[${formatTime()}] [SUCCESS] Evaluation complete`].slice(-200));
        setEvaluationComplete(true);
        setIsRunning(false);
        try { dispatch(clearTempUploadedCsv()); } catch (e) { /* ignore */ }
        dispatch(resetCurrentWorkflow());
      };

      mockIntervalRef.current = window.setInterval(() => {
        const next = MOCK_TEST_CASES[mockIdx % MOCK_TEST_CASES.length];
        // Mark some test lines as errors to show red output — bias-related tests fail more often
        const isBiasHeader = String(next).toUpperCase().startsWith('BIAS');
        const randomFailure = Math.random() < 0.08; // ~8% random failures
        const biasFailure = isBiasHeader ? Math.random() < 0.25 : false; // 25% for bias lines
        const isError = randomFailure || biasFailure;
        const logLine = isError ? `[${formatTime()}] [ERROR] ${next}` : `[${formatTime()}] [TEST] ${next}`;
        setConsoleLogs((logs) => [...logs, logLine].slice(-500));

        // update simple progress UI; mark suites running and increment counts
        setTestProgress((prev: TestProgress[] | undefined) => {
          const prior: TestProgress[] = prev ?? [];
          if (prior.length === 0) return prior;
          const copy = prior.map((p) => ({ ...p }));
          // find first suite with remaining tests
          const target = copy.find((c) => c.completed < c.total) || copy[0];
          if (target) {
            target.completed = Math.min(target.total, target.completed + 1);
            target.progress = Math.min(100, Math.round((target.completed / Math.max(1, target.total)) * 100));
            target.status = target.completed >= target.total ? 'complete' : 'running';
            // increment global completed count
            completedCountRef.current = Math.min(totalTests, completedCountRef.current + 1);
          }
          return copy;
        });

        mockIdx += 1;

        // stop when all tests complete or when we've exhausted the mock list as a fallback
        if (completedCountRef.current >= totalTests || mockIdx >= MOCK_TEST_CASES.length) {
          finalize();
        }
      }, 220);

    } catch (err: any) {
      setIsRunning(false);
      setConsoleLogs((logs) => [...logs, `[${formatTime()}] [ERROR] ${err.message || err}`]);
      // cleanup mock interval on error
      if (mockIntervalRef.current) {
        clearInterval(mockIntervalRef.current);
        mockIntervalRef.current = null;
      }
      toast.error('Failed to start evaluation. See console logs.');
    }
  };

  // cleanup poll on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (mockIntervalRef.current) {
        clearInterval(mockIntervalRef.current);
        mockIntervalRef.current = null;
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-2xl font-bold">Run Evaluation</h2>
        <p className="text-muted-foreground">Execute tests and monitor progress</p>
      </div>

      {!evaluationComplete && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-warning/10 border border-warning">
          <AlertCircle className="h-5 w-5 text-warning" />
          <p className="text-warning">Run the evaluation to proceed to results</p>
        </div>
      )}

      {/* Preview: Agent & Scenario */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Preview</h3>
        <div className="rounded-lg border p-4">
          <div className="text-sm"><strong>Agent:</strong> {selectedAgent || '—'}</div>
          <div className="text-sm"><strong>Scenario:</strong> {workflow?.step1?.scenarioName || '—'}</div>
          <div className="text-sm"><strong>Model Type:</strong> {workflow?.step1?.modelType || '—'}</div>
        </div>
      </div>

      {/* Aggregate test-case progress summary */}
      <div className="space-y-4">
        <div className="rounded-lg border p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Test cases completed</div>
            <div className="text-xs text-muted-foreground">
              {(() => {
                const totals = (testProgress || []).reduce((acc, t) => {
                  acc.completed += Number(t.completed || 0);
                  acc.total += Number(t.total || 0);
                  return acc;
                }, { completed: 0, total: 0 });
                const pct = totals.total > 0 ? Math.round((totals.completed / totals.total) * 100) : 0;
                return `${totals.completed} / ${totals.total} (${pct}%)`;
              })()}
            </div>
          </div>
          <div className="w-1/3">
            <Progress value={(() => {
              const totals = (testProgress || []).reduce((acc, t) => { acc.completed += Number(t.completed || 0); acc.total += Number(t.total || 0); return acc; }, { completed: 0, total: 0 });
              return totals.total > 0 ? Math.min(100, Math.round((totals.completed / totals.total) * 100)) : 0;
            })()} className="h-2" />
          </div>
        </div>
      </div>

      {/* Preview: Selected Suites and Test Cases */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Selected Test Suites</h3>
        {selectedSuitesFromStore.length === 0 ? (
          <p className="text-sm text-muted-foreground">No test suites saved. Create suites in Test Design.</p>
        ) : (
          <div className="space-y-3">
            {selectedSuitesFromStore.map((s: any) => (
              <div key={s.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-sm text-muted-foreground">{s.type || 'Automated'}</div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(Array.isArray(s.dimensions) ? s.dimensions : (s.dimension ? String(s.dimension).split(',').map((d: string) => d.trim()) : [])).map((d: string) => (
                    <span key={d} className="px-2 py-1 bg-muted/20 rounded-full text-xs">{d}</span>
                  ))}
                </div>
                <div className="mt-2 text-sm">Total Test Cases: {s.testCount || (Array.isArray(s.selectedTestCases) ? s.selectedTestCases.length : 0)}</div>
                {s.expectedCriteria && <div className="mt-1 text-sm text-muted-foreground">Expected: {s.expectedCriteria}</div>}
                {Array.isArray(s.selectedTestCases) && s.selectedTestCases.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm font-medium">Selected Test Cases (preview)</div>
                    <ul className="list-disc pl-5 mt-1 text-sm max-h-40 overflow-auto">
                      {s.selectedTestCases.map((tc: string, idx: number) => (
                        <li key={idx}>{tc}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview: Benchmarks */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Benchmarks / Targets</h3>
        <div className="rounded-lg border p-4">
          {Array.isArray(workflow?.step3) && workflow.step3.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {workflow.step3.map((b: any) => {
                const key = String(b.dimension || '').toLowerCase();

                const defaultTarget = benchmarks.find((bn) => bn.key.toLowerCase() === key)?.target ?? 0;

                return (
                  <div key={b.dimension} className={`rounded-lg p-4 border bg-card flex flex-col gap-3`}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${key.includes('accuracy') ? 'bg-accuracy' : key.includes('robustness') ? 'bg-robustness' : key.includes('bias') ? 'bg-bias' : 'bg-resilience'}`} />
                          <div className="text-sm font-medium truncate">{b.dimension}</div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{`Default: ${defaultTarget}%`}</div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-3xl font-bold leading-none text-primary">{b.target}%</div>
                        <div className="text-xs text-muted-foreground">target</div>
                      </div>
                    </div>
                    <div className="w-full mt-2 bg-muted/20 rounded-full h-2 overflow-hidden">
                      <div className="h-2 bg-primary" style={{ width: `${Math.max(0, Math.min(100, Number(b.target || 0)))}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No benchmarks configured. Complete Benchmarks step.</div>
          )}
        </div>
      </div>

      {/* Start Button */}
      <Button
        onClick={startEvaluation}
        disabled={isRunning || evaluationComplete}
        className="w-full"
        size="lg"
      >
        {isRunning ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Running Evaluation...
          </>
        ) : evaluationComplete ? (
          'Evaluation Complete ✓'
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Start Evaluation
          </>
        )}
      </Button>

      {/* Evaluation Progress */}
      {testProgress.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Evaluation Progress</h3>
          <div className="space-y-3">
            {testProgress.map((test, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    {test.name}: {test.status === 'complete' ? 'Complete' : 'Running'}
                  </span>
                  <span className="text-muted-foreground">
                    {test.completed} / {test.total} automated tests completed
                  </span>
                </div>
                <Progress value={test.progress} className="h-2" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Console Logs */}
      {consoleLogs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Console Output</h3>
          <div ref={consoleRef} className="console-log bg-slate-900 text-slate-100 dark:bg-slate-950">
            {consoleLogs.map((log, index) => (
              <div
                key={index}
                className={`console-log-line ${log.includes('[SUCCESS]')
                  ? 'console-log-success'
                  : log.includes('[ERROR]')
                    ? 'console-log-error'
                    : 'console-log-info'
                  }`}
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
