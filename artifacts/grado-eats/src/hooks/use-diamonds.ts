import { useState, useEffect } from 'react';
import { useUser } from '@clerk/react';

const DIAMONDS_API = 'https://workspaceapi-server-production-12a5.up.railway.app';

export function useDiamonds() {
  const { user } = useUser();
  const [diamonds, setDiamonds] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const phone = user?.phoneNumbers?.[0]?.phoneNumber;
    if (!phone) return;

    setLoading(true);
    fetch(`${DIAMONDS_API}/api/diamonds?phone=${encodeURIComponent(phone)}`)
      .then(r => r.json())
      .then(data => {
        if (data.found) setDiamonds(data.diamonds);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return { diamonds, loading };
}
