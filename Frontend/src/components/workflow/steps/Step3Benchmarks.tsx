import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Info } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store';
import { setStep3Data } from '@/store/slices/workflowSlice';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Step3Props {
  onNext: () => void;
  onBack: () => void;
  onValidationChange?: (isValid: boolean) => void;
}

const dimensionInfo: Record<string, { description: string; benchmark: string; threshold: string; impact: string }> = {
  Accuracy: {
    description: 'Measures how correctly the AI agent performs its intended task.',
    benchmark: 'Recommended: ≥90% - Industry standard for production AI systems.',
    threshold: 'Minimum: 85% for acceptable performance. Below this, user trust decreases significantly.',
    impact: 'Lower values: More incorrect predictions, poor user experience. Higher values: Better reliability but may require more training data and computational resources.'
  },
  Robustness: {
    description: 'Evaluates how well the agent handles unexpected inputs, edge cases, and noisy data.',
    benchmark: 'Recommended: ≥90% - Ensures stable performance across diverse scenarios.',
    threshold: 'Minimum: 80% for production use. Below this, the system becomes unpredictable.',
    impact: 'Lower values: System fails on edge cases, crashes, or produces unreliable outputs. Higher values: More resilient to real-world variability but may require extensive testing.'
  },
  Bias: {
    description: 'Measures fairness and absence of discriminatory behavior across different groups.',
    benchmark: 'Recommended: ≥90% fairness score - Critical for ethical AI deployment.',
    threshold: 'Minimum: 85% to meet regulatory compliance. Below this risks legal and reputational damage.',
    impact: 'Lower values: Discriminatory outcomes, legal risks, loss of user trust. Higher values: Fairer system but may require bias mitigation techniques and diverse training data.'
  },
  Resilience: {
    description: 'Tests the agent\'s ability to recover from failures, handle high load, and maintain service.',
    benchmark: 'Recommended: ≥60% - Acceptable for most business applications.',
    threshold: 'Minimum: 50% for non-critical systems. Mission-critical systems need ≥80%.',
    impact: 'Lower values: Frequent downtime, poor user experience during peak loads. Higher values: Better availability but requires robust infrastructure and failover mechanisms.'
  },
  Latency: {
    description: 'Measures response time and processing speed of the AI agent.',
    benchmark: 'Recommended: ≥85% of requests under target latency (e.g., <500ms).',
    threshold: 'Minimum: 70% for acceptable user experience. Real-time applications need ≥90%.',
    impact: 'Lower values: Slow responses, poor UX, user abandonment. Higher values: Faster responses but may require optimization and better hardware.'
  }
};

const benchmarks = [
  { key: 'Accuracy', label: 'Accuracy', target: 90 },
  { key: 'Robustness', label: 'Robustness', target: 90 },
  { key: 'Bias', label: 'Bias', target: 90 },
  { key: 'Resilience', label: 'Resilience', target: 60 },
  { key: 'Latency', label: 'Latency', target: 85 },
];

