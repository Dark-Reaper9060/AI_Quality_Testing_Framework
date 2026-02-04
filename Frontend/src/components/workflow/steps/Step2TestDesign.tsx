import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Trash, Plus, Edit, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { standardTestCases } from '@/lib/mockData';
import { useAppDispatch, useAppSelector } from '@/store';
import { useToast } from '@/components/ui/use-toast';
import { setSelectedSuites, setStep2Data, setStep1Data, setTempUploadedCsv, clearTempUploadedCsv, setCustomTestSuite, addSuiteToStep2 } from '@/store/slices/workflowSlice';

interface Step2Props {
  onNext: () => void;
  onBack: () => void;
  onValidationChange?: (isValid: boolean) => void;
  saveStepRef?: any;
}

export function Step2TestDesign({ onNext, onBack, onValidationChange, saveStepRef }: Step2Props) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSuite, setEditingSuite] = useState<any>(null);
  const [showOverviewInfo, setShowOverviewInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[]>([]);
  const [selectedCsvName, setSelectedCsvName] = useState<string>('');
  // keep the raw File so we can send it as multipart when running evaluations
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [newSuite, setNewSuite] = useState({
    name: '',
    jiraLink: '',
    dimensions: [] as string[],
    selectedTestCases: [] as string[],
    expectedCriteria: '',
  });
  const [suites, setSuites] = useState<any[]>([]);
  const [selectedSuiteIds, setSelectedSuiteIds] = useState<string[]>([]);
  const selectedAgentId = useAppSelector((state: any) => state.workflow?.currentWorkflow?.selectedAgent);
  const step1State = useAppSelector((state: any) => state.workflow?.currentWorkflow?.step1);

  const latestSuitesRef = useRef<any[]>(suites);
  useEffect(() => { latestSuitesRef.current = suites; }, [suites]);
  const latestSelectedIdsRef = useRef<string[]>(selectedSuiteIds);
  useEffect(() => { latestSelectedIdsRef.current = selectedSuiteIds; }, [selectedSuiteIds]);
  const latestStep1Ref = useRef<any>(step1State);
  useEffect(() => { latestStep1Ref.current = step1State; }, [step1State]);

  // Fetch suites from new API: http://127.0.0.1:8900/test-suits/
  const fetchSuitesFromBackend = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8900/test-suits/');
      if (!res.ok) {
        const text = await res.text().catch(() => 'Server error');
        console.warn('Failed to fetch suites:', text);
        toast({ title: 'Fetch Suites', description: `Server responded: ${text}` });
        return;
      }
      const data = await res.json().catch(() => null);

      if (!data || !Array.isArray(data.test_suits)) {
        console.debug('Unexpected suites response shape:', data);
        toast({ title: 'Fetch Suites', description: 'Unexpected response shape from server' });
        return;
      }

      const mapped = data.test_suits.map((s: any) => {
        // Map API fields to local state
        const dims = Array.isArray(s.test_dimensions) ? s.test_dimensions : [];
        const testCases = Array.isArray(s.selected_test_cases) ? s.selected_test_cases : [];

        return {
          id: String(s.id),
          name: s.name,
          // Map description to expectedCriteria as requested
          expectedCriteria: s.description || '',
          jiraLink: s.jira_link || '',
          type: s.type || 'Automated',
          dimension: dims.join(', '),
          dimensions: dims,
          // Count derived from selected_test_cases length
          testCount: testCases.length,
          status: 'inProgress', // Default status as it's not in API response shown
          selectedTestCases: testCases,
        };
      });

      setSuites(mapped);

      // Update Redux Step 2 data with the fetched suites if needed for persistence
      // We might want to merge or overwrite depending on "source of truth".
      // Since user said "get value from API", we prioritize API.
      // However, if we want to carry data, maybe we should sync Redux.
      // But Step1Mount logic loads from Redux... if we update from API, we should update Redux too to keep them in sync.
      if (mapped.length > 0) {
        dispatch(setStep2Data(mapped.map((s: any) => ({
          ...s,
          // Add any other props needed for Step2 payload if strictly required
        }))));
      }

    } catch (err) {
      console.error('Error fetching suites', err);
      toast({ title: 'Fetch Error', description: 'Unable to fetch test suites from backend', variant: 'destructive' });
    }
  };

  const currentWorkflow = useAppSelector((state: any) => state.workflow?.currentWorkflow);

  // Initialize suites from Redux customTestSuites on mount, OR fetch from API.
  // Since we have a real API now, we should fetch from it on mount.
  useEffect(() => {
    fetchSuitesFromBackend();
  }, []);

  const handleCSVUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = String((ev.target as FileReader).result || '');
        const rows = text.split(/\r?\n/).map((r) => r.trim()).filter(Boolean);
        const parsed = rows
          .map((row) => row.trim())
          .filter(Boolean);

        setCsvPreview(parsed);

        // store uploaded csv in global workflow temp storage so it can be
        // included later in the assembled payload (or uploaded separately)
        try { dispatch(setTempUploadedCsv({ name: file.name || 'imported.csv', rows: parsed, file } as any)); } catch (e) { }

        if (parsed.length === 0) {
          toast({ title: 'CSV Upload', description: 'No valid rows found in CSV', variant: 'destructive' });
          return;
        }

        setNewSuite((prev) => ({ ...prev, selectedTestCases: Array.from(new Set([...(prev.selectedTestCases || []), ...parsed])) }));

        toast({ title: 'CSV Uploaded', description: `Added ${parsed.length} test case(s)`, duration: 4000 });
      } catch (err) {
        console.error('CSV parse error', err);
        toast({ title: 'CSV Error', description: 'Failed to parse CSV file', variant: 'destructive' });
      }
    };
    reader.onerror = (e) => {
      console.error('File read error', e);
      toast({ title: 'File Error', description: 'Unable to read file', variant: 'destructive' });
    };
    reader.readAsText(file);
  };

  const handleEditSuite = (suite: any) => {
    setEditingSuite(suite);
    setNewSuite({
      name: suite.name || '',
      jiraLink: suite.jiraLink || '',
      dimensions: Array.isArray(suite.dimensions) ? suite.dimensions : (typeof suite.dimension === 'string' ? suite.dimension.split(',').map((x: string) => x.trim()) : []),
      selectedTestCases: Array.isArray(suite.selectedTestCases) ? suite.selectedTestCases : [],
      // Ensure expectedCriteria is populated (mapped from description in fetch)
      expectedCriteria: suite.expectedCriteria || '',
    });
    setIsDialogOpen(true);
  };

  const handleSaveSuite = async () => {
    const selectedCount = newSuite.selectedTestCases.length;
    const isEditing = editingSuite !== null;
    const suiteObj: any = {
      id: isEditing ? editingSuite.id : String(Date.now()),
      name: newSuite.name || 'Untitled Suite',
      jiraLink: newSuite.jiraLink || '',
      type: 'Automated',
      dimension: newSuite.dimensions.join(', '),
      dimensions: newSuite.dimensions,
      testCount: selectedCount,
      status: 'inProgress',
      selectedTestCases: newSuite.selectedTestCases.slice(),
      expectedCriteria: newSuite.expectedCriteria,
    };

    let updated: any[];
    if (isEditing) {
      updated = suites.map(s => s.id === editingSuite.id ? suiteObj : s);
    } else {
      updated = [...suites, suiteObj];
    }
    setSuites(updated);

    // Save to Redux (Custom Test Suites Dictionary)
    try {
      dispatch(setCustomTestSuite({ key: suiteObj.id, value: suiteObj }));
      dispatch(addSuiteToStep2(suiteObj));

      toast({ title: 'Saved', description: 'Test suite saved locally. (Backend Create API not specified for port 8900 yet)' });
      // NOTE: User only specified List (GET) and Delete (DELETE) APIs on 8900.
      // We assume Create/Update is still local or user hasn't provided the 8900 Create endpoint yet.
      // Keeping it local as per previous instruction to disable 8000.
    } catch (e) {
      console.error("Failed to save to Redux", e);
    }


    // Track whether we persisted the uploaded CSV into the global store
    let persistedCsvOnSave = false;

    // Persist CSV if present
    try {
      if (csvFile instanceof File) {
        dispatch(setTempUploadedCsv({ name: selectedCsvName || csvFile.name || 'imported.csv', rows: suiteObj.selectedTestCases.slice(), file: csvFile } as any));
        persistedCsvOnSave = true;
        toast({ title: 'CSV Stored', description: 'Uploaded CSV stored for evaluation.' });
      }
    } catch (e) {
      console.debug('Failed to persist CSV file into store on save', e);
    }

    // Local cleanup
    setNewSuite({ name: '', jiraLink: '', dimensions: [], selectedTestCases: [], expectedCriteria: '' });
    setEditingSuite(null);
    setIsDialogOpen(false);
    setSelectedCsvName('');
    if (!persistedCsvOnSave) {
      setCsvFile(null);
      try { dispatch(clearTempUploadedCsv()); } catch (e) { }
    }
  };

  useEffect(() => {
    // Intentionally empty or use fetchSuitesFromBackend() if we want auto-refresh on focus, etc.
    // But we call it on mount above.
  }, []);

  useEffect(() => {
    const emptyWorkflow = !currentWorkflow || (typeof currentWorkflow === 'object' && Object.keys(currentWorkflow).length === 0);
    if (emptyWorkflow) {
      setSelectedSuiteIds([]);
    }
  }, [currentWorkflow]);

  const buildStep2Payload = (suitesList: any[]) => {
    return suitesList.map((s) => ({
      id: s.id,
      name: s.name,
      jiraLink: s.jiraLink || '',
      dimensions: Array.isArray(s.dimensions)
        ? s.dimensions
        : (typeof s.dimension === 'string' ? s.dimension.split(',').map((x: string) => x.trim()) : []),
      selectedTestCases: Array.isArray(s.selectedTestCases)
        ? s.selectedTestCases.slice()
        : Array.isArray(s.testCases)
          ? s.testCases.filter((t: any) => t.selected).map((t: any) => t.input)
          : [],
      expectedCriteria: s.expectedCriteria || '',
      type: s.type || 'Automated',
      status: s.status || 'inProgress',
      testCount: (Array.isArray(s.selectedTestCases) ? s.selectedTestCases.length : (s.testCount || 0)),
    }));
  };

  // Helper to persist step2 payload, selected suite names, and derived dimension flags
  const persistSelectionAndDimensions = (simplifiedPayload: any[]) => {
    try {
      dispatch(setStep2Data(simplifiedPayload));
      const selectedNames = simplifiedPayload.map((s: any) => s.name || s.id);
      dispatch(setSelectedSuites(selectedNames));

      // derive dimensions flags from simplifiedPayload
      const dimsSet = new Set<string>();
      simplifiedPayload.forEach((s: any) => {
        const ds: string[] = Array.isArray(s.dimensions) ? s.dimensions : (typeof s.dimension === 'string' ? s.dimension.split(',').map((d: string) => d.trim()) : []);
        ds.forEach((d) => { if (d) dimsSet.add(d); });
      });

      const derived = {
        accuracy: Array.from(dimsSet).some(d => d.toLowerCase() === 'accuracy'),
        robustness: Array.from(dimsSet).some(d => d.toLowerCase() === 'robustness'),
        bias: Array.from(dimsSet).some(d => d.toLowerCase() === 'bias'),
        resilience: Array.from(dimsSet).some(d => d.toLowerCase() === 'resilience'),
        latency: Array.from(dimsSet).some(d => d.toLowerCase() === 'latency'),
      };

      // merge with existing step1 values to avoid overwriting other fields
      const baseStep1 = step1State ?? {
        scenarioName: '',
        description: '',
        tags: [],
        agentName: '',
        modelType: '',
        endpoint: '',
        dimensions: { accuracy: false, robustness: false, bias: false, resilience: false },
      };

      const toSave = {
        ...baseStep1,
        dimensions: {
          accuracy: derived.accuracy || Boolean(baseStep1.dimensions?.accuracy),
          robustness: derived.robustness || Boolean(baseStep1.dimensions?.robustness),
          bias: derived.bias || Boolean(baseStep1.dimensions?.bias),
          resilience: derived.resilience || Boolean(baseStep1.dimensions?.resilience),
          // store latency in the dimensions object too (slice type will accept additional keys)
          ...(baseStep1.dimensions ?? {}),
          latency: derived.latency || Boolean((baseStep1 as any).dimensions?.latency),
        },
      };

      // Ensure we include latency key, even if baseStep1.dimensions didn't have it
      try { dispatch(setStep1Data(toSave)); } catch (e) { }
    } catch (e) {
      // ignore
    }
  };

  const isValid = selectedSuiteIds.length > 0;

  // Only notify parent when the boolean actually changes to avoid triggering
  // parent effects on every render (which can cause update loops).
  const lastIsValidRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (lastIsValidRef.current === isValid) return;
    lastIsValidRef.current = isValid;
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  // Initialize selection once when suites are first loaded. Only restore from
  // persisted selection in the store; do NOT auto-select all suites by default.
  const lastInitIdsRef = useRef<string[] | null>(null);
  const lastInitPayloadRef = useRef<any[] | null>(null);
  const initDoneRef = useRef(false);
  useEffect(() => {
    if (suites.length === 0) return;
    // Only run this initialization logic once to avoid clobbering user
    // selections when suites list refreshes after network calls or saves.
    if (initDoneRef.current) return;

    // By default we do NOT restore a previous selection so that the table
    // checkboxes are unchecked on first view. If you want to enable restoring
    // past selections, set `currentWorkflow.restoreSuiteSelection = true` in
    // the persisted workflow state (or change this condition).
    const saved = currentWorkflow?.selectedSuites ?? [];
    if (Array.isArray(saved) && saved.length > 0 && currentWorkflow?.restoreSuiteSelection) {
      const ids = suites
        .filter((s) => saved.includes(s.name) || saved.includes(s.id))
        .map((s) => s.id);

      const sameIds = lastInitIdsRef.current && ids.length === lastInitIdsRef.current.length && ids.every((v, i) => v === lastInitIdsRef.current![i]);
      if (!sameIds) {
        setSelectedSuiteIds(ids);
      }

      try {
        const selected = suites.filter((s) => ids.includes(s.id));
        const simplified = buildStep2Payload(selected);
        const samePayload = lastInitPayloadRef.current && JSON.stringify(lastInitPayloadRef.current) === JSON.stringify(simplified);
        if (!samePayload) {
          persistSelectionAndDimensions(simplified);
          lastInitIdsRef.current = ids;
          lastInitPayloadRef.current = simplified;
        }
      } catch (e) { }
    } else {
      // Leave selections alone when there is no saved selection. Do NOT
      // call setSelectedSuiteIds here because that would overwrite any
      // user-driven selections after the component has mounted.
      // The initial state of selectedSuiteIds is already empty, so nothing
      // needs to be done.
    }
    initDoneRef.current = true;
    // If there is no saved selection, leave selectedSuiteIds empty so user can choose.
  }, [suites, currentWorkflow]);

  const toggleSuiteSelection = (id: string, name?: string, checked?: boolean) => {
    const next = new Set(selectedSuiteIds);
    if (checked === undefined) {
      if (next.has(id)) next.delete(id); else next.add(id);
    } else {
      if (checked) next.add(id); else next.delete(id);
    }
    const nextIds = Array.from(next);
    setSelectedSuiteIds(nextIds);
    try {
      const selected = suites.filter((s) => nextIds.includes(s.id));
      const simplified = buildStep2Payload(selected);
      persistSelectionAndDimensions(simplified);
    } catch (e) { }
  };

  // Delete a suite using updated API: http://127.0.0.1:8900/test-suit/delete/{id}
  const handleDeleteSuite = async (id: string, name?: string) => {
    if (!confirm(`Delete test suite "${name || id}"? This action cannot be undone.`)) return;
    const prev = suites.slice();
    // optimistic remove from UI
    const updatedSuites = prev.filter((s) => s.id !== id);
    setSuites(updatedSuites);

    // If it was selected, remove and persist new selection
    const wasSelected = latestSelectedIdsRef.current.includes(id);
    if (wasSelected) {
      const newSelected = latestSelectedIdsRef.current.filter((x) => x !== id);
      setSelectedSuiteIds(newSelected);
      try {
        const selected = prev.filter((s) => newSelected.includes(s.id));
        const simplified = buildStep2Payload(selected);
        persistSelectionAndDimensions(simplified);
      } catch (e) { }
    }

    try {
      const deleteUrl = `http://127.0.0.1:8900/test-suit/delete/${id}`;
      const res = await fetch(deleteUrl, { method: 'DELETE' });

      if (!res.ok) {
        const text = await res.text().catch(() => 'Server error');
        toast({ title: 'Delete failed', description: `Server responded: ${text}`, variant: 'destructive' });
        // rollback
        setSuites(prev);
        return;
      }

      toast({ title: 'Deleted', description: `${name || 'Suite'} removed.` });

      // Refresh list
      await fetchSuitesFromBackend();
    } catch (err) {
      console.error('Delete error', err);
      toast({ title: 'Network Error', description: 'Unable to delete suite from backend. Changes reverted.', variant: 'destructive' });
      setSuites(prev);
    }
  };

  useEffect(() => {
    if (!saveStepRef) return;
    saveStepRef.current = () => {
      const selected = suites.filter((s) => selectedSuiteIds.includes(s.id));
      const simplified = buildStep2Payload(selected);
      try {
        persistSelectionAndDimensions(simplified);
      } catch (e) { }
      const step1Snapshot = latestStep1Ref.current ?? null;
      // include csvFile reference in the snapshot so Step4 can access raw file
      return { step1: step1Snapshot, step2: simplified, tempUploadedCsvFile: csvFile };
    };
    return () => { if (saveStepRef) saveStepRef.current = null; };
  }, [saveStepRef, suites, selectedSuiteIds, dispatch, csvFile]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between w-full">
        <div>
          <h2 className="text-2xl font-bold">Test Design</h2>
          <p className="text-muted-foreground">Create and manage test suites for your AI agent</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowOverviewInfo(true)} className="gap-2">
            <Info className="h-4 w-4" />
            About Test Suites
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingSuite(null); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Test Suite
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl w-full">
              <DialogHeader>
                <DialogTitle className="text-2xl">{editingSuite ? 'Edit Test Suite' : 'Create Test Suite'}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-6 py-4 max-h-[80vh] overflow-auto">
                {/* Centered single-column form container */}
                <div className="w-full max-w-3xl space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="suite-name">Suite Name</Label>
                    <Input
                      id="suite-name"
                      value={newSuite?.name ?? ''}
                      onChange={(e) => setNewSuite({ ...(newSuite ?? { name: '', jiraLink: '', dimensions: [], selectedTestCases: [], expectedCriteria: '' }), name: e.target.value })}
                      placeholder="Suite Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jira-link">JIRA Link</Label>
                    <Input
                      id="jira-link"
                      value={newSuite?.jiraLink ?? ''}
                      onChange={(e) => setNewSuite({ ...(newSuite ?? { name: '', jiraLink: '', dimensions: [], selectedTestCases: [], expectedCriteria: '' }), jiraLink: e.target.value })}
                      placeholder="https://jira.company.com/browse/PROJ-123"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Dimensions (select one or more)</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Accuracy', 'Robustness', 'Bias', 'Resilience', 'Latency'].map((d) => {
                        const checked = (newSuite?.dimensions ?? []).includes(d);
                        return (
                          <label key={d} className="inline-flex items-center gap-2 rounded-lg border p-2 px-3">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(val) => {
                                const current = newSuite ?? { name: '', jiraLink: '', dimensions: [], selectedTestCases: [], expectedCriteria: '' };
                                if (val) {
                                  setNewSuite({ ...current, dimensions: Array.from(new Set([...(current.dimensions || []), d])) });
                                } else {
                                  setNewSuite({ ...current, dimensions: (current.dimensions || []).filter((x) => x !== d) });
                                }
                              }}
                            />
                            <span className="text-sm">{d}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Upload CSV Test Cases</Label>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                          Upload CSV
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setNewSuite(prev => ({ ...prev, selectedTestCases: [] }))}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          Clear All Test Cases
                        </Button>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setSelectedCsvName(f.name);
                            setCsvFile(f);
                            handleCSVUpload(f);
                          }
                          // reset input so same file can be re-selected if needed
                          (e.target as HTMLInputElement).value = '';
                        }}
                      />

                      {selectedCsvName && (
                        <div className="text-sm text-muted-foreground mt-2 text-center">Selected file: {selectedCsvName}</div>
                      )}

                      {(csvPreview ?? []).length > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">CSV Preview ({(csvPreview ?? []).length})</div>
                            <Button variant="ghost" size="sm" onClick={() => { setCsvPreview([]); setCsvFile(null); try { dispatch(clearTempUploadedCsv()); } catch (e) { } }}>Clear</Button>
                          </div>
                          <div className="mt-2 max-h-40 overflow-auto rounded-md border p-2 bg-muted/5">
                            <ul className="list-disc pl-5 text-sm space-y-1">
                              {(csvPreview ?? []).map((r, i) => (
                                <li key={i} className="truncate">{r}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground text-center">Imported rows are merged into the Selected Test Cases automatically.</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="criteria">Expected Criteria / Rule</Label>
                    <Textarea
                      id="criteria"
                      value={newSuite?.expectedCriteria ?? ''}
                      onChange={(e) => setNewSuite({ ...(newSuite ?? { name: '', jiraLink: '', dimensions: [], selectedTestCases: [], expectedCriteria: '' }), expectedCriteria: e.target.value })}
                      placeholder="Describe the expected outcome or rule for this suite (use multiple lines for detailed rules)."
                      className="min-h-[120px] text-sm"
                    />
                    <div className="text-xs text-muted-foreground">Tip: provide clear pass/fail criteria, examples, or scoring rules to improve evaluation accuracy.</div>
                  </div>

                  <div className="pt-2">
                    <Button className="w-full" onClick={handleSaveSuite}>
                      {editingSuite ? 'Update Test Suite' : 'Save Test Suite'}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overview Information Modal */}
      {showOverviewInfo && (
        <Dialog open={showOverviewInfo} onOpenChange={setShowOverviewInfo}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Test Suite Overview</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto">
              <div>
                <h3 className="text-lg font-semibold mb-2">What are Test Suites?</h3>
                <p className="text-muted-foreground">
                  Test Suites are organized collections of test cases designed to evaluate your AI agent's performance across multiple dimensions. Each suite focuses on specific quality aspects like accuracy, robustness, bias, resilience, and latency.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Key Features</h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">1</div>
                    <div>
                      <h4 className="font-medium">Multi-Dimensional Testing</h4>
                      <p className="text-sm text-muted-foreground">Evaluate AI agents across Accuracy, Robustness, Bias, Resilience, and Latency dimensions simultaneously.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">2</div>
                    <div>
                      <h4 className="font-medium">CSV Import Support</h4>
                      <p className="text-sm text-muted-foreground">Bulk import test cases from CSV files to quickly build comprehensive test suites with hundreds of test cases.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">3</div>
                    <div>
                      <h4 className="font-medium">JIRA Integration</h4>
                      <p className="text-sm text-muted-foreground">Link test suites to JIRA tickets for seamless project management and traceability.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">4</div>
                    <div>
                      <h4 className="font-medium">Expected Criteria Definition</h4>
                      <p className="text-sm text-muted-foreground">Define clear pass/fail criteria and expected outcomes to ensure consistent evaluation.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">5</div>
                    <div>
                      <h4 className="font-medium">Reusable & Editable</h4>
                      <p className="text-sm text-muted-foreground">Create once, use multiple times. Edit existing suites to adapt to changing requirements.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Benefits for Testing Framework</h3>
                <div className="grid gap-3">
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <h4 className="font-medium text-green-700 dark:text-green-400 mb-1">Comprehensive Coverage</h4>
                    <p className="text-sm text-muted-foreground">Test multiple quality dimensions in a single workflow, ensuring no aspect of AI performance is overlooked.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-1">Scalability</h4>
                    <p className="text-sm text-muted-foreground">Handle thousands of test cases efficiently with bulk import and automated execution capabilities.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <h4 className="font-medium text-purple-700 dark:text-purple-400 mb-1">Consistency</h4>
                    <p className="text-sm text-muted-foreground">Standardized test suites ensure consistent evaluation across different AI agents and versions.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <h4 className="font-medium text-orange-700 dark:text-orange-400 mb-1">Traceability</h4>
                    <p className="text-sm text-muted-foreground">JIRA integration and detailed reporting provide full audit trails for compliance and debugging.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                    <h4 className="font-medium text-pink-700 dark:text-pink-400 mb-1">Efficiency</h4>
                    <p className="text-sm text-muted-foreground">Reuse test suites across multiple agents and workflows, reducing setup time and maintenance effort.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground italic">
                  💡 Tip: Start with a small test suite to validate your setup, then scale up by importing larger CSV files or creating additional suites for different scenarios.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsContent value="overview" className="space-y-4">
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-6">
                    <Checkbox
                      checked={selectedSuiteIds.length > 0 && selectedSuiteIds.length === suites.length}
                      onCheckedChange={(val) => {
                        const checked = Boolean(val);
                        if (checked) {
                          const ids = suites.map((s) => s.id);
                          setSelectedSuiteIds(ids);
                          try {
                            const selected = suites.slice();
                            const simplified = buildStep2Payload(selected);
                            persistSelectionAndDimensions(simplified);
                          } catch (e) { }
                        } else {
                          setSelectedSuiteIds([]);
                          try { dispatch(setStep2Data([])); dispatch(setSelectedSuites([])); } catch (e) { }
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dimension</TableHead>
                  <TableHead className="text-center">#Test Cases</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suites.map((suite: any) => (
                  <TableRow key={suite.id} className="hover:bg-muted/30">
                    <TableCell className="w-6">
                      <Checkbox
                        checked={selectedSuiteIds.includes(suite.id)}
                        onCheckedChange={(val) => toggleSuiteSelection(suite.id, suite.name, Boolean(val))}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{suite.name}</TableCell>
                    <TableCell>{suite.type}</TableCell>
                    <TableCell>
                      {
                        (() => {
                          const dims = Array.isArray(suite.dimensions)
                            ? suite.dimensions
                            : (typeof suite.dimension === 'string'
                              ? suite.dimension.split(',').map((d: string) => d.trim()).filter(Boolean)
                              : []);
                          const has = (name: string) => dims.some((d: string) => String(d).toLowerCase() === name.toLowerCase());
                          const cls = has('Accuracy')
                            ? 'bg-accuracy/10 text-accuracy'
                            : has('Robustness')
                              ? 'bg-robustness/10 text-robustness'
                              : has('Bias')
                                ? 'bg-bias/10 text-bias'
                                : has('Latency')
                                  ? 'bg-latency/10 text-latency'
                                  : 'bg-resilience/10 text-resilience';
                          return (
                            <Badge variant="secondary" className={cls}>
                              {dims.length > 0 ? dims.join(', ') : String(suite.dimension || '')}
                            </Badge>
                          );
                        })()
                      }
                    </TableCell>
                    <TableCell className="text-center">{suite.testCount}</TableCell>
                    <TableCell>
                      <Badge className="badge-success">{suite.status}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEditSuite(suite)} aria-label={`Edit ${suite.name}`}>
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteSuite(suite.id, suite.name)} aria-label={`Delete ${suite.name}`}>
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
