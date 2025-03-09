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
import { Toaster as HotToaster } from 'react-hot-toast';
import { usePrivacyPolicy } from './hooks/usePrivacyPolicy';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';

// Import pages
import LandingPage from "@/pages/landing"; // New landing page
import LoginPage from "@/pages/login"; // New login page
import Home from "@/pages/home";
import NewReflection from "@/pages/new";
import Chat from "@/pages/chat";
import HalaqaHelper from "@/pages/halaqa"; // Halaqa Helper component
import HalaqaNew from "@/pages/halaqa/new"; // New Halaqa entry
import HalaqaDetail from "@/pages/halaqa/[id]"; // Halaqa detail view
import HalaqaEdit from "@/pages/halaqa/edit/[id]"; // Halaqa edit view
import WirdPage from "@/pages/wird"; // Wird main page
import WirdNew from "@/pages/wird/new"; // New Wird entry
import WirdDetail from "@/pages/wird/[id]"; // Wird detail view
import WirdhPage from "@/pages/wirdh"; // Wirdh main page
import WirdhNew from "@/pages/wirdh/new"; // New Wirdh entry
import WirdhDetail from "@/pages/wirdh/[id]"; // Wirdh detail view
import Help from "@/pages/help";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import PersonalActionPlan from "@/pages/personal-action-plan";
import DashboardPage from "@/pages/dashboard";
import SettingsPage from "@/pages/settings";
import ReflectionsPage from "@/pages/reflections";
import HistoryPage from "@/pages/history";
import IdentityPage from "@/pages/identity";
import NewIdentityFramework from "@/pages/identity/new";
import FrameworkEditor from "@/pages/identity/[id]";
import HabitTrackingPage from "@/pages/identity/tracking";
import WirdPageNew from "@/pages/wird/WirdPageNew"; // New Wird page with vertical layout

const AppContent = () => {
  const { isOpen, closeModal } = usePersonalizationModal();
  const { isOpen: privacyPolicyIsOpen, acceptPrivacyPolicy } = usePrivacyPolicy();
  
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
        
        {/* Identity Builder routes - specific routes first! */}
        <Route path="/identity/new">
          <RequireAuth>
            <NewIdentityFramework />
          </RequireAuth>
        </Route>
        <Route path="/identity/tracking">
          <RequireAuth>
            <HabitTrackingPage />
          </RequireAuth>
        </Route>
        <Route path="/identity/:id">
          <RequireAuth>
            <FrameworkEditor />
          </RequireAuth>
        </Route>
        <Route path="/identity">
          <RequireAuth>
            <IdentityPage />
          </RequireAuth>
        </Route>
        
        {/* HalaqAI routes - specific routes first! */}
        <Route path="/halaqa/new">
          <RequireAuth>
            <HalaqaNew />
          </RequireAuth>
        </Route>
        <Route path="/halaqa/edit/:id">
          <RequireAuth>
            <HalaqaEdit />
          </RequireAuth>
        </Route>
        <Route path="/halaqa/:id">
          <RequireAuth>
            <HalaqaDetail />
          </RequireAuth>
        </Route>
        <Route path="/halaqa">
          <RequireAuth>
            <HalaqaHelper />
          </RequireAuth>
        </Route>
        
        {/* WirdhAI routes - specific routes first! */}
        <Route path="/wirdh/new">
          <RequireAuth>
            <WirdhNew />
          </RequireAuth>
        </Route>
        <Route path="/wirdh/:id">
          <RequireAuth>
            <WirdhDetail />
          </RequireAuth>
        </Route>
        <Route path="/wirdh">
          <RequireAuth>
            <WirdhPage />
          </RequireAuth>
        </Route>
        
        {/* Keep old wird routes for backward compatibility */}
        <Route path="/wird/new">
          <RequireAuth>
            <WirdNew />
          </RequireAuth>
        </Route>
        <Route path="/wird/:id">
          <RequireAuth>
            <WirdDetail />
          </RequireAuth>
        </Route>
        <Route path="/wird">
          <RequireAuth>
            <WirdPageNew />
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
        <Route>
          <NotFound />
        </Route>
      </Switch>
      
      {/* Personalization modal for first-time users */}
      <PersonalizationModal open={isOpen} onClose={closeModal} />
      
      <PrivacyPolicyModal 
        open={privacyPolicyIsOpen} 
        showAcceptButton={true}
        onAccept={acceptPrivacyPolicy}
      />
      
      <Toaster />
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
    }, 300000); // Check every 5 minutes instead of 10 seconds
    
    return () => clearInterval(debugInterval);
  }, []);

  return (
    <ThemeProvider defaultTheme="light">
      <AuthProvider>
        <ProfileIntegration>
          <QueryClientProvider client={queryClient}>
            <AppContent />
          </QueryClientProvider>
        </ProfileIntegration>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
