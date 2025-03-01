import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  title?: string;
}

export function Layout({ children, showSidebar = true, title }: LayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Add viewport height fix for mobile browsers
  useEffect(() => {
    const setVh = () => {
      // Set the value based on the viewport height
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Initial call
    setVh();

    // Add event listener
    window.addEventListener('resize', setVh);
    
    // Clean up
    return () => window.removeEventListener('resize', setVh);
  }, []);

  // Handler for sidebar collapse state change
  const handleSidebarCollapse = (isCollapsed: boolean) => {
    setIsSidebarCollapsed(isCollapsed);
  };

  return (
    <div className="min-h-screen min-h-[calc(var(--vh,1vh)*100)] bg-background flex">
      {/* Sidebar */}
      {showSidebar && <Sidebar onCollapseChange={handleSidebarCollapse} />}
      
      {/* Main content */}
      <div className={`min-h-screen min-h-[calc(var(--vh,1vh)*100)] flex-1 ${showSidebar ? (isSidebarCollapsed ? "md:ml-16" : "md:ml-64") : ""} transition-all duration-200`}>
        {title && (
          <header className="fixed top-0 left-0 right-0 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
            <div className={`h-full flex items-center ${showSidebar ? (isSidebarCollapsed ? "md:ml-16" : "md:ml-64") : ""} px-4 md:px-8 transition-all duration-200`}>
              <h1 className="text-xl font-semibold">{title}</h1>
            </div>
          </header>
        )}
        
        <main className={`${title ? "pt-20" : ""} pb-16 px-4 md:px-6`}>
          {children}
        </main>
      </div>
    </div>
  );
} 