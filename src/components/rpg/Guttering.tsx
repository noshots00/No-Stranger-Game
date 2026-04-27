import { useEffect, useState } from 'react';

export function Guttering() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      const delay = 180000 + Math.random() * 120000;
      timer = setTimeout(() => {
        setActive(true);
        setTimeout(() => setActive(false), 250);
        schedule();
      }, delay);
    };

    schedule();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!active) return null;

  return <div className="pointer-events-none fixed inset-0 z-50 bg-black/40 transition-opacity duration-200" />;
}
