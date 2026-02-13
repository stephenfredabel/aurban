import { useEffect }           from 'react';
import { useNavigate }         from 'react-router-dom';
import { useAuth }             from '../../context/AuthContext.jsx';
import { OnboardingProvider }  from '../../context/OnboardingContext.jsx';
import { LocaleProvider }      from '../../context/LocaleContext.jsx';
import OnboardingShell         from '../../components/onboarding/OnboardingShell.jsx';

/**
 * Main onboarding page
 * Wraps shell with OnboardingProvider (isolated state)
 * Redirects already-onboarded users to dashboard
 */
export default function OnboardingPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  // If user is fully onboarded, send to dashboard
  useEffect(() => {
    if (user?.tier?.level >= 2) {
      navigate('/dashboard', { replace: true });
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
