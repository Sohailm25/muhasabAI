import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./hooks/useAuth";
import { ProfileIntegration } from "./components/ProfileIntegration";
import { RequireAuth } from './components/RequireAuth';
import { PersonalizationModal } from './components/PersonalizationModal';
import { usePersonalizationModal } from './hooks/usePersonalizationModal';
import { useEffect } from 'react';
import { setupAuthStorageMonitor, debugAuthToken } from './utils/auth-debug';

// Import pages
import LandingPage from "@/pages/landing"; // New landing page
import LoginPage from "@/pages/login"; // New login page
import Home from "@/pages/home";
import NewReflection from "@/pages/new";
import Chat from "@/pages/chat";
import HalaqaHelper from "@/pages/halaqa"; // Halaqa Helper component
import Help from "@/pages/help";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import PersonalActionPlan from "@/pages/personal-action-plan";
import MasjidPage from "@/pages/masjid";
import DashboardPage from "@/pages/dashboard";
import SettingsPage from "@/pages/settings";
import ReflectionsPage from "@/pages/reflections";
import HistoryPage from "@/pages/history";

const AppContent = () => {
  const { isOpen, closeModal } = usePersonalizationModal();
  
  return (
    <>
      <Switch>
        {/* Public routes */}
        <Route path="/">
          <LandingPage />
        </Route>
        <Route path="/login">
          <LoginPage />
        </Route>
        
        {/* Protected routes */}
        <Route path="/dashboard">
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        </Route>
        <Route path="/profile">
          <RequireAuth>
            <Profile />
          </RequireAuth>
        </Route>
        <Route path="/settings">
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        </Route>
        <Route path="/reflections">
          <RequireAuth>
            <ReflectionsPage />
          </RequireAuth>
        </Route>
        <Route path="/chat/:id">
          <RequireAuth>
            <Chat />
          </RequireAuth>
        </Route>
        <Route path="/chat">
          <RequireAuth>
            <Chat />
          </RequireAuth>
        </Route>
        <Route path="/history">
          <RequireAuth>
            <HistoryPage />
          </RequireAuth>
        </Route>
        <Route path="/home">
          <RequireAuth>
            <Home />
          </RequireAuth>
        </Route>
        <Route path="/new">
          <RequireAuth>
            <NewReflection />
          </RequireAuth>
        </Route>
        <Route path="/halaqa">
          <RequireAuth>
            <HalaqaHelper />
          </RequireAuth>
        </Route>
        <Route path="/help">
          <RequireAuth>
            <Help />
          </RequireAuth>
        </Route>
        <Route path="/personal-action-plan">
          <RequireAuth>
            <PersonalActionPlan />
          </RequireAuth>
        </Route>
        <Route path="/masjid">
          <RequireAuth>
            <MasjidPage />
          </RequireAuth>
        </Route>
        <Route>
          <NotFound />
        </Route>
      </Switch>
      
      {/* Personalization modal for first-time users */}
      <PersonalizationModal open={isOpen} onClose={closeModal} />
    </>
  );
};

function App() {
  // Initialize auth debugging hooks
  useEffect(() => {
    // Set up localStorage monitoring for auth tokens
    setupAuthStorageMonitor();
    
    // Debug current token on startup
    const { token } = debugAuthToken();
    console.log('App initialized with token:', token ? 'Token exists' : 'No token');
    
    // Debug token periodically
    const debugInterval = setInterval(() => {
      debugAuthToken();
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(debugInterval);
  }, []);

  return (
    <ThemeProvider defaultTheme="light">
      <AuthProvider>
        <ProfileIntegration>
          <QueryClientProvider client={queryClient}>
            <AppContent />
            <Toaster />
          </QueryClientProvider>
        </ProfileIntegration>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
