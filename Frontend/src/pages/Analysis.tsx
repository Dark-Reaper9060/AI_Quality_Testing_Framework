import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, 
  Download, 
  ChevronRight, 
  Bot, 
  CheckCircle2, 
  AlertTriangle,
  Calendar,
  Tag,
  Globe,
  ExternalLink 
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppSelector } from '@/store';
import { cn } from '@/lib/utils';
import { EvaluationResult } from '@/store/slices/workflowSlice';

const errorDistribution = [
  { name: 'Factuality', value: 35, color: 'hsl(var(--accuracy))' },
  { name: 'Hallucination', value: 25, color: 'hsl(var(--bias))' },
  { name: 'Timeout', value: 20, color: 'hsl(var(--robustness))' },
  { name: 'Format Error', value: 15, color: 'hsl(var(--resilience))' },
  { name: 'Other', value: 5, color: 'hsl(var(--muted-foreground))' },
];

const performanceHistory = [
  { date: 'Jan 1', accuracy: 85, robustness: 78, bias: 82, resilience: 75 },
  { date: 'Jan 8', accuracy: 87, robustness: 80, bias: 84, resilience: 77 },
  { date: 'Jan 15', accuracy: 88, robustness: 82, bias: 85, resilience: 80 },
  { date: 'Jan 22', accuracy: 90, robustness: 85, bias: 87, resilience: 82 },
  { date: 'Jan 29', accuracy: 92, robustness: 88, bias: 89, resilience: 85 },
];

const costHistory = [
  { date: 'Jan 1', apiCost: 245.50, computeCost: 128.75, storageCost: 45.20, totalCost: 419.45 },
  { date: 'Jan 8', apiCost: 268.30, computeCost: 142.80, storageCost: 48.60, totalCost: 459.70 },
  { date: 'Jan 15', apiCost: 289.75, computeCost: 156.40, storageCost: 52.30, totalCost: 498.45 },
  { date: 'Jan 22', apiCost: 312.20, computeCost: 168.90, storageCost: 55.80, totalCost: 536.90 },
  { date: 'Jan 29', apiCost: 334.80, computeCost: 182.50, storageCost: 59.40, totalCost: 576.70 },
];

