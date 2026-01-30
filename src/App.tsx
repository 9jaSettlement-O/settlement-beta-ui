import { BrowserRouter as Router, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import AppRoutes from "@/routes/AppRoutes";
import { OnboardingProgressGuard } from "@/components/onboarding/OnboardingProgressGuard";
import { navigationService } from "@/lib/navigation/navigation.util";

// Component to register navigation service
const NavigationProvider = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Register the navigate function with the navigation service
    navigationService.register(navigate);
  }, [navigate]);

  return null;
};

const App = () => {
  return (
    <Router>
      <NavigationProvider />
      <OnboardingProgressGuard />
      <AppRoutes />
    </Router>
  );
};

export default App;
