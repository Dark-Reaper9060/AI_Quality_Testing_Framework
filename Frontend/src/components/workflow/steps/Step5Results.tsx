import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { mockFailedTestCases } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface Step5Props {
  onNext: () => void;
  onBack: () => void;
  onValidationChange?: (isValid: boolean) => void;
}



import { useAppSelector } from '@/store';

export function Step5Results({ onNext, onBack, onValidationChange }: Step5Props) {
  // Pull the latest evaluation result from the store
  const completedEvaluations = useAppSelector((state: any) => state.workflow?.completedEvaluations || []);
  const latestResult = completedEvaluations[completedEvaluations.length - 1];

  // Fallback if no result yet (shouldn't happen if forwarded correctly)
  const results = latestResult || {
    agentName: 'Unknown Agent',
    overallScore: 0,
    isDeploymentReady: false,
    dimensions: [],
  };

  // Results step is always valid - it's read-only
  useEffect(() => {
    onValidationChange?.(true);
  }, [onValidationChange]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold">Results Dashboard</h2>
        <p className="text-muted-foreground">Agent: {results.agentName}</p>
      </div>

      {/* Overall Score Banner */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Overall Quality Score</p>
              <p className="text-6xl font-bold text-foreground">{results.overallScore}</p>
            </div>
          </div>
          <div className="text-center">
            <Badge
              className={cn(
                "mt-2 text-sm px-4 py-1",
                results.isDeploymentReady ? "badge-success" : "badge-error"
              )}
            >
              {results.isDeploymentReady ? (
                <>
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Ready for Deployment
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-1 h-4 w-4" />
                  Not Ready
                </>
              )}
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Dimension Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {results.dimensions.map((dim, index) => (
          <motion.div
            key={dim.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className={cn(
              "rounded-lg border p-4",
              dim.name === 'Bias' && "border-l-4 border-l-bias"
            )}
          >
            <h4 className="font-semibold">{dim.name}</h4>
            <p className={cn(
              "text-3xl font-bold",
              dim.score >= 80 ? "text-success" : dim.score >= 60 ? "text-warning" : "text-error"
            )}>
              {dim.score}%
            </p>
            <p className="text-sm text-muted-foreground">
              {dim.failed} failed -{' '}
              <button className="text-primary hover:underline inline-flex items-center gap-1">
                View details
                <ExternalLink className="h-3 w-3" />
              </button>
            </p>
          </motion.div>
        ))}
      </div>

      {/* Failed Tests Table */}
      <Tabs defaultValue="automated" className="w-full">
        <TabsList>
          <TabsTrigger value="automated">Failed Automated Test Cases</TabsTrigger>

        </TabsList>

        <TabsContent value="automated">
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Input</TableHead>
                  <TableHead>Expected Rule</TableHead>
                  <TableHead>Model Output</TableHead>
                  <TableHead>Suite Name</TableHead>
                  <TableHead>Reason for Failure</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockFailedTestCases.map((testCase) => (
                  <TableRow key={testCase.id}>
                    <TableCell className="max-w-[150px] truncate">{testCase.input}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{testCase.expectedRule}</TableCell>
                    <TableCell>{testCase.modelOutput}</TableCell>
                    <TableCell>{testCase.suiteName}</TableCell>
                    <TableCell className="text-error">{testCase.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="manual">
          <div className="card-elevated p-8 text-center">
            <p className="text-muted-foreground">3 test cases pending manual review</p>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