export default function Analysis() {
  const completedEvaluations = useAppSelector((state) => state.workflow.completedEvaluations);
  const [selectedAgent, setSelectedAgent] = useState<EvaluationResult | null>(null);

  const handleExportPDF = () => {
    if (!selectedAgent) return;

    // Create PDF content as HTML
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Agent Evaluation Report - ${selectedAgent.agentName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          .header { border-bottom: 3px solid #4F46E5; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #4F46E5; margin: 0; font-size: 28px; }
          .header p { color: #666; margin: 5px 0; }
          .section { margin: 30px 0; }
          .section h2 { color: #4F46E5; font-size: 20px; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px; }
          .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
          .info-item { padding: 15px; background: #F9FAFB; border-radius: 8px; }
          .info-label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
          .info-value { font-size: 18px; color: #111; margin-top: 5px; }
          .score-card { display: inline-block; padding: 20px 30px; background: #4F46E5; color: white; border-radius: 12px; font-size: 48px; font-weight: bold; margin: 20px 0; }
          .dimensions { margin: 20px 0; }
          .dimension-row { display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #E5E7EB; }
          .dimension-name { font-weight: 600; color: #333; }
          .dimension-score { font-size: 20px; font-weight: bold; color: #4F46E5; }
          .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; }
          .status-ready { background: #D1FAE5; color: #065F46; }
          .status-not-ready { background: #FEE2E2; color: #991B1B; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #E5E7EB; color: #666; font-size: 12px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>AI Agent Evaluation Report</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>

        <div class="section">
          <h2>Agent Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Agent Name</div>
              <div class="info-value">${selectedAgent.agentName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Version</div>
              <div class="info-value">${selectedAgent.version}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Model Type</div>
              <div class="info-value">${selectedAgent.modelType}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Endpoint</div>
              <div class="info-value" style="font-size: 14px; word-break: break-all;">${selectedAgent.endpoint}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Scenario</div>
              <div class="info-value">${selectedAgent.scenarioName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Evaluation Date</div>
              <div class="info-value">${selectedAgent.evaluationDate}</div>
            </div>
          </div>
          <p style="color: #666; margin-top: 15px;">${selectedAgent.description}</p>
        </div>

        <div class="section">
          <h2>Overall Score</h2>
          <div class="score-card">${selectedAgent.overallScore}</div>
          <div>
            <span class="status-badge ${selectedAgent.isDeploymentReady ? 'status-ready' : 'status-not-ready'}">
              ${selectedAgent.isDeploymentReady ? '✓ Ready for Deployment' : '✗ Not Ready for Deployment'}
            </span>
          </div>
        </div>

        <div class="section">
          <h2>Dimension Scores</h2>
          <div class="dimensions">
            ${selectedAgent.dimensions.map(dim => `
              <div class="dimension-row">
                <span class="dimension-name">${dim.name}</span>
                <span class="dimension-score">${dim.score}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="section">
          <h2>Test Suites</h2>
          <ul>
            ${selectedAgent.testSuites.map(suite => `<li style="padding: 8px 0; color: #333;">${suite}</li>`).join('')}
          </ul>
        </div>

        <div class="section">
          <h2>Tags</h2>
          <div>
            ${selectedAgent.tags.map(tag => `<span style="display: inline-block; padding: 6px 12px; background: #E0E7FF; color: #4F46E5; border-radius: 6px; margin: 5px; font-size: 14px;">${tag}</span>`).join('')}
          </div>
        </div>

        <div class="footer">
          <p>EvalSphere - Evaluating AI Beyond Accuracy</p>
          <p>This report was automatically generated by the EvalSphere system</p>
        </div>
      </body>
      </html>
    `;

    // Create a Blob from the HTML content
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // Open in new window for printing to PDF
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          URL.revokeObjectURL(url);
        }, 250);
      };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analysis</h1>
          <p className="text-muted-foreground">
            {selectedAgent 
              ? `Detailed results for ${selectedAgent.agentName}` 
              : 'Select an AI agent to view detailed results'}
          </p>
        </div>
        {selectedAgent && (
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleExportPDF}>
              <Download className="h-4 w-4" />
              Export to PDF
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Agent List Sidebar */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">AI Agents</h2>
          <div className="space-y-2">
            {completedEvaluations.map((evaluation) => (
              <motion.button
                key={evaluation.id}
                onClick={() => setSelectedAgent(evaluation)}
                className={cn(
                  "w-full p-4 rounded-lg border text-left transition-all",
                  selectedAgent?.id === evaluation.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{evaluation.agentName}</h3>
                      <p className="text-sm text-muted-foreground">{evaluation.version}</p>
                    </div>
                  </div>
                  <ChevronRight className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform",
                    selectedAgent?.id === evaluation.id && "rotate-90"
                  )} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Badge className={cn(
                    "text-xs",
                    evaluation.isDeploymentReady ? "badge-success" : "badge-error"
                  )}>
                    Score: {evaluation.overallScore}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{evaluation.evaluationDate}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Agent Details */}
        <AnimatePresence mode="wait">
          {selectedAgent ? (
            <motion.div
              key={selectedAgent.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Agent Info Card */}
              <div className="card-elevated p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold">{selectedAgent.agentName}</h2>
                      <Badge variant="outline">{selectedAgent.version}</Badge>
                    </div>
                    <p className="text-muted-foreground">{selectedAgent.description}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedAgent.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          <Tag className="h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-6xl font-bold">{selectedAgent.overallScore}</p>
                    <Badge className={cn(
                      "mt-2",
                      selectedAgent.isDeploymentReady ? "badge-success" : "badge-error"
                    )}>
                      {selectedAgent.isDeploymentReady ? (
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
                  <div>
                    <p className="text-sm text-muted-foreground">Model Type</p>
                    <p className="font-medium">{selectedAgent.modelType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Endpoint</p>
                    <p className="font-medium text-sm truncate flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {selectedAgent.endpoint}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Scenario</p>
                    <p className="font-medium">{selectedAgent.scenarioName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Evaluation Date</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {selectedAgent.evaluationDate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dimension Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedAgent.dimensions.map((dim, index) => (
                  <motion.div
                    key={dim.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-lg border border-border p-4"
                  >
                    <h4 className="font-semibold">{dim.name}</h4>
                    <p className={cn(
                      "text-3xl font-bold",
                      dim.score >= 80 ? "text-success" : dim.score >= 60 ? "text-warning" : "text-error"
                    )}>
                      {dim.score}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {dim.failed} failed cases
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Performance Over Time */}
                <div className="card-elevated p-6">
                  <h3 className="text-lg font-semibold mb-4">Performance Over Time</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        />
                        <YAxis
                          domain={[70, 100]}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="accuracy" name="Accuracy" stroke="hsl(var(--accuracy))" strokeWidth={2} />
                        <Line type="monotone" dataKey="robustness" name="Robustness" stroke="hsl(var(--robustness))" strokeWidth={2} />
                        <Line type="monotone" dataKey="bias" name="Bias" stroke="hsl(var(--bias))" strokeWidth={2} />
                        <Line type="monotone" dataKey="resilience" name="Resilience" stroke="hsl(var(--resilience))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Cost Over Time */}
                <div className="card-elevated p-6">
                  <h3 className="text-lg font-semibold mb-4">Cost Over Time</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={costHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        />
                        <YAxis
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="apiCost" name="API Cost" stroke="#3b82f6" strokeWidth={2} />
                        <Line type="monotone" dataKey="computeCost" name="Compute Cost" stroke="#10b981" strokeWidth={2} />
                        <Line type="monotone" dataKey="storageCost" name="Storage Cost" stroke="#f59e0b" strokeWidth={2} />
                        <Line type="monotone" dataKey="totalCost" name="Total Cost" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Test Suites */}
              <div className="card-elevated p-6">
                <h3 className="text-lg font-semibold mb-4">Test Suites Executed</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.testSuites.map((suite) => (
                    <Badge key={suite} variant="outline" className="gap-1">
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      {suite}
                    </Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-[500px] border border-dashed border-border rounded-lg"
            >
              <Bot className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Select an Agent</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Choose an AI agent from the list to view detailed evaluation results, 
                performance metrics, and analytics.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
