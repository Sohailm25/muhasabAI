import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Home, 
  Book, 
  HelpCircle, 
  User, 
  Menu, 
  X,
  PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useLocation();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  const navigateTo = (path: string) => {
    setLocation(path);
    closeSidebar();
  };

  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {/* Mobile sidebar toggle */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={toggleSidebar}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 h-full w-64 bg-background border-r transform transition-transform duration-200 ease-in-out z-50",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        className
      )}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">SahabAI</h2>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <Button 
              variant={isActive('/') ? "secondary" : "ghost"} 
              className="w-full justify-start" 
              onClick={() => navigateTo('/')}
            >
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>

            <Button 
              variant={isActive('/halaqa') ? "secondary" : "ghost"} 
              className="w-full justify-start" 
              onClick={() => navigateTo('/halaqa')}
            >
              <Book className="mr-2 h-4 w-4" />
              HalaqaHelper
            </Button>

            <Button 
              variant={isActive('/help') ? "secondary" : "ghost"} 
              className="w-full justify-start" 
              onClick={() => navigateTo('/help')}
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              Help
            </Button>

            <Button 
              variant={isActive('/profile') ? "secondary" : "ghost"} 
              className="w-full justify-start" 
              onClick={() => navigateTo('/profile')}
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
          </nav>

          <div className="p-4 border-t">
            <Button 
              className="w-full flex items-center gap-2"
              onClick={() => navigateTo('/new')}
            >
              <PlusCircle className="h-4 w-4" />
              New Reflection
            </Button>
          </div>
        </div>
      </div>
    </>
  );
} 