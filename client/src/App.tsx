import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
      <Route path="/profile/laborer-setup" component={LaborerSetup} />
      <Route path="/dashboard/customer" component={CustomerDashboard} />
      <Route path="/dashboard/laborer" component={LaborerDashboard} />
      <Route path="/sobriety-check" component={SobrietyCheck} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
