import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useAppSelector } from '@/store';
import { toast } from 'sonner';

interface Step6Props {
  onNext: () => void;
  onBack: () => void;
  onValidationChange?: (isValid: boolean) => void;
}

const mockTestCase = {
  input: 'Given this machine telemetry, what maintenance action is recommended?',
  response: 'Recommend maintenance within 24 hours if vibration > threshold.',
  dimension: 'Accuracy',
};

export function Step6ManualReview({ onNext, onBack, onValidationChange }: Step6Props) {
  const [accuracy, setAccuracy] = useState([4]);
  const [clarity, setClarity] = useState([3]);
  const [policyCompliance, setPolicyCompliance] = useState([5]);
  const [comments, setComments] = useState('');
  const [isCritical, setIsCritical] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Valid once the review is submitted
  useEffect(() => {
    onValidationChange?.(reviewSubmitted);
  }, [reviewSubmitted, onValidationChange]);

  const workflow = useAppSelector((state: any) => state.workflow?.currentWorkflow || {});
  const lastRawData = useAppSelector((state: any) => state.workflow?.lastAnalysisRawData);

  const handleSubmitReview = async () => {
    // Post the EXACT same data we received from evaluation
    const payload = lastRawData;

    if (!payload) {
      toast.error('No analysis data to save. Please run evaluation first.');
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8900/save-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: payload }),
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      toast.success('Analysis saved successfully');
      setReviewSubmitted(true);
    } catch (error) {
      console.error('Failed to save analysis:', error);
      toast.error('Failed to save analysis');
      setReviewSubmitted(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold">Manual Review</h2>
        <p className="text-muted-foreground">Review and score AI agent responses</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Test Case Panel */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b border-border pb-2">Test Case</h3>

          <div className="space-y-4">
            <div className="rounded-lg border border-border p-4 space-y-2">
              <Label className="text-muted-foreground text-sm">Input / Context</Label>
              <p className="text-sm">{mockTestCase.input}</p>
            </div>

            <div className="rounded-lg border border-border p-4 space-y-2">
              <Label className="text-muted-foreground text-sm">Agent Response</Label>
              <p className="text-sm">{mockTestCase.response}</p>
            </div>

            <div className="rounded-lg border border-border p-4 space-y-2">
              <Label className="text-muted-foreground text-sm">Dimension</Label>
              <p className="text-sm font-medium">{mockTestCase.dimension}</p>
            </div>
          </div>
        </div>

        {/* Review Panel */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b border-border pb-2">Review</h3>

          <div className="space-y-6">
            {/* Accuracy Slider */}
            <div className="space-y-3">
              <Label>Accuracy</Label>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">1</span>
                <Slider
                  value={accuracy}
                  onValueChange={setAccuracy}
                  min={1}
                  max={5}
                  step={1}
                  className="flex-1"
                  disabled={reviewSubmitted}
                />
                <span className="text-sm text-muted-foreground">5</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </div>
            </div>

            {/* Clarity Slider */}
            <div className="space-y-3">
              <Label>Clarity</Label>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">1</span>
                <Slider
                  value={clarity}
                  onValueChange={setClarity}
                  min={1}
                  max={5}
                  step={1}
                  className="flex-1"
                  disabled={reviewSubmitted}
                />
                <span className="text-sm text-muted-foreground">5</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </div>
            </div>

            {/* Policy Compliance Slider */}
            <div className="space-y-3">
              <Label>Policy Compliance</Label>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">1</span>
                <Slider
                  value={policyCompliance}
                  onValueChange={setPolicyCompliance}
                  min={1}
                  max={5}
                  step={1}
                  className="flex-1"
                  disabled={reviewSubmitted}
                />
                <span className="text-sm text-muted-foreground">5</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add your review comments..."
                rows={3}
                disabled={reviewSubmitted}
              />
            </div>

            {/* Critical Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="critical"
                checked={isCritical}
                onCheckedChange={(checked) => setIsCritical(checked as boolean)}
                disabled={reviewSubmitted}
              />
              <Label htmlFor="critical" className="text-error font-medium cursor-pointer">
                Mark as Critical
              </Label>
            </div>

            <Button
              className="w-full"
              onClick={handleSubmitReview}
              disabled={reviewSubmitted}
            >
              {reviewSubmitted ? 'Review Submitted ✓' : 'Save & Submit Review'}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
