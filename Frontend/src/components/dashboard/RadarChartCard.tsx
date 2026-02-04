import { motion } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { radarChartData } from '@/lib/mockData';

export function RadarChartCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="card-elevated p-6"
    >
      <h3 className="mb-4 text-lg font-semibold">Model Comparison</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarChartData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Radar
              name="Agent v1.0"
              dataKey="agentV1"
              stroke="hsl(var(--accuracy))"
              fill="hsl(var(--accuracy))"
              fillOpacity={0.3}
            />
            <Radar
              name="Agent v2.0"
              dataKey="agentV2"
              stroke="hsl(var(--robustness))"
              fill="hsl(var(--robustness))"
              fillOpacity={0.3}
            />
            <Radar
              name="Agent v3.0"
              dataKey="agentV3"
              stroke="hsl(var(--resilience))"
              fill="hsl(var(--resilience))"
              fillOpacity={0.3}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
