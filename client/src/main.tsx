// Polyfill for process
if (typeof window !== 'undefined' && !window.process) {
  // @ts-ignore -- Intentionally providing a minimal process polyfill
  window.process = {
    env: {
      NODE_ENV: import.meta.env.MODE || 'development'
    }
  };
}

import React, { Suspense, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add application loading state
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <h1 className="text-lg font-medium text-foreground">Loading SahabAI...</h1>
    </div>
  </div>
);

// Error boundary
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md p-6 bg-background border rounded-lg shadow-sm">
            <h1 className="text-xl font-semibold text-destructive mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-4">The application encountered an error. Please try refreshing the page.</p>
            <pre className="bg-muted p-3 rounded text-sm overflow-auto max-h-40 mb-4">{this.state.error?.message}</pre>
            <button 
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Clear any circuit breakers on app startup
(() => {
  try {
    console.log('[App] Clearing any circuit breakers on startup');
    Object.keys(localStorage)
      .filter(key => 
        key.startsWith('circuit_') || 
        key.startsWith('failures_') || 
        key.includes('profile')
      )
      .forEach(key => {
        console.log('[App] Removing stored key:', key);
        localStorage.removeItem(key);
      });
  } catch (e) {
    console.error('[App] Error clearing circuit breakers:', e);
  }
})();

// Root
const root = createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>
);
