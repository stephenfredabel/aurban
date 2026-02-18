import { useEffect }           from 'react';
import { useNavigate }         from 'react-router-dom';
import { useAuth, isProviderRole } from '../../context/AuthContext.jsx';
import { OnboardingProvider }  from '../../context/OnboardingContext.jsx';
import { LocaleProvider }      from '../../context/LocaleContext.jsx';
import OnboardingShell         from '../../components/onboarding/OnboardingShell.jsx';

/**
 * Main onboarding page
 * Wraps shell with OnboardingProvider (isolated state)
 * Redirects already-onboarded users to their appropriate dashboard
 */
export default function OnboardingPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  // If user is fully onboarded, send to the correct dashboard
  useEffect(() => {
    if (user?.tier?.level >= 2) {
      const dest = isProviderRole(user.role) ? '/provider' : '/dashboard';
      navigate(dest, { replace: true });
    }
  }, [user, navigate]);

  return (
    <LocaleProvider>
      <OnboardingProvider>
        <OnboardingShell />
      </OnboardingProvider>
    </LocaleProvider>
  );
}
