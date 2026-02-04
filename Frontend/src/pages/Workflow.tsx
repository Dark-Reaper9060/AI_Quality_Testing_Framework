import { motion } from 'framer-motion';
import { WorkflowWizard } from '@/components/workflow/WorkflowWizard';

export default function Workflow() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Onboard AI Agent</h1>
        <p className="text-muted-foreground">
          Step-by-step guide to onboard and configure your AI agent
        </p>
      </div>

      <div className="card-elevated p-6">
        <WorkflowWizard />
      </div>
    </motion.div>
  );
}
