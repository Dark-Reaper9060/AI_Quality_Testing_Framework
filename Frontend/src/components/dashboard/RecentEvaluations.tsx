import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, Target, Shield, Scale, Zap } from 'lucide-react';
import { mockEvaluationRuns } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export function RecentEvaluations() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Evaluations</h3>
        <Badge variant="secondary">{mockEvaluationRuns.length} Total</Badge>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2">
        {mockEvaluationRuns.slice(0, 4).map((run, index) => (
          <motion.div
            key={run.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/30">
              <CardContent className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full shrink-0",
                      run.status === 'Complete' ? "bg-success/10" : run.status === 'Running' ? "bg-warning/10" : "bg-destructive/10"
                    )}>
                      {run.status === 'Complete' ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : run.status === 'Running' ? (
                        <Clock className="h-5 w-5 text-warning animate-pulse" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{run.agentName}</p>
                      <p className="text-xs text-muted-foreground">v{run.version}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-2xl font-bold",
                      run.overallScore >= 80 ? "text-success" : run.overallScore >= 60 ? "text-warning" : "text-destructive"
                    )}>
                      {run.overallScore}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Overall</p>
                  </div>
                </div>

                {/* Dimension Scores */}
                <div className="space-y-2">
                  <DimensionScore 
                    icon={Target} 
                    label="Accuracy" 
                    score={run.accuracy} 
                    colorClass="text-accuracy"
                  />
                  <DimensionScore 
                    icon={Shield} 
                    label="Robustness" 
                    score={run.robustness} 
                    colorClass="text-robustness"
                  />
                  <DimensionScore 
                    icon={Scale} 
                    label="Bias" 
                    score={run.bias} 
                    colorClass="text-bias"
                  />
                  <DimensionScore 
                    icon={Zap} 
                    label="Resilience" 
                    score={run.resilience} 
                    colorClass="text-resilience"
                  />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">{run.date}</p>
                  <Badge 
                    variant={run.status === 'Complete' ? 'default' : run.status === 'Running' ? 'secondary' : 'destructive'}
                    className="text-[10px] h-5"
                  >
                    {run.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

interface DimensionScoreProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  score: number;
  colorClass: string;
}

function DimensionScore({ icon: Icon, label, score, colorClass }: DimensionScoreProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("h-3.5 w-3.5 shrink-0", colorClass)} />
      <span className="text-xs text-muted-foreground w-16">{label}</span>
      <Progress 
        value={score} 
        className="h-1.5 flex-1"
      />
      <span className={cn("text-xs font-medium w-8 text-right", colorClass)}>{score}</span>
    </div>
  );
}
