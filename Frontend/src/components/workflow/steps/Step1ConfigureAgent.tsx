import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
// ...Checkbox removed, dimensions are selected elsewhere
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockAgents } from '@/lib/mockData';
import { useAppDispatch, useAppSelector } from '@/store';
import { setStep1Data, setAvailableAgents, setSelectedAgent } from '@/store/slices/workflowSlice';

interface Step1Props {
  onNext: () => void;
  onBack: () => void;
  onValidationChange?: (isValid: boolean) => void;
  saveStepRef?: any;
}

export function Step1ConfigureAgent({ onNext, onBack, onValidationChange, saveStepRef }: Step1Props) {
  const dispatch = useAppDispatch();
  const availableAgents = useAppSelector((s: any) => s.workflow?.currentWorkflow?.availableAgents ?? []);
  const savedStep = useAppSelector((s) => s.workflow.currentWorkflow.step1);
  const [scenarioName, setScenarioName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>(['Safety', 'SOP']);
  const [tagInput, setTagInput] = useState('');
  const [agentName, setAgentName] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [modelType, setModelType] = useState('');
  const [endpoint, setEndpoint] = useState('');
  // dimensions removed from this step; will be handled elsewhere
  const [touched, setTouched] = useState({
    scenarioName: false,
    agentName: false,
    modelType: false,
  });

  const errors = {
    scenarioName: !scenarioName.trim() && touched.scenarioName,
    agentName: !agentName.trim() && touched.agentName,
    modelType: !modelType && touched.modelType,
  };

  const isValid =
    scenarioName.trim() !== '' &&
    agentName.trim() !== '' &&
    modelType !== '';

  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  // Initialize from store if user returned to this step
  useEffect(() => {
    if (savedStep) {
      setScenarioName(savedStep.scenarioName || '');
      setDescription(savedStep.description || '');
      setTags(savedStep.tags || []);
      // preserve agent display name; actual agent id will be set when
      // availableAgents are loaded (below) so we don't overwrite user input
      setAgentName(savedStep.agentName || '');
      setModelType(savedStep.modelType || '');
      setEndpoint(savedStep.endpoint || '');
    }
  }, [savedStep]);

  // When availableAgents load, if we have a saved agent display name try
  // to resolve it to an id and preselect it. Do NOT overwrite if user
  // already selected an agent in this session.
  useEffect(() => {
    if (!availableAgents || availableAgents.length === 0) return;
    if (selectedAgentId) return; // user already selected
    const savedName = savedStep?.agentName;
    if (savedName) {
      const match = availableAgents.find((a: any) => {
        const label = `${a.name}${a.version ? ` v${a.version}` : ''}`.trim();
        return label === savedName || a.name === savedName || String(a.name).toLowerCase() === String(savedName).toLowerCase();
      });
      if (match) {
        setSelectedAgentId(String(match.id ?? match.name));
        setAgentName(`${match.name}${match.version ? ` v${match.version}` : ''}`);
        try { dispatch(setSelectedAgent(String(match.id ?? match.name))); } catch (e) { }
      }
    }
  }, [availableAgents, savedStep, selectedAgentId, dispatch]);

  // Fetch agent list from backend on mount and persist to store
  useEffect(() => {
    let mounted = true;
    const fetchAgents = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8448/testing/agentlist');
        if (!res.ok) return;
        const data = await res.json().catch(() => null);

        // Handle specific response format: { agents: [...] }
        let rawList: any[] = [];
        if (Array.isArray(data?.agents)) rawList = data.agents;
        else if (Array.isArray(data)) rawList = data;
        else if (Array.isArray(data?.response)) rawList = data.response;
        else rawList = (data?.results || data?.data || []);

        // normalize to { id, name, version, url }
        const list = rawList.map((it: any) => ({
          // Use name as ID if id is missing, which seems to be the case in the new API
          id: String(it.id ?? it.name ?? ''),
          name: String(it.name ?? ''),
          // Default to 1.0 if version is missing
          version: String(it.version ?? it.model_version ?? '1.0'),
          url: String(it.endpoint ?? it.model_url ?? it.url ?? ''),
          description: String(it.description ?? ''),
          raw: it,
        }));
        if (!mounted) return;
        dispatch(setAvailableAgents(list));
      } catch (e) {
        // ignore fetch failures — non-blocking
      }
    };
    fetchAgents();
    return () => { mounted = false; };
  }, [dispatch]);

  // Sync local form to global store whenever values change
  useEffect(() => {
    dispatch(setStep1Data({
      scenarioName,
      description,
      tags,
      agentName,
      modelType,
      endpoint, // Persist endpoint
    }));
  }, [scenarioName, description, tags, agentName, modelType, endpoint, dispatch]);

  // Expose a synchronous save handler to parent via saveStepRef so WorkflowWizard can
  // snapshot step1 immediately when advancing without waiting for effects.
  useEffect(() => {
    if (!saveStepRef) return;
    saveStepRef.current = () => {
      const snapshot = {
        scenarioName,
        description,
        tags,
        agentName,
        modelType,
        endpoint,
        dimensions: {
          accuracy: false,
          robustness: false,
          bias: false,
          resilience: false,
        },
      };
      try {
        dispatch(setStep1Data(snapshot));
        // also persist available agents in case parent wants to access them
        try { dispatch(setAvailableAgents(availableAgents)); } catch (e) { }
        // persist selected agent id as well
        try { dispatch(setSelectedAgent(selectedAgentId)); } catch (e) { }
      } catch (e) { }
      return { step1: snapshot };
    };
    return () => { if (saveStepRef) saveStepRef.current = null; };
  }, [saveStepRef, scenarioName, description, tags, agentName, modelType, endpoint, dispatch, availableAgents, selectedAgentId]);

  const addTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // handleDimensionChange removed with dimensions

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-2xl font-bold">Agent Details</h2>
        <p className="text-muted-foreground">Configure your AI agent details</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Scenario Definition */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b border-border pb-2">Scenario Definition</h3>

          <div className="space-y-2">
            <Label htmlFor="scenario-name" className="flex items-center gap-1">
              Scenario Name <span className="text-error">*</span>
            </Label>
            <Input
              id="scenario-name"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              onBlur={() => handleBlur('scenarioName')}
              placeholder="Scenario Name..."
              className={cn(errors.scenarioName && "border-error focus-visible:ring-error")}
            />
            {errors.scenarioName && (
              <p className="text-sm text-error flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Scenario name is required
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What the agent is supposed to do to help, I am anticipating..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag..."
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
            </div>
          </div>
        </div>

        {/* Agent Registration */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b border-border pb-2">Agent Registration</h3>

          <div className="space-y-2">
            <Label htmlFor="agent-name" className="flex items-center gap-1">
              Agent Name & Version <span className="text-error">*</span>
            </Label>
            <Select value={selectedAgentId} onValueChange={(v) => {
              // v is agent id or name fallback
              setSelectedAgentId(v);
              handleBlur('agentName');
              const match = (availableAgents || []).find((a: any) => String(a.id) === String(v) || String(a.name) === String(v));
              if (match) {
                const label = `${match.name} v${match.version || match.version_str || ''}`.trim();
                setAgentName(label);
                setEndpoint(match.url || ''); // Set endpoint from agent URL
                try { dispatch(setSelectedAgent(String(match.id ?? match.name))); } catch (e) { }
              } else {
                // fallback: treat v as display label
                setAgentName(String(v));
                setEndpoint(''); // Reset endpoint if manual entry/fallback
                try { dispatch(setSelectedAgent(String(v))); } catch (e) { }
              }
            }}>
              <SelectTrigger id="agent-name" className={cn(errors.agentName && "border-error focus-visible:ring-error")}>
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent>
                {availableAgents.length > 0 ? (
                  availableAgents.map((a: any) => (
                    <SelectItem key={a.id || a.name} value={String(a.id)}>
                      {a.name}
                    </SelectItem>
                  ))
                ) : (
                  mockAgents.map((a) => (
                    <SelectItem key={a.id} value={`${a.name} v${a.version}`}>
                      {a.name} v{a.version}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.agentName && (
              <p className="text-sm text-error flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Agent name is required
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-type" className="flex items-center gap-1">
              Model Type <span className="text-error">*</span>
            </Label>
            <Select value={modelType} onValueChange={(v) => { setModelType(v); handleBlur('modelType'); }}>
              <SelectTrigger id="model-type" className={cn(errors.modelType && "border-error focus-visible:ring-error")}>
                <SelectValue placeholder="Select model type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai-gpt4o">OpenAI GPT-4o</SelectItem>
                <SelectItem value="local-llm">Local LLM</SelectItem>
                <SelectItem value="custom-api">Custom API</SelectItem>
              </SelectContent>
            </Select>
            {errors.modelType && (
              <p className="text-sm text-error flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Model type is required
              </p>
            )}
          </div>

          {/* Endpoint input removed — agent endpoint will be taken from the selected agent in the store when backend is available */}
        </div>
      </div>

      {/* Target Quality Dimensions removed per request. Dimensions will be selected elsewhere when needed. */}
    </motion.div>
  );
}
