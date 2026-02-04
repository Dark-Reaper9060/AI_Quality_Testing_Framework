import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  additionalText?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorClass?: string;
  delay?: number;
}

export function KPICard({
  title,
  value,
  subtitle,
  additionalText,
  icon: Icon,
  trend,
  colorClass = 'text-primary',
  delay = 0,
}: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
      className="card-metric group"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn("text-3xl font-bold tracking-tight", colorClass)}>
            {value}
          </p>
          <div className="space-y-1">
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {additionalText && (
              <p className="text-xs text-muted-foreground">
                {additionalText.split('\n').map((line, i) => (
                  <span key={i} className="block">{line}</span>
                ))}
              </p>
            )}
          </div>
        </div>
        <div className={cn(
          "rounded-lg p-2.5 transition-colors duration-200",
          "bg-primary/10 group-hover:bg-primary/20"
        )}>
          <Icon className={cn("h-5 w-5", colorClass)} aria-hidden="true" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1">
          <span
            className={cn(
              "text-xs font-medium",
              trend.isPositive ? "text-success" : "text-error"
            )}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-muted-foreground">vs last week</span>
        </div>
      )}
    </motion.div>
  );
}
