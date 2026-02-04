import { Target, Shield, Scale, Zap, Gauge, Clock, BarChart2, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { KPICard } from '@/components/dashboard/KPICard';
import { RadarChartCard } from '@/components/dashboard/RadarChartCard';
import { BiasTrendChart } from '@/components/dashboard/BiasTrendChart';
import { RecentEvaluations } from '@/components/dashboard/RecentEvaluations';
// import { mockKPIs } from '@/lib/mockData';
import { useAppSelector } from '@/store';
import { t } from '@/lib/i18n';
import { useEffect, useState } from 'react';
import { fetchModelDetails } from '@/lib/utils';


// Default dummy data for the dashboard metrics
const defaultMetrics = [
  {
    title: 'Avg Accuracy',
    value: '95',
    icon: Gauge,
    trend: {
      value: 2.5,
      isPositive: true
    },
    colorClass: 'text-green-500',

  },
  {
    title: 'AVG Score',
    value: '45',
    icon: Scale,
    trend: {
      value: 0.8,
      isPositive: false
    },
    colorClass: 'text-amber-500',
    subtitle: 'SPD Score (lower is better)',

  },
  {
    title: 'This Week',
    value: '6',
    icon: Activity,
    trend: {
      value: 12,
      isPositive: true
    },
    colorClass: 'text-blue-500',

  },
  {
    title: 'AVG Time',
    value: '3 mins',
    icon: Clock,
    trend: {
      value: 8,
      isPositive: false
    },
    colorClass: 'text-purple-500',

  }
];

// Get metrics from API or use default values
const getMetrics = (modelDetails, averageAccuracy) => {
  if (!modelDetails || modelDetails.length === 0) {
    return defaultMetrics;
  }

  return [
    {
      ...defaultMetrics[0],
      value: averageAccuracy !== null ? `${averageAccuracy.toFixed(2)}%` : '—'
    },
    {
      ...defaultMetrics[1],
      value: (() => {
        const biasVals = modelDetails.map((m: any) => m.biasScore ?? m.spd).filter((v: any) => v != null);
        return biasVals.length > 0
          ? (biasVals.reduce((a: number, b: number) => a + b, 0) / biasVals.length).toFixed(3)
          : '—';
      })()
    },
    {
      ...defaultMetrics[2],
      value: (() => {
        const counts = modelDetails.map((m: any) => m.testsThisWeek ?? m.testCount ?? 0);
        return counts.length > 0 ? counts.reduce((a: number, b: number) => a + b, 0).toLocaleString() : '—';
      })()
    },
    {
      ...defaultMetrics[3],
      value: (() => {
        const rts = modelDetails.map((m: any) => m.responseTime).filter((v: any) => v != null);
        return rts.length > 0 ? `${Math.round(rts.reduce((a: number, b: number) => a + b, 0) / rts.length)}ms` : '—';
      })()
    }
  ];
};

export default function Dashboard() {
  const language = useAppSelector((state) => state.language.current);
  const user = useAppSelector((state) => state.auth.user);
  const [modelDetails, setModelDetails] = useState<any[] | null>(null);
  const [averageAccuracy, setAverageAccuracy] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    document.title = 'Dashboard - EvalSphere';
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadDashboardData() {
      setLoading(true);
      setError(false);

      // Use fetchModelDetails directly (since 8000 is legacy/removed)
      console.log('Loading dashboard data...');
      const data = await fetchModelDetails();

      if (!mounted) return;

      if (data && data.models) {
        setModelDetails(data.models);
        // Calculate average accuracy
        const accuracies = data.models
          .map((model: any) => model.accuracy)
          .filter((acc: any) => acc != null);
        const avgAccuracy = accuracies.length > 0
          ? accuracies.reduce((a: number, b: number) => a + b, 0) / accuracies.length
          : null;
        setAverageAccuracy(avgAccuracy);
      } else {
        setModelDetails(null);
        setAverageAccuracy(null);
        setError(true);
      }

      setLoading(false);
    }

    loadDashboardData();
    return () => {
      mounted = false;
    };
  }, []);

  const models = modelDetails ?? [];
  const metrics = getMetrics(models, averageAccuracy);

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1"
      >
        <h1 className="text-3xl font-bold tracking-tight">
          {t('dashboard.title', language)} - EvalSphere
        </h1>
        <p className="text-muted-foreground">
          {t('dashboard.welcome', language)}, {user?.name}. Here's your AI testing overview.
        </p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => {
          // Use the title directly as it's already the translation key
          const title = t(metric.title, language) || metric.title;
          return (
            <KPICard
              key={metric.title}
              title={title}
              value={metric.value}
              icon={metric.icon}
              trend={metric.trend}
              colorClass={metric.colorClass}
              subtitle={metric.subtitle}

              delay={index + 1}
            />
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RadarChartCard />
        <BiasTrendChart />
      </div>

      {/* Recent Evaluations */}
      <RecentEvaluations />


    </div>
  );
}
