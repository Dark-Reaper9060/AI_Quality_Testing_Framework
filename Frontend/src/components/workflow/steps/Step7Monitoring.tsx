import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import { evaluationHistoryData, mockEvaluationRuns } from '@/lib/mockData';

interface Step7Props {
  onNext: () => void;
  onBack: () => void;
  onValidationChange?: (isValid: boolean) => void;
}

export function Step7Monitoring({ onNext, onBack, onValidationChange }: Step7Props) {
  const [scheduleEnabled, setScheduleEnabled] = useState(true);

  // Step 7 is always valid - it's the final review step
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
        <h2 className="text-2xl font-bold">Monitoring & History</h2>
        <p className="text-muted-foreground">Track performance over time and schedule evaluations</p>
      </div>

      {/* Evaluation History Timeline Chart */}
      <div className="card-elevated p-6">
        <h3 className="text-lg font-semibold mb-4">Evaluation History Timeline</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evaluationHistoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                stroke="hsl(var(--border))"
              />
              <YAxis
                domain={[80, 100]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                stroke="hsl(var(--border))"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="accuracy"
                name="Accuracy"
                stroke="hsl(var(--accuracy))"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="bias"
                name="Bias"
                stroke="hsl(var(--bias))"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="robustness"
                name="Robustness"
                stroke="hsl(var(--robustness))"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="resilience"
                name="Resilience"
                stroke="hsl(var(--resilience))"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Evaluation History Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Date</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Overall Score</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockEvaluationRuns.map((run) => (
              <TableRow key={run.id}>
                <TableCell>{run.date}</TableCell>
                <TableCell>{run.version}</TableCell>
                <TableCell className="font-semibold">{run.overallScore / 10}</TableCell>
                <TableCell>
                  <Badge className="badge-success gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {run.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Schedule Evaluation */}
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Schedule Evaluation</h3>
            <p className="text-sm text-muted-foreground">Run full suite every week</p>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="schedule"
              checked={scheduleEnabled}
              onCheckedChange={setScheduleEnabled}
            />
            <Label htmlFor="schedule" className="sr-only">
              Enable scheduled evaluation
            </Label>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
