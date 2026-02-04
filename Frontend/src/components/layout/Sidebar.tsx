import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  GitBranch, 
  Settings, 
  BarChart3, 
  Bell,
  Workflow,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/workflow', icon: GitBranch, labelKey: 'nav.workflow' },
  { to: '/workflow-builder', icon: Workflow, labelKey: 'nav.workflowBuilder' },
  { to: '/configuration', icon: Settings, labelKey: 'nav.configuration' },
  { to: '/analysis', icon: BarChart3, labelKey: 'nav.analysis' },
  { to: '/alerts', icon: Bell, labelKey: 'nav.alerts' },
];

export function Sidebar({ isOpen, onClose, isCollapsed }: SidebarProps) {
  const language = useAppSelector((state) => state.language.current);
  const location = useLocation();

  const sidebarContent = (isMobile: boolean = false) => (
    <div className="flex h-full flex-col bg-gradient-to-b from-sidebar to-sidebar/95 border-r border-sidebar-border shadow-xl shadow-black/5 dark:shadow-black/20 backdrop-blur-sm">
      {/* Mobile Close Button */}
      {isMobile && (
        <div className="flex justify-end p-4">
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-1 px-3 py-4", !isMobile && "pt-4")} role="navigation" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const label = t(item.labelKey, language);
          
          const linkContent = (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => isMobile && onClose()}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-sidebar-primary to-sidebar-primary/90 text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/25 dark:shadow-sidebar-primary/40 ring-1 ring-sidebar-primary/30"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20",
                !isMobile && isCollapsed && "justify-center px-2"
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {(!isCollapsed || isMobile) && <span>{label}</span>}
            </NavLink>
          );

          if (!isMobile && isCollapsed) {
            return (
              <Tooltip key={item.to} delayDuration={0}>
                <TooltipTrigger asChild>
                  {linkContent}
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </nav>

      {/* Footer */}
      {(!isCollapsed || isMobile) && (
        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-lg bg-gradient-to-br from-sidebar-accent to-sidebar-accent/80 p-3 shadow-lg shadow-sidebar-accent/20 dark:shadow-sidebar-accent/30 ring-1 ring-sidebar-accent/30 dark:ring-sidebar-accent/40">
            <p className="text-xs font-medium text-sidebar-accent-foreground">
              EvalSphere v1.0
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Evaluating AI Beyond Accuracy
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar - Always visible, collapsible */}
      <motion.aside 
        className="hidden md:block shrink-0"
        initial={false}
        animate={{ width: isCollapsed ? 64 : 256 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        {sidebarContent(false)}
      </motion.aside>

      {/* Mobile Sidebar - Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={onClose}
            />
            
            {/* Slide-in Sidebar */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 h-full w-64 md:hidden shadow-2xl shadow-black/10 dark:shadow-black/40"
            >
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