export function Step3Benchmarks({ onNext, onBack, onValidationChange }: Step3Props) {
  // read saved suites and any saved step3 configs from workflow store
  const storedStep2 = useAppSelector((state: any) => state.workflow?.currentWorkflow?.step2 || []);
  const storedStep3 = useAppSelector((state: any) => state.workflow?.currentWorkflow?.step3 || []);
  const dispatch = useAppDispatch();

  const [dimensionConfigs, setDimensionConfigs] = useState<{ dimension: string; target: number }[]>([]);

  // When storedStep2 or storedStep3 changes, initialize configs.
  // Prefer storedStep3 (previously saved targets) so returning to the step restores user inputs.
  useEffect(() => {
    if (Array.isArray(storedStep3) && storedStep3.length > 0) {
      // restore from saved step3
      const restored = storedStep3.map((s: any) => ({ dimension: s.dimension, target: s.target }));
      setDimensionConfigs(restored);
      return;
    }

    // otherwise derive from step2 suites
    const dims = new Set<string>();
    if (Array.isArray(storedStep2)) {
      storedStep2.forEach((s: any) => {
        const ds = Array.isArray(s.dimensions) ? s.dimensions : (typeof s.dimension === 'string' ? s.dimension.split(',').map((x: string) => x.trim()) : []);
        ds.forEach((d: string) => { if (d) dims.add(d); });
      });
    }
    const unique = Array.from(dims);
    const initial = unique.map((d) => {
      const match = benchmarks.find((b) => b.key.toLowerCase() === d.toLowerCase());
      // Ensure default target is at least 1 and at most 100
      const defaultTarget = match ? Math.max(1, Math.min(100, match.target)) : 1;
      return { dimension: d, target: defaultTarget };
    });
    setDimensionConfigs(initial);
    // persist initial configs to store as step3 (so refresh keeps values)
    const payload = initial.map((c) => ({ dimension: c.dimension, target: c.target }));
    dispatch(setStep3Data(payload));
  }, [storedStep2, storedStep3]);

  // validation: at least one dimension must be present
  // also require each target to be within 1..100 (no zeros, no >100)
  const isValid = dimensionConfigs.length > 0 && dimensionConfigs.every((c) => Number(c.target) >= 1 && Number(c.target) <= 100);
  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  // whenever configs change, persist to workflow store
  useEffect(() => {
    const payload = dimensionConfigs.map((c) => ({ dimension: c.dimension, target: c.target }));
    dispatch(setStep3Data(payload));
  }, [dimensionConfigs, dispatch]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-2xl font-bold">Benchmarks & Thresholds</h2>
        <p className="text-muted-foreground">Set performance targets for the dimensions you've selected</p>
      </div>

      {/* Global Benchmarks Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Global Benchmarks Summary</h3>
        <TooltipProvider>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {benchmarks.map((b) => {
              const info = dimensionInfo[b.key];
              return (
                <div
                  key={b.key}
                  className="rounded-lg border border-border p-4 bg-card relative"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{b.label}</h4>
                    {info && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-muted-foreground hover:text-foreground transition-colors">
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm p-4 space-y-2">
                          <div>
                            <p className="font-semibold text-sm mb-1">About {b.label}</p>
                            <p className="text-xs text-muted-foreground">{info.description}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-green-600">Benchmark</p>
                            <p className="text-xs">{info.benchmark}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-yellow-600">Threshold</p>
                            <p className="text-xs">{info.threshold}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-blue-600">Impact of Changes</p>
                            <p className="text-xs">{info.impact}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Target: ≥ {b.target}%
                  </p>
                </div>
              );
            })}
          </div>
        </TooltipProvider>
      </div>

      {/* Per-Dimension Configuration - only show dimensions selected in Step 2 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Per-Dimension Configuration</h3>
          <div className={`text-sm font-medium flex items-center gap-2 ${isValid ? 'text-success' : 'text-error'}`}>
            {!isValid && <AlertCircle className="h-4 w-4" />}
            {isValid ? 'Ready' : (dimensionConfigs.length === 0 ? 'No dimensions selected' : 'Invalid targets (must be 1–100)')}
          </div>
        </div>

        {!isValid && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-error/10 border border-error">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-error">Select at least one dimension in Test Design to configure benchmarks</p>
          </div>
        )}

        <div className="rounded-lg border border-border overflow-hidden">
          <div className="grid grid-cols-3 gap-4 bg-muted/50 p-4 font-medium text-sm">
            <div>Dimension</div>
            <div>Default Target (%)</div>
            <div>Set Target (%)</div>
          </div>
          <div className="divide-y divide-border">
            {dimensionConfigs.map((cfg, index) => {
              const defaultTarget = benchmarks.find((b) => b.key.toLowerCase() === cfg.dimension.toLowerCase())?.target ?? 0;
              const info = dimensionInfo[cfg.dimension];
              return (
                <div key={cfg.dimension} className="grid grid-cols-3 gap-4 p-4 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{cfg.dimension}</span>
                    {info && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="text-muted-foreground hover:text-foreground transition-colors">
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm p-4 space-y-2">
                            <div>
                              <p className="font-semibold text-sm mb-1">About {cfg.dimension}</p>
                              <p className="text-xs text-muted-foreground">{info.description}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-xs text-green-600">Benchmark</p>
                              <p className="text-xs">{info.benchmark}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-xs text-yellow-600">Threshold</p>
                              <p className="text-xs">{info.threshold}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-xs text-blue-600">Impact of Changes</p>
                              <p className="text-xs">{info.impact}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">{defaultTarget}%</div>
                  <div>
                    <Input
                      type="number"
                      value={cfg.target}
                      onChange={(e) => {
                        // clamp to 1..100 and avoid zero
                        const parsed = parseInt(e.target.value);
                        const clamped = Number.isNaN(parsed) ? 1 : Math.max(1, Math.min(100, parsed));
                        const newCfg = [...dimensionConfigs];
                        newCfg[index] = { ...newCfg[index], target: clamped };
                        setDimensionConfigs(newCfg);
                      }}
                      className="w-20"
                      min={1}
                      max={100}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* navigation: when user clicks continue, parent WorkflowWizard will call onNext which advances step
          but we ensure the latest dimensionConfigs are already in the store via the effect above */}
    </motion.div>
  );
}
