import { Moon, Sun, Globe, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppDispatch, useAppSelector } from '@/store';
import { toggleTheme } from '@/store/slices/themeSlice';
import { setLanguage } from '@/store/slices/languageSlice';
import { logout } from '@/store/slices/authSlice';
import { resetCurrentWorkflow } from '@/store/slices/workflowSlice';
import { languages, t, Language } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function Header({ onMenuClick, isSidebarCollapsed, onToggleSidebar }: HeaderProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useAppSelector((state) => state.theme.mode);
  const language = useAppSelector((state) => state.language.current);
  const user = useAppSelector((state) => state.auth.user);

  // derive a safe display name to avoid calling .charAt on undefined
  const displayName = user ? (user.name ?? (user as any).username ?? '') : '';

  const handleLogout = () => {
    // clear auth + workflow and navigate to login
    dispatch(logout());
    // Reset in-progress workflow data so next user starts clean
    try {
      dispatch(resetCurrentWorkflow());
    } catch (err) {
      // ignore if workflow slice not available
      console.warn('Failed to reset workflow on logout', err);
    }
    // clear any sessionStorage keys used by workflow
    try {
      sessionStorage.removeItem('selectedSuites');
      sessionStorage.removeItem('workflow_step2');
    } catch (err) {
      // ignore
    }
    navigate('/login');
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full border-b border-border backdrop-blur-xl bg-gradient-to-b from-background/95 to-background/80 dark:from-background/90 dark:to-background/70 shadow-lg shadow-black/5 dark:shadow-black/20"
    >
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
            aria-label="Toggle mobile menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* Desktop Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={onToggleSidebar}
            aria-label={isSidebarCollapsed ? "Open sidebar" : "Close sidebar"}
          >
            {isSidebarCollapsed ? (
              <Menu className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )}
          </Button>

          {/* EvalSphere Logo */}
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              EvalSphere
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Select language">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-gradient-to-br from-popover to-popover/95 border border-border shadow-xl shadow-black/10 dark:shadow-black/30 backdrop-blur-md z-50">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => dispatch(setLanguage(lang.code))}
                  className={language === lang.code ? 'bg-accent' : ''}
                >
                  <span className="mr-2">{lang.flag}</span>
                  <span>{lang.nativeName}</span>
                  {language === lang.code && (
                    <span className="ml-auto text-primary">✓</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dispatch(toggleTheme())}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2 sm:px-3 hover:bg-accent/50 transition-all duration-200">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-medium shadow-lg shadow-primary/25 dark:shadow-primary/40 ring-2 ring-primary/20 dark:ring-primary/30">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline-block">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gradient-to-br from-popover to-popover/95 border border-border shadow-xl shadow-black/10 dark:shadow-black/30 backdrop-blur-md z-50">
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('nav.logout', language)}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </motion.header>
  );
}
