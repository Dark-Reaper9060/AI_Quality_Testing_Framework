import { motion } from 'framer-motion';
import { Settings, Database, Server, Cpu, Activity, Save, Plus, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppDispatch, useAppSelector } from '@/store';
import { setAvailableAgents, setSelectedAgent } from '@/store/slices/workflowSlice';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Configuration() {
  const dispatch = useAppDispatch();
  // Safe access to store state with fallback
  const workflowState = useAppSelector((state) => state.workflow?.currentWorkflow) || {};
  const availableAgents = workflowState.availableAgents || [];
  const selectedAgent = workflowState.selectedAgent;

  // Database connection form state
  const [dbHost, setDbHost] = useState('localhost');
  const [dbPort, setDbPort] = useState('5432');
  const [dbName, setDbName] = useState('ai_qtf_production');
  const [dbUsername, setDbUsername] = useState('');
  const [dbPassword, setDbPassword] = useState('');

  // Add Model Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newModel, setNewModel] = useState({
    model_provider: '',
    model_name: '',
    api_version: '',
    api_endpoint: '',
    api_key: '',
    description: ''
  });
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<string | null>(null);

  // Validation
  const isDbFormValid = dbHost.trim() !== '' &&
    dbPort.trim() !== '' &&
    dbName.trim() !== '' &&
    dbUsername.trim() !== '' &&
    dbPassword.trim() !== '';

  const fetchAgents = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8900/agents/');
      if (response.ok) {
        const data = await response.json();
        // Assuming response structure { agents: [...] }
        if (data && Array.isArray(data.agents)) {
          // We map key fields to ensure consistent usage in UI
          const agents = data.agents.map((agent: any) => ({
            id: agent.id,
            // Use model_name for display title
            name: agent.model_name,
            provider: agent.model_provider,
            version: agent.api_version,
            endpoint: agent.api_endpoint,
            key: agent.api_key,
            description: agent.description,
            // Store raw object if needed
            ...agent
          }));
          dispatch(setAvailableAgents(agents));
        }
      }
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    }
  };

  // Fetch agents on mount
  useEffect(() => {
    fetchAgents();
  }, [dispatch]);

  const handleSelectAgent = (agentId: any) => {
    // If id is number in JSON but string in store, cast it
    dispatch(setSelectedAgent(String(agentId)));
  };

  const handleAddModel = async () => {
    setIsAddingModel(true);
    try {
      const response = await fetch('http://127.0.0.1:8900/agents/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newModel),
      });

      if (response.ok) {
        // Refresh list
        await fetchAgents();
        setIsAddModalOpen(false);
        // Reset form
        setNewModel({
          model_provider: '',
          model_name: '',
          api_version: '',
          api_endpoint: '',
          api_key: '',
          description: ''
        });
      } else {
        console.error("Failed to add agent");
        // Optionally handle error feedback here
      }
    } catch (error) {
      console.error("Error adding agent:", error);
    } finally {
      setIsAddingModel(false);
    }
  };

  const confirmDeleteModel = async () => {
    if (!modelToDelete) return;

    try {
      const response = await fetch(`http://127.0.0.1:8900/agents/?id=${modelToDelete}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchAgents();
        if (String(selectedAgent) === String(modelToDelete)) {
          dispatch(setSelectedAgent(null));
        }
        setModelToDelete(null);
      }
    } catch (error) {
      console.error("Failed to delete agent:", error);
    }
  };

  const isModelFormValid =
    newModel.model_provider.trim() !== '' &&
    newModel.model_name.trim() !== '' &&
    newModel.api_version.trim() !== '' &&
    newModel.api_endpoint.trim() !== '' &&
    newModel.api_endpoint.startsWith('https://') &&
    newModel.api_key.trim() !== '' &&
    newModel.description.trim() !== '';

  // Find currently selected agent object
  // Compare strings safely
  const currentAgent = availableAgents?.find(a => String(a.id) === String(selectedAgent));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Agent Configuration</h1>
          <p className="text-muted-foreground">Configure and manage your AI agent settings and connections</p>
        </div>
      </div>

      <Tabs defaultValue="agents" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="agents" className="gap-2">
            <Settings className="h-4 w-4" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="connections" className="gap-2">
            <Database className="h-4 w-4" />
            Connections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-6 mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Model Configuration</CardTitle>
                    <CardDescription>Select and configure the AI model for your project</CardDescription>
                  </div>
                </div>

                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Model
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add New Model</DialogTitle>
                      <DialogDescription>
                        Register a new AI model provider. Click save when you're done.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="model-provider">Provider <span className="text-destructive">*</span></Label>
                          <Input
                            id="model-provider"
                            placeholder="azure_openai"
                            value={newModel.model_provider}
                            onChange={(e) => setNewModel({ ...newModel, model_provider: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="model-name">Model Name <span className="text-destructive">*</span></Label>
                          <Input
                            id="model-name"
                            placeholder="gpt-5-chat"
                            value={newModel.model_name}
                            onChange={(e) => setNewModel({ ...newModel, model_name: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="api-version">Version <span className="text-destructive">*</span></Label>
                          <Input
                            id="api-version"
                            placeholder="2025-01-01-preview"
                            value={newModel.api_version}
                            onChange={(e) => setNewModel({ ...newModel, api_version: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="api-endpoint">Endpoint <span className="text-destructive">*</span></Label>
                          <div className="relative">
                            <Input
                              id="api-endpoint"
                              placeholder="https://"
                              value={newModel.api_endpoint}
                              onChange={(e) => setNewModel({ ...newModel, api_endpoint: e.target.value })}
                              className={newModel.api_endpoint && !newModel.api_endpoint.startsWith('https://') ? 'border-destructive focus-visible:ring-destructive' : ''}
                            />
                            {newModel.api_endpoint && !newModel.api_endpoint.startsWith('https://') && (
                              <p className="text-[10px] text-destructive absolute -bottom-4 left-0">Must start with https://</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="api-key">API Key <span className="text-destructive">*</span></Label>
                        <Input
                          id="api-key"
                          type="password"
                          placeholder="EcWUgCVM..."
                          value={newModel.api_key}
                          onChange={(e) => setNewModel({ ...newModel, api_key: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
                        <Textarea
                          id="description"
                          placeholder="Brief description of the model..."
                          value={newModel.description}
                          onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddModel} disabled={isAddingModel || !isModelFormValid}>
                        {isAddingModel ? 'Adding...' : 'Add Model'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">
                {/* Left Column: Agent List */}
                <div className="col-span-1 border rounded-lg p-2 bg-muted/20 flex flex-col gap-2 h-full">
                  <h3 className="text-sm font-semibold mb-2 px-2 text-muted-foreground">Available Models</h3>
                  <ScrollArea className="flex-1 pr-2">
                    <div className="space-y-2">
                      {availableAgents && availableAgents.map((agent: any) => {
                        const isSelected = String(agent.id) === String(selectedAgent);
                        return (
                          <div
                            key={agent.id}
                            onClick={() => handleSelectAgent(agent.id)}
                            className={cn(
                              "cursor-pointer rounded-md p-3 transition-all hover:bg-accent",
                              isSelected ? "bg-primary/10 border-primary border" : "bg-card border-transparent border"
                            )}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-sm truncate">{agent.name || agent.model_name || "Unknown Agent"}</span>
                              {isSelected && (
                                <div className="flex flex-col items-end gap-2">
                                  <Badge variant="default" className="text-[10px] h-5 px-1 bg-green-600 hover:bg-green-700">Selected</Badge>
                                  <div
                                    role="button"
                                    className="p-1 hover:bg-destructive/10 rounded-full transition-colors group"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setModelToDelete(agent.id);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3 text-muted-foreground group-hover:text-destructive" />
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{agent.provider || agent.model_provider}</div>
                          </div>
                        );
                      })}
                      {(!availableAgents || availableAgents.length === 0) && (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No agents found. Check API connection.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Right Column: Details */}
                <div className="col-span-1 md:col-span-2 border rounded-lg p-6 bg-card h-full flex flex-col">
                  {currentAgent ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex justify-between items-start border-b pb-4">
                        <div>
                          <h2 className="text-2xl font-bold flex items-center gap-2">
                            {currentAgent.name || currentAgent.model_name}
                            <Badge variant="outline">{currentAgent.version || currentAgent.api_version || 'v1.0'}</Badge>
                          </h2>
                          <p className="text-muted-foreground mt-1">{currentAgent.provider || currentAgent.model_provider}</p>
                        </div>
                        <Badge className="bg-green-600">Active Selection</Badge>
                      </div>

                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label className="text-muted-foreground">Description</Label>
                          <p className="text-sm leading-relaxed">{currentAgent.description || "No description provided."}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <Label>API Endpoint</Label>
                            <div className="p-2 bg-muted rounded text-xs font-mono break-all border">
                              {currentAgent.endpoint || currentAgent.api_endpoint || 'N/A'}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Model Provider</Label>
                            <div className="p-2 bg-muted rounded text-sm border">
                              {currentAgent.provider || currentAgent.model_provider || 'N/A'}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mt-2">
                          <Label>API Key</Label>
                          <div className="flex gap-2">
                            <Input
                              type="password"
                              value={currentAgent.key || currentAgent.api_key || "*****************"}
                              disabled
                              className="font-mono text-xs bg-muted/50"
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground">API key is masked for security.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                      <Server className="h-16 w-16 opacity-20" />
                      <div className="text-center">
                        <h3 className="text-lg font-medium">No Model Selected</h3>
                        <p className="text-sm">Select a model from the list to view details.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <AlertDialog open={!!modelToDelete} onOpenChange={(open) => !open && setModelToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the model configuration.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteModel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <TabsContent value="connections" className="space-y-4 mt-6">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Connection
              </CardTitle>
              <CardDescription>
                Configure database connections for test data and evaluation results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Database Type */}
              <div className="space-y-2">
                <Label htmlFor="db-type">Database Type</Label>
                <Select defaultValue="postgresql">
                  <SelectTrigger id="db-type">
                    <SelectValue placeholder="Select database type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    <SelectItem value="mysql">MySQL</SelectItem>
                    <SelectItem value="mongodb">MongoDB</SelectItem>
                    <SelectItem value="mssql">Microsoft SQL Server</SelectItem>
                    <SelectItem value="oracle">Oracle Database</SelectItem>
                    <SelectItem value="redis">Redis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Connection Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="db-host">Host</Label>
                  <Input
                    id="db-host"
                    placeholder="localhost or IP address"
                    value={dbHost}
                    onChange={(e) => setDbHost(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="db-port">Port</Label>
                  <Input
                    id="db-port"
                    type="number"
                    placeholder="5432"
                    value={dbPort}
                    onChange={(e) => setDbPort(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="db-name">Database Name</Label>
                <Input
                  id="db-name"
                  placeholder="ai_qtf_production"
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                />
              </div>

              {/* Authentication */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Authentication</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="db-username">Username</Label>
                    <Input
                      id="db-username"
                      placeholder="database_user"
                      autoComplete="username"
                      value={dbUsername}
                      onChange={(e) => setDbUsername(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="db-password">Password</Label>
                    <Input
                      id="db-password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={dbPassword}
                      onChange={(e) => setDbPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Connection Options */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Connection Options</h4>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="db-pool-min">Min Pool Size</Label>
                    <Input
                      id="db-pool-min"
                      type="number"
                      placeholder="2"
                      defaultValue="2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="db-pool-max">Max Pool Size</Label>
                    <Input
                      id="db-pool-max"
                      type="number"
                      placeholder="10"
                      defaultValue="10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="db-timeout">Connection Timeout (seconds)</Label>
                  <Input
                    id="db-timeout"
                    type="number"
                    placeholder="30"
                    defaultValue="30"
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="ssl-enabled">SSL/TLS Encryption</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable secure connection to database
                    </p>
                  </div>
                  <Switch id="ssl-enabled" defaultChecked />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-reconnect">Auto Reconnect</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically reconnect on connection loss
                    </p>
                  </div>
                  <Switch id="auto-reconnect" defaultChecked />
                </div>
              </div>

              {/* Connection String (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="connection-string">Connection String (Optional)</Label>
                <Input
                  id="connection-string"
                  placeholder="postgresql://user:password@localhost:5432/database"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Override individual fields with a complete connection string
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  className="gap-2"
                  disabled={!isDbFormValid}
                >
                  <Save className="h-4 w-4" />
                  Save Configuration
                </Button>
              </div>

              {/* Connection Status */}
              <div className="rounded-lg border border-muted bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Connection Status:</span>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                    Not Tested
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
