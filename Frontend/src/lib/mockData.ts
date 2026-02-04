// Mock data for EvalSphere application

export interface Agent {
  id: string;
  name: string;
  version: string;
  modelType: string;
  endpoint: string;
  createdAt: string;
}

export interface TestSuite {
  id: string;
  name: string;
  type: 'Automated' | 'Manual';
  dimension: 'Accuracy' | 'Robustness' | 'Bias' | 'Resilience';
  testCount: number;
  status: 'Ready' | 'Draft' | 'Running';
}

export interface EvaluationRun {
  id: string;
  agentId: string;
  agentName: string;
  version: string;
  date: string;
  overallScore: number;
  status: 'Complete' | 'Running' | 'Failed';
  accuracy: number;
  robustness: number;
  bias: number;
  resilience: number;
}

export interface FailedTestCase {
  id: string;
  input: string;
  expectedRule: string;
  modelOutput: string;
  suiteName: string;
  reason: string;
}

// Mock Agents
export const mockAgents: Agent[] = [
  { id: '1', name: 'SupplierAgent', version: '1.0', modelType: 'OpenAI GPT-4o', endpoint: 'https://api.example.com/v1', createdAt: '2025-12-16' },
  { id: '2', name: 'Procurement Agent', version: '1.0', modelType: 'Local LLM', endpoint: 'http://localhost:11434', createdAt: '2025-12-15' },
  { id: '3', name: 'Downtime Analysis Agent', version: '1.0', modelType: 'Custom API', endpoint: 'https://ai.internal.com/inspect', createdAt: '2025-12-16' },
  { id: '4', name: 'Summarizer Agent', version: '1.0', modelType: 'DeepSeek', endpoint: 'https://ai.internal.com/inspect', createdAt: '2024-03-10' },
];

// Mock Test Suites
export const mockTestSuites: TestSuite[] = [
  { id: '1', name: 'Accuracy - Supplier Quotes', type: 'Automated', dimension: 'Accuracy', testCount: 15, status: 'Ready' },
  { id: '2', name: 'Predictive Maintenance for CNC Machines', type: 'Automated', dimension: 'Accuracy', testCount: 15, status: 'Ready' },
  { id: '3', name: 'Robustness - Supplier API', type: 'Automated', dimension: 'Robustness', testCount: 10, status: 'Ready' },
  { id: '4', name: 'Accuracy - Supplier Maintenance', type: 'Automated', dimension: 'Robustness', testCount: 10, status: 'Ready' },
  { id: '5', name: 'Accuracy - Supplier Bias', type: 'Automated', dimension: 'Accuracy', testCount: 13, status: 'Ready' },
  { id: '6', name: 'Bias Detection Suite', type: 'Automated', dimension: 'Bias', testCount: 8, status: 'Ready' },
  { id: '7', name: 'Resilience - API Recovery', type: 'Automated', dimension: 'Resilience', testCount: 6, status: 'Ready' },
];

// Standard test case templates grouped by dimension — used in Step 2 designer as reusable test inputs
export const standardTestCases: Record<string, string[]> = {
  Accuracy: [
    'Verify numeric prediction within 5% of ground truth',
    'Ensure classification label matches annotated example',
    'Validate entity extraction includes required fields',
  ],
  Robustness: [
    'Handle network timeout gracefully',
    'Process malformed input without crashing',
    'Maintain output quality under noisy input',
  ],
  Bias: [
    'Compare outcomes across demographic groups',
    'Detect disparate impact on protected attributes',
    'Ensure consistent predictions across syntactic variants',
  ],
  Resilience: [
    'Recover state after service restart',
    'Maintain throughput under spike of requests',
    'Failover to fallback model on error',
  ],
};

