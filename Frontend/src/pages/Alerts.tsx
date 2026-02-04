import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Bell, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import RootCauseAnalysis from '@/components/alerts/RootCauseAnalysis';

const alerts = [
  {
    id: 1,
    type: 'error',
    title: 'Accuracy Threshold Breach',
    message: 'SupplierAgent v1.2 dropped below 85% accuracy threshold',
    time: '2 hours ago',
    isNew: true,
  },
  {
    id: 2,
    type: 'warning',
    title: 'Model Drift Detected',
    message: 'Procurement Agent showing significant performance deviation from baseline',
    time: '5 hours ago',
    isNew: true,
  },
  {
    id: 3,
    type: 'info',
    title: 'Scheduled Evaluation Complete',
    message: 'Weekly evaluation for Downtime Analysis Agent v1.0 completed successfully',
    time: '1 day ago',
    isNew: false,
  },
  {
    id: 4,
    type: 'success',
    title: 'Deployment Approved',
    message: 'SupplierAgent v1.3 passed all thresholds and is ready for production',
    time: '2 days ago',
    isNew: false,
  },
];

interface AlertType {
  id: number;
  type: string;
  title: string;
  message: string;
  time: string;
  isNew: boolean;
}

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'error':
      return AlertCircle;
    case 'warning':
      return AlertTriangle;
    case 'success':
      return CheckCircle2;
    default:
      return Info;
  }
};

const getAlertColors = (type: string) => {
  switch (type) {
    case 'error':
      return 'border-l-error bg-error/5 hover:bg-error/10';
    case 'warning':
      return 'border-l-warning bg-warning/5 hover:bg-warning/10';
    case 'success':
      return 'border-l-success bg-success/5 hover:bg-success/10';
    default:
      return 'border-l-primary bg-primary/5 hover:bg-primary/10';
  }
};

const AlertCard = ({ alert }: { alert: AlertType }) => {
  const Icon = getAlertIcon(alert.type);
  const colors = getAlertColors(alert.type);
  
  return (
    <div 
      className={cn(
        "flex items-start p-4 rounded-lg border-l-4 shadow-sm transition-all hover:shadow-md",
        colors
      )}
    >
      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div className="ml-4 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{alert.title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{alert.time}</span>
            {alert.isNew && (
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                New
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
        <div className="mt-2">
          <Button variant="link" size="sm" className="h-6 p-0 text-xs">
            View details <span className="ml-1">→</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function Alerts() {
  const [selectedAlert, setSelectedAlert] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleAlerts, setVisibleAlerts] = useState(alerts);
  
  const filteredAlerts = visibleAlerts.filter(alert => 
    alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alert.message.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleDismiss = (alertId: number) => {
    setVisibleAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== alertId));
  };

  const handleAlertClick = (id: number) => {
    setSelectedAlert(selectedAlert === id ? null : id);
  };

  if (selectedAlert !== null) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <Button 
          variant="ghost" 
          onClick={() => setSelectedAlert(null)}
          className="mb-4 gap-2"
        >
          <X className="h-4 w-4" />
          Back to Alerts
        </Button>
        <RootCauseAnalysis alertId={selectedAlert.toString()} />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
            <p className="text-muted-foreground">System notifications and metric alerts</p>
          </div>
       
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Alert Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Critical', count: 1, color: 'text-error' },
          { label: 'Warnings', count: 2, color: 'text-warning' },
          { label: 'Info', count: 5, color: 'text-primary' },
          { label: 'Resolved', count: 12, color: 'text-success' },
        ].map((stat) => (
          <div key={stat.label} className="card-metric">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={cn("text-3xl font-bold", stat.color)}>{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Alert Feed */}
      <div className="space-y-4">
        {filteredAlerts.map((alert, index) => {
          const Icon = getAlertIcon(alert.type);
          
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "rounded-lg border-l-4 p-4 transition-all hover:shadow-md",
                getAlertColors(alert.type)
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "rounded-full p-2",
                  alert.type === 'error' && "bg-error/10 text-error",
                  alert.type === 'warning' && "bg-warning/10 text-warning",
                  alert.type === 'success' && "bg-success/10 text-success",
                  alert.type === 'info' && "bg-primary/10 text-primary"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{alert.title}</h4>
                    {alert.isNew && (
                      <Badge className="bg-primary text-primary-foreground text-xs">New</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">{alert.time}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDismiss(alert.id)}
                >
                  Dismiss
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
