import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "./components/theme-provider";

// Import pages
import Home from "@/pages/home";
import NewReflection from "@/pages/new";
import Chat from "@/pages/chat";
import HalaqaHelper from "@/pages/halaqa";
import Help from "@/pages/help";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import PersonalActionPlan from "@/pages/personal-action-plan";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/new" component={NewReflection} />
      <Route path="/chat/:id" component={Chat} />
      <Route path="/halaqa" component={HalaqaHelper} />
      <Route path="/help" component={Help} />
      <Route path="/profile" component={Profile} />
      <Route path="/personal-action-plan" component={PersonalActionPlan} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
