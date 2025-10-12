import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { WebSocketProvider } from "@/hooks/useWebSocket";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";

// Pages
import LandingPage from "@/pages/LandingPage";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import RoleSelection from "@/pages/auth/RoleSelection";
import SignUp from "@/pages/auth/SignUp";
import SignIn from "@/pages/auth/SignIn";
import LaborerSetup from "@/pages/profile/LaborerSetup";
import CustomerDashboard from "@/pages/dashboard/CustomerDashboard";
import LaborerDashboard from "@/pages/dashboard/LaborerDashboard";
import AdminDashboard from "@/pages/dashboard/AdminDashboard";
import WalletDashboard from "@/pages/dashboard/WalletDashboard";
import WithdrawalPage from "@/pages/dashboard/WithdrawalPage";
import SobrietyCheck from "@/pages/SobrietyCheck";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/auth/get-started" component={RoleSelection} />
      <Route path="/auth/signup" component={SignUp} />
      <Route path="/auth/signin" component={SignIn} />
      <Route path="/profile/laborer-setup">
        <ProtectedRoute requiredRole="laborer">
          <LaborerSetup />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/customer">
        <ProtectedRoute requiredRole="customer">
          <CustomerDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/laborer">
        <ProtectedRoute requiredRole="laborer">
          <LaborerDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/admin">
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/sobriety-check">
        <ProtectedRoute requiredRole="laborer">
          <SobrietyCheck />
        </ProtectedRoute>
      </Route>
      <Route path="/wallet">
        <ProtectedRoute requiredRole="laborer">
          <WalletDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/wallet/withdraw">
        <ProtectedRoute requiredRole="laborer">
          <WithdrawalPage />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  // Show loading state while auth hydrates
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <WebSocketProvider userId={user?.id}>
      <Router />
    </WebSocketProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <AppContent />
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
