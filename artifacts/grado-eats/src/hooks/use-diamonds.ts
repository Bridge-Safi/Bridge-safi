import { useState, useEffect } from 'react';
import { useUser } from '../bridge-auth';

const DIAMONDS_API = 'https://workspaceapi-server-production-12a5.up.railway.app';

export function useDiamonds() {
  const { user } = useUser();
  const [diamonds, setDiamonds] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const phone = user?.phone ?? user?.primaryPhoneNumber?.phoneNumber;
    if (!phone) return;

    setLoading(true);
    fetch(`${DIAMONDS_API}/api/diamonds?phone=${encodeURIComponent(phone)}`)
      .then(r => r.json())
      .then(d => { if (d.found) setDiamonds(d.diamonds); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return { diamonds, loading };
}