// Mock Evaluation Runs
export const mockEvaluationRuns: EvaluationRun[] = [
  { id: '1', agentId: '1', agentName: 'SupplierAgent', version: '1.0.0', date: 'Decemeber 18, 2025 13:22:00', overallScore: 84, status: 'Complete', accuracy: 88, robustness: 86, bias: 85, resilience: 70 },
  { id: '2', agentId: '1', agentName: 'Procurement Agent', version: '1.0.3', date: 'Decemeber 18, 2025 07:48:00', overallScore: 76, status: 'Complete', accuracy: 82, robustness: 75, bias: 78, resilience: 65 },
  { id: '3', agentId: '1', agentName: 'Downtime Analysis Agent', version: '1.0.2', date: 'Decemeber 18, 2025 17:08:00', overallScore: 70, status: 'Complete', accuracy: 75, robustness: 70, bias: 72, resilience: 60 },
  { id: '4', agentId: '1', agentName: 'Summarizer Agent', version: '1.0.1', date: 'Decemeber 17, 2025 17:43:00', overallScore: 70, status: 'Complete', accuracy: 73, robustness: 68, bias: 75, resilience: 62 },
];

// Mock Failed Test Cases
export const mockFailedTestCases: FailedTestCase[] = [
  {
    id: '1',
    input: 'Supplier Agent v1.0-0 to dante Aport 5 0027',
    expectedRule: 'Expected Rule: about the supplier maintenance',
    modelOutput: 'SupplierAgent v1.0',
    suiteName: 'Accuracy - Supplier Quotes',
    reason: 'The output was hallucinated.'
  },
  {
    id: '2',
    input: 'What is the optimal reorder point for component X?',
    expectedRule: 'Calculate using demand × lead time + safety stock',
    modelOutput: 'Recommended reorder at 500 units',
    suiteName: 'Accuracy - Supplier Maintenance',
    reason: 'Missing calculation methodology in response'
  },
];

// Mock KPI Data
export const mockKPIs = {
  avgAccuracy: 87.5,
  avgBias: 0.12,
  testsThisWeek: 156,
  avgResponseTime: 245, // ms
};

// Bias Trend Data (SPD over time)
export const biasTrendData = [
  { date: '04/29', spd: 0.15 },
  { date: '01/16', spd: 0.12 },
  { date: '01/24', spd: 0.18 },
  { date: '01/22', spd: 0.10 },
  { date: '01/10', spd: 0.14 },
  { date: '01/07', spd: 0.11 },
];

// Radar Chart Data for Model Comparison
export const radarChartData = [
  { dimension: 'Accuracy', agentV1: 88, agentV2: 92, agentV3: 85 },
  { dimension: 'Robustness', agentV1: 86, agentV2: 78, agentV3: 90 },
  { dimension: 'Fairness', agentV1: 85, agentV2: 88, agentV3: 82 },
  { dimension: 'Speed', agentV1: 92, agentV2: 85, agentV3: 95 },
  { dimension: 'Consistency', agentV1: 80, agentV2: 82, agentV3: 78 },
];

// Evaluation History Timeline Data
export const evaluationHistoryData = [
  { date: '04/29/2021', accuracy: 91, bias: 88, robustness: 92, resilience: 90 },
  { date: '01/16/2021', accuracy: 94, bias: 90, robustness: 89, resilience: 93 },
  { date: '01/24/2021', accuracy: 96, bias: 87, robustness: 91, resilience: 88 },
  { date: '01/22/2021', accuracy: 92, bias: 85, robustness: 88, resilience: 92 },
  { date: '01/10/2021', accuracy: 93, bias: 92, robustness: 90, resilience: 89 },
  { date: '01/07/2021', accuracy: 88, bias: 89, robustness: 87, resilience: 91 },
];

// Calculate SPD (Statistical Parity Difference) 
// Formula: SPD = |μA - μB|
export function calculateSPD(groupA: number[], groupB: number[]): number {
  const meanA = groupA.reduce((a, b) => a + b, 0) / groupA.length;
  const meanB = groupB.reduce((a, b) => a + b, 0) / groupB.length;
  return Math.abs(meanA - meanB);
}

// Calculate Overall Quality Score
export function calculateOverallScore(weights: { accuracy: number; robustness: number; bias: number; resilience: number }, scores: { accuracy: number; robustness: number; bias: number; resilience: number }): number {
  const totalWeight = weights.accuracy + weights.robustness + weights.bias + weights.resilience;
  return Math.round(
    (weights.accuracy * scores.accuracy +
      weights.robustness * scores.robustness +
      weights.bias * scores.bias +
      weights.resilience * scores.resilience) /
    totalWeight
  );
}
