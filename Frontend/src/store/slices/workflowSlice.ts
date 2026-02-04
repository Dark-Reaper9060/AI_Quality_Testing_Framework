import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface WorkflowStep1Data {
  scenarioName: string;
  description: string;
  tags: string[];
  agentName: string;
  modelType: string;
  endpoint?: string;
}

export interface EvaluationResult {
  id: string;
  agentName: string;
  version: string;
  modelType: string;
  endpoint: string;
  scenarioName: string;
  description: string;
  overallScore: number;
  isDeploymentReady: boolean;
  dimensions: {
    name: string;
    score: number;
    failed: number;
  }[];
  evaluationDate: string;
  tags: string[];
  testSuites: string[];
}

interface TempUploadedCsv {
  name: string;
  rows: string[];
  // optional raw File reference (keeps File in Redux so the UI can upload as multipart)
  file?: File | null;
  // optional URL when user imported via link rather than raw File
  url?: string | null;
}

interface WorkflowState {
  currentWorkflow: {
    step1: WorkflowStep1Data | null;
    step2: any[]; // full saved suites from step 2
    step3: any[]; // saved benchmark configs from step 3
    selectedSuites: string[];
    selectedAgent: string;
    tempUploadedCsv?: TempUploadedCsv | null;
    availableAgents?: any[];
    customScenarios?: Record<string, any>;
    customTestSuites?: Record<string, any>;
  };
  lastAnalysisRawData: any | null;
  completedEvaluations: EvaluationResult[];
}

const initialState: WorkflowState = {
  currentWorkflow: {
    step1: null,
    step2: [],
    step3: [],
    selectedSuites: [],
    selectedAgent: '',
    tempUploadedCsv: null,
    availableAgents: [],

    testSuites: ['Accuracy Suite', 'Robustness Suite'],
  },
  lastAnalysisRawData: null,
  completedEvaluations: [],
};


const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    setStep1Data: (state, action: PayloadAction<WorkflowStep1Data>) => {
      state.currentWorkflow.step1 = action.payload;
    },
    // accept optional File in the temp payload for type safety
    setTempUploadedCsv: (state, action: PayloadAction<TempUploadedCsv | null>) => {
      state.currentWorkflow.tempUploadedCsv = action.payload;
    },
    clearTempUploadedCsv: (state) => {
      state.currentWorkflow.tempUploadedCsv = null;
    },
    setAvailableAgents: (state, action: PayloadAction<any[]>) => {
      state.currentWorkflow.availableAgents = action.payload;
    },
    setStep2Data: (state, action: PayloadAction<any[]>) => {
      state.currentWorkflow.step2 = action.payload;
    },
    addSuiteToStep2: (state, action: PayloadAction<any>) => {
      state.currentWorkflow.step2 = state.currentWorkflow.step2 || [];
      state.currentWorkflow.step2.push(action.payload);
    },
    setStep3Data: (state, action: PayloadAction<any[]>) => {
      state.currentWorkflow.step3 = action.payload;
    },
    setSelectedSuites: (state, action: PayloadAction<string[]>) => {
      state.currentWorkflow.selectedSuites = action.payload;
    },
    setSelectedAgent: (state, action: PayloadAction<string>) => {
      state.currentWorkflow.selectedAgent = action.payload;
    },
    addCompletedEvaluation: (state, action: PayloadAction<EvaluationResult>) => {
      state.completedEvaluations.push(action.payload);
    },
    resetCurrentWorkflow: (state) => {
      // preserve availableAgents if present, but clear tempUploadedCsv explicitly
      const preservedAgents = state.currentWorkflow.availableAgents ?? [];
      const preservedScenarios = state.currentWorkflow.customScenarios ?? {};
      const preservedSuites = state.currentWorkflow.customTestSuites ?? {};
      state.currentWorkflow = {
        step1: null,
        step2: [],
        step3: [],
        selectedSuites: [],
        selectedAgent: '',
        tempUploadedCsv: null,
        availableAgents: preservedAgents,
        customScenarios: preservedScenarios,
        customTestSuites: preservedSuites,
      };
    },
    setCustomScenario: (state, action: PayloadAction<{ key: string; value: any }>) => {
      if (!state.currentWorkflow.customScenarios) {
        state.currentWorkflow.customScenarios = {};
      }
      state.currentWorkflow.customScenarios[action.payload.key] = action.payload.value;
    },
    setCustomTestSuite: (state, action: PayloadAction<{ id: string; data: any }>) => {
      if (!state.currentWorkflow.customTestSuites) {
        state.currentWorkflow.customTestSuites = {};
      }
      state.currentWorkflow.customTestSuites[action.payload.id] = action.payload.data;
    },
    setLastAnalysisRawData: (state, action: PayloadAction<any>) => {
      state.lastAnalysisRawData = action.payload;
    },
  },
});

export const {
  setStep1Data,
  setAvailableAgents,
  setStep2Data,
  setStep3Data,
  setSelectedSuites,
  setSelectedAgent,
  setTempUploadedCsv,
  clearTempUploadedCsv,
  addSuiteToStep2,
  addCompletedEvaluation,
  resetCurrentWorkflow,
  setCustomScenario,
  setCustomTestSuite,
  setLastAnalysisRawData,
} = workflowSlice.actions;

export default workflowSlice.reducer;
