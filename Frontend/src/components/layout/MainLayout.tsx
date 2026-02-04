import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      <Header 
        onMenuClick={() => setSidebarOpen(true)}
        isSidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className="flex flex-1">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
        />
        
        <main id="main-content" className="flex-1 overflow-auto" role="main">
          <div className="container max-w-7xl py-6 px-4 md:px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
