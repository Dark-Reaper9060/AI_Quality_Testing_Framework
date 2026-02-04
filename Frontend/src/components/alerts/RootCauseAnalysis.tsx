import { useState } from 'react';
import { AlertTriangle, BarChart2, ChevronRight, GitBranch, GitCommit, GitPullRequest, Layers, Target, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type RCAInsight = {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  relatedComponents: string[];
  timestamp: string;
};

type RCAMetrics = {
  name: string;
  current: number;
  baseline: number;
  threshold: number;
  unit: string;
};

const RootCauseAnalysis = ({ alertId }: { alertId: string }) => {
  // State for dismiss and ticket creation
  const [isDismissing, setIsDismissing] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [ticketCreated, setTicketCreated] = useState(false);

  // Handler for dismiss action
  const handleDismiss = () => {
    setIsDismissing(true);
    // Simulate API call
    setTimeout(() => {
      setIsDismissing(false);
      setIsDismissed(true);
      // In a real app, you would update the alert status in your state/API
    }, 1000);
  };

  // Handler for create ticket action
  const handleCreateTicket = () => {
    setIsCreatingTicket(true);
    // Simulate API call
    setTimeout(() => {
      setIsCreatingTicket(false);
      setTicketCreated(true);
      // Reset after 5 seconds
      setTimeout(() => setTicketCreated(false), 5000);
    }, 1500);
  };
  // Mock data - in a real app, this would come from an API
  const insights: RCAInsight[] = [
    {
      id: 'insight-1',
      title: 'Input Data Drift Detected',
      description: 'The input data distribution has significantly changed compared to the training data distribution, causing model performance degradation.',
      severity: 'high',
      confidence: 0.87,
      relatedComponents: ['Data Pipeline', 'Feature Store'],
      timestamp: '2025-12-18T08:30:00Z',
    },
    {
      id: 'insight-2',
      title: 'Concept Drift in User Behavior',
      description: 'User interaction patterns have evolved, making the current model less effective.',
      severity: 'medium',
      confidence: 0.72,
      relatedComponents: ['User Behavior Tracker', 'Model Monitor'],
      timestamp: '2025-12-17T14:15:00Z',
    },
  ];

  const metrics: RCAMetrics[] = [
    { name: 'Accuracy', current: 0.82, baseline: 0.92, threshold: 0.85, unit: '%' },
    { name: 'Precision', current: 0.78, baseline: 0.88, threshold: 0.8, unit: '%' },
    { name: 'Recall', current: 0.85, baseline: 0.89, threshold: 0.82, unit: '%' },
    { name: 'F1 Score', current: 0.81, baseline: 0.9, threshold: 0.83, unit: '' },
  ];

  const getSeverityBadge = (severity: string) => {
    const variants = {
      high: 'bg-red-500/20 text-red-600 hover:bg-red-500/20',
      medium: 'bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/20',
      low: 'bg-blue-500/20 text-blue-600 hover:bg-blue-500/20',
    };
    return (
      <Badge className={`${variants[severity as keyof typeof variants]} capitalize`}>
        {severity}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <motion.div 
        className="w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div 
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Root Cause Analysis
            </h1>
            <p className="text-muted-foreground">Detailed analysis of alert <span className="font-mono font-medium text-primary">#{alertId}</span></p>
          </div>
          <motion.div 
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <Button 
              variant="outline" 
              size="sm"
              className="group hover:bg-primary/10 transition-colors"
            >
              <GitPullRequest className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
              <span>Create Fix PR</span>
              <ChevronRight className="ml-1 h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Button>
            <Button 
              variant="default" 
              size="sm"
              className="group hover:shadow-lg hover:shadow-primary/20 transition-all"
            >
              <Target className="mr-2 h-4 w-4 group-hover:animate-pulse" />
              <span>Apply Fix</span>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Tabs defaultValue="insights" className="w-full">
          <TabsList className="bg-muted/50 p-1 h-auto rounded-lg">
            {['insights', 'metrics', 'timeline', 'suggestions'].map((tab) => (
              <TabsTrigger 
                key={tab}
                value={tab}
                className="relative px-4 py-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                {tab === 'insights' && 'Key Insights'}
                {tab === 'metrics' && 'Performance Metrics'}
                {tab === 'timeline' && 'Event Timeline'}
                {tab === 'suggestions' && 'Remediation'}
                <motion.span 
                  className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"
                  layoutId="tabIndicator"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              </TabsTrigger>
            ))}
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="insights" className="space-y-4">
            {insights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.3 }}
              >
                <Card className="group border-l-4 border-l-primary hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardHeader className="relative pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className={cn(
                          "p-1.5 rounded-lg",
                          insight.severity === 'high' ? 'bg-red-500/10 text-red-500' :
                          insight.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-blue-500/10 text-blue-500'
                        )}>
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                          {insight.title}
                        </span>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(insight.severity)}
                        <div className="relative">
                          <div className="absolute inset-0 bg-primary/10 rounded-full" />
                          <Badge variant="outline" className="relative bg-background/80 backdrop-blur-sm text-xs border-border/50">
                            <span className="relative z-10">
                              Confidence: {(insight.confidence * 100).toFixed(0)}%
                            </span>
                            <motion.span 
                              className="absolute bottom-0 left-0 h-full bg-primary/10 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${insight.confidence * 100}%` }}
                              transition={{ duration: 1, delay: 0.5 }}
                            />
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 leading-relaxed">{insight.description}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {insight.relatedComponents.map((comp) => (
                        <motion.div
                          key={comp}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Badge 
                            variant="outline" 
                            className="text-xs border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                          >
                            {comp}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-primary/50 mr-2 animate-pulse" />
                      Detected: {new Date(insight.timestamp).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground/90">
                  <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                    <BarChart2 className="h-5 w-5" />
                  </div>
                  <span>Performance Metrics</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Current performance metrics compared to baseline and threshold values
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {metrics.map((metric, index) => {
                  const isBelowThreshold = metric.current < metric.threshold;
                  const percentageDiff = ((metric.current - metric.baseline) / metric.baseline) * 100;
                  const progress = Math.min(metric.current * 100, 100);
                  
                  return (
                    <motion.div 
                      key={metric.name} 
                      className="space-y-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.3 }}
                    >
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-foreground/90">{metric.name}</span>
                        <span className={cn(
                          "font-mono font-medium transition-colors",
                          isBelowThreshold ? 'text-red-500' : 'text-green-500'
                        )}>
                          {metric.current.toFixed(2)}{metric.unit} 
                          <span className={cn(
                            "text-xs ml-1",
                            percentageDiff >= 0 ? 'text-green-500' : 'text-red-500'
                          )}>
                            ({percentageDiff > 0 ? '+' : ''}{percentageDiff.toFixed(1)}%)
                          </span>
                        </span>
                      </div>
                      
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full ${
                            isBelowThreshold ? 'bg-gradient-to-r from-red-500 to-red-400' : 
                            'bg-gradient-to-r from-green-500 to-green-400'
                          } rounded-full`}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, delay: 0.5 + (index * 0.1), type: 'spring', bounce: 0.3 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 mix-blend-overlay" />
                        </motion.div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Baseline: {metric.baseline.toFixed(2)}{metric.unit}</span>
                        <span className="font-medium">
                          Threshold: <span className={isBelowThreshold ? 'text-red-500' : 'text-green-500'}>
                            {metric.threshold.toFixed(2)}{metric.unit}
                          </span>
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="timeline">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground/90">
                  <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                    <GitBranch className="h-5 w-5" />
                  </div>
                  <span>Event Timeline</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Chronological sequence of events leading to the current alert
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20" />
                  
                  <div className="space-y-8">
                    {[
                      { 
                        id: 1, 
                        type: 'deployment', 
                        title: 'Model v1.2 Deployed', 
                        timestamp: '2025-12-15T10:00:00Z',
                        description: 'New model version deployed to production',
                        icon: (
                          <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
                            <Layers className="h-4 w-4" />
                          </div>
                        ),
                        color: 'blue'
                      },
                      { 
                        id: 2, 
                        type: 'alert', 
                        title: 'Performance Degradation Detected', 
                        timestamp: '2025-12-17T15:30:00Z',
                        description: 'Model accuracy dropped below threshold',
                        icon: (
                          <div className="p-1.5 bg-yellow-500/10 text-yellow-500 rounded-lg">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                        ),
                        color: 'yellow'
                      },
                      { 
                        id: 3, 
                        type: 'analysis', 
                        title: 'Root Cause Analysis Completed', 
                        timestamp: '2025-12-18T08:30:00Z',
                        description: 'Input data drift identified as primary cause',
                        icon: (
                          <div className="p-1.5 bg-purple-500/10 text-purple-500 rounded-lg">
                            <BarChart2 className="h-4 w-4" />
                          </div>
                        ),
                        color: 'purple'
                  },
                ].map((event) => (
                  <div key={event.id} className="flex gap-4 pb-4 border-l-2 border-muted pl-4 relative">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-background" />
                    </div>
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="p-1.5 rounded-full bg-primary/10">
                        {event.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{event.title}</h4>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
                  </TabsContent>

            <TabsContent value="suggestions">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Recommended Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Immediate Actions</h4>
              <ul className="space-y-2 list-disc pl-5">
                <li>Retrain model with recent data to address concept drift</li>
                <li>Update feature engineering pipeline to handle new data patterns</li>
                <li>Implement data quality checks in the ingestion pipeline</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Long-term Improvements</h4>
              <ul className="space-y-2 list-disc pl-5">
                <li>Implement automated retraining pipeline with drift detection</li>
                <li>Set up A/B testing framework for model updates</li>
                <li>Enhance monitoring with custom metrics for domain-specific edge cases</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={handleDismiss}
                disabled={isDismissing || isDismissed}
              >
                {isDismissing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Dismissing...
                  </>
                ) : isDismissed ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Dismissed
                  </>
                ) : (
                  'Dismiss'
                )}
              </Button>
              <Button 
                onClick={handleCreateTicket}
                disabled={isCreatingTicket || ticketCreated}
                className={ticketCreated ? 'bg-green-600 hover:bg-green-600' : ''}
              >
                {isCreatingTicket ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : ticketCreated ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Ticket Created!
                  </>
                ) : (
                  'Create Improvement Ticket'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
                  </TabsContent>
          </AnimatePresence>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RootCauseAnalysis;
