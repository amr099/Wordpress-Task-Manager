import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuthContext } from "@/components/AuthProvider";
import { queryClient } from "@/lib/queryClient";
import Auth from "@/pages/Auth";
import NameSelection from "@/pages/NameSelection";
import Dashboard from "@/pages/Dashboard";

function AppContent() {
  const { user, firebaseUser, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!firebaseUser) {
    return <Auth />;
  }

  // Authenticated but no user profile (needs to set display name)
  if (!user) {
    return <NameSelection />;
  }

  // Fully authenticated with profile
  return <Dashboard />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
