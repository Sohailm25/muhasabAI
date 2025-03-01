import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Home, 
  Book, 
  HelpCircle, 
  User, 
  Menu, 
  X,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Landmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [location, setLocation] = useLocation();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
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
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Collapse button (desktop only) */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed bottom-4 left-4 z-50 hidden md:flex"
        onClick={toggleCollapse}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
      </Button>

      {/* Sidebar overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 h-full bg-background border-r transform transition-all duration-200 ease-in-out z-50",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        isCollapsed ? "md:w-16" : "w-64",
        className
      )}>
        <div className="flex flex-col h-full">
          <div className={cn(
            "p-4 border-b flex items-center",
            isCollapsed && "justify-center"
          )}>
            {!isCollapsed ? (
              <h2 className="text-xl font-semibold">MuhasabAI</h2>
            ) : (
              <span className="text-xl font-semibold">M</span>
            )}
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <Button 
              variant={isActive('/') ? "secondary" : "ghost"} 
              className={cn(
                "w-full", 
                isCollapsed ? "justify-center px-2" : "justify-start"
              )} 
              onClick={() => navigateTo('/')}
              title="Home"
            >
              <Home className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && "Home"}
            </Button>

            <Button 
              variant={isActive('/halaqa') ? "secondary" : "ghost"} 
              className={cn(
                "w-full", 
                isCollapsed ? "justify-center px-2" : "justify-start"
              )} 
              onClick={() => navigateTo('/halaqa')}
              title="HalaqaHelper"
            >
              <Book className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && "HalaqaHelper"}
            </Button>

            <Button 
              variant={isActive('/personal-action-plan') ? "secondary" : "ghost"} 
              className={cn(
                "w-full", 
                isCollapsed ? "justify-center px-2" : "justify-start"
              )} 
              onClick={() => navigateTo('/personal-action-plan')}
              title="Personal Action Plan"
            >
              <ClipboardList className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && "Action Plan"}
            </Button>

            <Button 
              variant={isActive('/masjid') ? "secondary" : "ghost"} 
              className={cn(
                "w-full", 
                isCollapsed ? "justify-center px-2" : "justify-start"
              )} 
              onClick={() => navigateTo('/masjid')}
              title="Masjid & Prayer Times"
            >
              <Landmark className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && "Masjid"}
            </Button>

            <Button 
              variant={isActive('/help') ? "secondary" : "ghost"} 
              className={cn(
                "w-full", 
                isCollapsed ? "justify-center px-2" : "justify-start"
              )} 
              onClick={() => navigateTo('/help')}
              title="Help"
            >
              <HelpCircle className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && "Help"}
            </Button>

            <Button 
              variant={isActive('/profile') ? "secondary" : "ghost"} 
              className={cn(
                "w-full", 
                isCollapsed ? "justify-center px-2" : "justify-start"
              )} 
              onClick={() => navigateTo('/profile')}
              title="Profile"
            >
              <User className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && "Profile"}
            </Button>
          </nav>

          <div className={cn(
            "p-4 border-t",
            isCollapsed && "flex justify-center"
          )}>
            <Button 
              className={cn(
                "flex items-center gap-2",
                isCollapsed ? "w-auto p-2" : "w-full"
              )}
              onClick={() => navigateTo('/new')}
              title="New Reflection"
            >
              <PlusCircle className="h-4 w-4" />
              {!isCollapsed && "New Reflection"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
} 