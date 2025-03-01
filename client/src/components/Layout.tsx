import { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  title?: string;
}

export function Layout({ children, showSidebar = true, title }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      {showSidebar && <Sidebar />}
      
      {/* Main content */}
      <div className={`min-h-screen flex-1 ${showSidebar ? "md:ml-64" : ""}`}>
        {title && (
          <header className="fixed top-0 left-0 right-0 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
            <div className={`h-full flex items-center ${showSidebar ? "md:ml-64" : ""} px-4 md:px-8`}>
              <h1 className="text-xl font-semibold">{title}</h1>
            </div>
          </header>
        )}
        
        <main className={`${title ? "pt-20" : ""} pb-16`}>
          {children}
        </main>
      </div>
    </div>
  );
} 