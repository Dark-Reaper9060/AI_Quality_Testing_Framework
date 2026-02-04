import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppSelector, useAppDispatch } from '@/store';
import { addCompletedEvaluation, setStep1Data, setStep2Data } from '@/store/slices/workflowSlice';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Step1ConfigureAgent } from './steps/Step1ConfigureAgent';
import { Step2TestDesign } from './steps/Step2TestDesign';
import { Step3Benchmarks } from './steps/Step3Benchmarks';
import { Step4RunEvaluation } from './steps/Step4RunEvaluation';
import { Step5Results } from './steps/Step5Results';
import { Step6ManualReview } from './steps/Step6ManualReview';
import { Step7Monitoring } from './steps/Step7Monitoring';
import { toast } from 'sonner';

const steps = [
  { id: 1, labelKey: 'workflow.step1', component: Step1ConfigureAgent },
  { id: 2, labelKey: 'workflow.step2', component: Step2TestDesign },
  { id: 3, labelKey: 'workflow.step3', component: Step3Benchmarks },
  { id: 4, labelKey: 'workflow.step4', component: Step4RunEvaluation },
  { id: 5, labelKey: 'workflow.step5', component: Step5Results },
  { id: 6, labelKey: 'workflow.step6', component: Step6ManualReview },
  { id: 7, labelKey: 'workflow.step7', component: Step7Monitoring },
];

