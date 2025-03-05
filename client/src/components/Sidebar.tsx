import { useState, useEffect } from "react";
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
  LogOut,
  Loader2,
  Puzzle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  className?: string;
  onCollapseChange?: (isCollapsed: boolean) => void;
}

export function Sidebar({ className, onCollapseChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [location, setLocation] = useLocation();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    // Notify parent component of collapse state change
    if (onCollapseChange) {
      onCollapseChange(newCollapsedState);
    }
  };

  // Notify parent component of initial collapse state
  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, []);

  const closeSidebar = () => {
    setIsOpen(false);
  };

  const navigateTo = (path: string) => {
    setLocation(path);
    closeSidebar();
  };

  const isActive = (path: string) => {
    if (path === '/home' && location === '/home') return true;
    if (path === '/' && location === '/') return true;
    if (path !== '/' && path !== '/home' && location.startsWith(path)) return true;
    return false;
  };

  const handleLogout = async () => {
    try {
      // Set logging out state to true
      setIsLoggingOut(true);
      
      // Call logout and wait for it to complete
      await logout();
      
      // Directly go to the login page, bypassing any protected routes
      // This prevents RequireAuth from adding a return_to parameter
      window.location.href = '/login';
      
      // Remove timeout as it's not needed anymore
    } catch (err) {
      console.error("Error logging out:", err);
      setIsLoggingOut(false);
    }
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
              variant={isActive('/home') ? "secondary" : "ghost"} 
              className={cn(
                "w-full", 
                isCollapsed ? "justify-center px-2" : "justify-start"
              )} 
              onClick={() => navigateTo('/home')}
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
              title="HalaqAI"
            >
              <Book className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && "HalaqAI"}
            </Button>

            <Button 
              variant={isActive('/wird') ? "secondary" : "ghost"} 
              className={cn(
                "w-full", 
                isCollapsed ? "justify-center px-2" : "justify-start"
              )} 
              onClick={() => navigateTo('/wird')}
              title="WirdhAI"
            >
              <ClipboardList className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && "WirdhAI"}
            </Button>

            <Button 
              variant={isActive('/identity') ? "secondary" : "ghost"} 
              className={cn(
                "w-full", 
                isCollapsed ? "justify-center px-2" : "justify-start"
              )} 
              onClick={() => navigateTo('/identity')}
              title="Identity Builder"
            >
              <Puzzle className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && "Identity Builder"}
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
            "p-4 border-t space-y-2",
            isCollapsed && "flex flex-col items-center"
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
            
            <Button 
              variant="outline"
              className={cn(
                "flex items-center gap-2",
                isCollapsed ? "w-auto p-2" : "w-full"
              )}
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Sign Out"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {!isCollapsed && "Signing out..."}
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  {!isCollapsed && "Sign Out"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
} 