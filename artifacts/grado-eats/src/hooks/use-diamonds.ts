import { useState, useEffect } from 'react';
import { useAuth } from '../bridge-auth';

export function useDiamonds() {
  const { isSignedIn, getToken } = useAuth();
  const [diamonds, setDiamonds] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;
    setLoading(true);
    getToken().then(token => {
      if (!token) return;
      fetch('/api/game/diamonds', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.diamonds != null) setDiamonds(d.diamonds); })
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, [isSignedIn]);

  return { diamonds, loading };
}