export function WorkflowWizard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const workflowState = useAppSelector((s) => s.workflow);
  // ref that child steps (like Step2) can expose a save handler on. Parent calls it before advancing.
  const saveStepRef = useRef<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [stepValidation, setStepValidation] = useState<Record<number, boolean>>({});
  const language = useAppSelector((state) => state.language.current);

  const handleValidationChange = useCallback((stepId: number, isValid: boolean) => {
    setStepValidation(prev => ({ ...prev, [stepId]: isValid }));
  }, []);

  // Memoized per-step validation callback to keep child prop stable and avoid
  // triggering effects in child components on every parent render.
  const onValidationForCurrentStep = useCallback((isValid: boolean) => {
    handleValidationChange(currentStep, isValid);
  }, [handleValidationChange, currentStep]);

  // Fallback validator: compute validity from stored workflow data when child hasn't reported yet
  const computeStepValidFromStore = (stepId: number) => {
    const wf: any = workflowState.currentWorkflow || {};
    try {
      if (stepId === 1) {
        // step1 requires scenarioName and agentName at minimum
        const s1 = wf?.step1 || {};
        return Boolean(s1?.scenarioName || s1?.agentName);
      }
      if (stepId === 2) {
        // step2 valid if there is at least one suite saved
        const s2 = Array.isArray(wf?.step2) ? wf.step2 : [];
        return s2.length > 0;
      }
      if (stepId === 3) {
        // step3 valid if step3 config exists or we can derive dimensions from step2
        const s3 = Array.isArray(wf?.step3) ? wf.step3 : [];
        if (s3.length > 0) return true;
        const s2 = Array.isArray(wf?.step2) ? wf.step2 : [];
        const dims = new Set<string>();
        s2.forEach((s: any) => {
          const dList = Array.isArray(s.dimensions) ? s.dimensions : (typeof s.dimension === 'string' ? s.dimension.split(',').map((x: string) => x.trim()) : []);
          dList.forEach((d: string) => { if (d) dims.add(d); });
        });
        return dims.size > 0;
      }
    } catch (e) {
      return false;
    }
    return false;
  };

  const isCurrentStepValid = stepValidation[currentStep];
  const effectiveIsValid = (typeof isCurrentStepValid === 'boolean') ? isCurrentStepValid : computeStepValidFromStore(currentStep);

  const handleNext = () => {
    // If current step exposes a save handler, call it so child can persist its data before we log/advance.
    let savedPayload: any = null;
    try {
      if (saveStepRef && saveStepRef.current && typeof saveStepRef.current === 'function') {
        savedPayload = saveStepRef.current();
      }
    } catch (e) {
      // ignore
    }

    // If the child's save handler returned a snapshot, persist it synchronously
    if (savedPayload) {
      try {
        if (savedPayload.step1) dispatch(setStep1Data(savedPayload.step1));
        if (savedPayload.step2) dispatch(setStep2Data(savedPayload.step2));
      } catch (e) { }
    }

    // Log current workflow details for debugging before proceeding
    // If on step 2, log step2-specific details for easier debugging
    if (currentStep === 2) {
      const step2 = savedPayload?.step2 ?? workflowState.currentWorkflow.step2;
      const selected = (step2 && Array.isArray(step2)) ? step2.map((s: any) => s.name || s.id) : workflowState.currentWorkflow.selectedSuites;
    }
    // If on step 3, log step3-specific details (benchmarks/targets)
    if (currentStep === 3) {
      // also log a readable mapping of dimension->target if available
      if (Array.isArray(workflowState.currentWorkflow.step3)) {
      }
    }

    // Determine validity: prefer explicit child validation, then savedPayload, then store fallback.
    const reported = typeof stepValidation[currentStep] === 'boolean' ? stepValidation[currentStep] : undefined;
    let isValidNow = false;
    if (reported !== undefined) {
      isValidNow = reported;
    } else if (savedPayload) {
      // derive validity from savedPayload for the current step
      if (currentStep === 1) {
        isValidNow = Boolean(savedPayload?.step1 && (savedPayload.step1.scenarioName || savedPayload.step1.agentName));
      } else if (currentStep === 2) {
        isValidNow = Array.isArray(savedPayload?.step2) ? savedPayload.step2.length > 0 : false;
      } else if (currentStep === 3) {
        isValidNow = Array.isArray(savedPayload?.step3) ? savedPayload.step3.length > 0 : (Array.isArray(savedPayload?.step2) ? savedPayload.step2.length > 0 : false);
      } else {
        // fallback to store
        isValidNow = computeStepValidFromStore(currentStep);
      }
    } else {
      isValidNow = computeStepValidFromStore(currentStep);
    }

    if (!isValidNow) {
      toast.error('Please complete all required fields before proceeding');
      return;
    }

    if (currentStep < 7) {
      setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
      setCurrentStep((prev) => prev + 1);
    } else {
      // Final step - save evaluation and navigate to Analysis
      const newEvaluation = {
        id: `eval-${Date.now()}`,
        agentName: 'NewAgent',
        version: 'v1.0',
        modelType: 'OpenAI GPT-4o',
        endpoint: 'https://api.example.com/v1',
        scenarioName: 'New Scenario',
        description: 'Newly created evaluation',
        overallScore: 88,
        isDeploymentReady: true,
        dimensions: [
          { name: 'Accuracy', score: 88, failed: 3 },
          { name: 'Robustness', score: 75, failed: 8 },
          { name: 'Bias', score: 85, failed: 2 },
          { name: 'Resilience', score: 70, failed: 5 },
        ],
        evaluationDate: new Date().toISOString().split('T')[0],
        tags: ['Manufacturing'],
        testSuites: ['Accuracy Suite'],
      };

      dispatch(addCompletedEvaluation(newEvaluation));
      toast.success('Evaluation completed! Redirecting to Analysis...');
      navigate('/analysis');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    if (completedSteps.includes(stepId - 1) || stepId === 1 || stepId <= currentStep) {
      setCurrentStep(stepId);
    }
  };

  const CurrentStepComponent = steps[currentStep - 1].component;
  const Comp: any = CurrentStepComponent as any;

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="overflow-x-auto pb-4">
        <div className="flex items-center justify-between min-w-[640px]">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStep === step.id;
            const isAccessible = isCompleted || step.id <= currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => handleStepClick(step.id)}
                  disabled={!isAccessible}
                  className={cn(
                    "flex flex-col items-center gap-2 transition-all duration-300",
                    isAccessible ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isCurrent ? 1.1 : 1,
                    }}
                    className={cn(
                      "wizard-step",
                      isCurrent && "wizard-step-active",
                      isCompleted && !isCurrent && "wizard-step-complete",
                      !isCompleted && !isCurrent && "wizard-step-pending"
                    )}
                  >
                    {isCompleted && !isCurrent ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      step.id
                    )}
                  </motion.div>
                  <span className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )}>
                    {t(step.labelKey, language)}
                  </span>
                </button>

                {index < steps.length - 1 && (
                  <div className={cn(
                    "mx-2 h-0.5 w-12 transition-colors duration-300",
                    isCompleted ? "bg-primary" : "bg-border"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Validation warning is shown via toast when the user attempts to continue with invalid data */}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-[400px]"
        >
          <Comp
            onNext={handleNext}
            onBack={handleBack}
            onValidationChange={onValidationForCurrentStep}
            saveStepRef={saveStepRef}
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-between border-t border-border pt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          {t('common.back', language)}
        </Button>
        <Button
          onClick={handleNext}
          disabled={!effectiveIsValid}
        >
          {currentStep === 7 ? 'Complete & View Analysis' : t('common.continue', language)}
        </Button>
      </div>
    </div>
  );
}
