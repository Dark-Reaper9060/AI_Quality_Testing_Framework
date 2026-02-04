import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { fetchModelDetails } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { biasTrendData } from '@/lib/mockData';

export function BiasTrendChart() {
  const [modelDetails, setModelDetails] = useState<any[] | null>(null);
  const [averageAccuracy, setAverageAccuracy] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadModelDetails() {
      setLoading(true);
      setError(false);
      const data = await fetchModelDetails();
      if (!mounted) return;
      if (data && data.models) {
        setModelDetails(data.models);
        const accuracies = data.models.map((model: any) => model.accuracy).filter((acc: any) => acc != null);
        const avgAccuracy = accuracies.length > 0 ? accuracies.reduce((a: number, b: number) => a + b, 0) / accuracies.length : null;
        setAverageAccuracy(avgAccuracy);
      } else {
        setModelDetails(null);
        setAverageAccuracy(null);
        setError(true);
      }
      setLoading(false);
    }

    loadModelDetails();
    return () => {
      mounted = false;
    };
  }, []);

  const statusText = loading ? 'Loading model data…' : error ? 'No model data' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="card-elevated p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bias Scorer Trend (SPD)</h3>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-bias" />
          <span className="text-sm text-muted-foreground">Statistical Parity Difference</span>
        </div>
      </div>

      {statusText && (
        <div className="mb-2 text-sm text-muted-foreground">{statusText}</div>
      )}

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={biasTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              stroke="hsl(var(--border))"
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              stroke="hsl(var(--border))"
              domain={[0, 0.25]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [value.toFixed(3), 'SPD']}
            />
            <Line
              type="monotone"
              dataKey="spd"
              stroke="hsl(var(--bias))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--bias))', r: 4 }}
              activeDot={{ r: 6, fill: 'hsl(var(--bias))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        SPD measures fairness: lower values indicate less bias. Formula: SPD = |μA - μB|
      </p>
      <div className="mt-4">
        <h4 className="text-sm font-semibold">Average Accuracy</h4>
        <p>{averageAccuracy !== null ? `${averageAccuracy.toFixed(2)}%` : 'No data available'}</p>
      </div>
    </motion.div>
  );
}
