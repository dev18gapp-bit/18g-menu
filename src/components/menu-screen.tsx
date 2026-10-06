'use client';

import { useEffect, useState } from 'react';
import { fetchMenu, groupByScreen, type MenuSection } from '@/lib/menu-data';
import MenuBoard from '@/components/menu-board';
import MenuFooter from '@/components/menu-footer';

const POLL_INTERVAL_MS = 120_000; // 2 min — board content rarely changes, no need to hammer the API

export default function MenuScreen({ screen }: { screen: number }) {
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const items = await fetchMenu();
      if (!cancelled) {
        setSections(groupByScreen(items, screen));
        setLoaded(true);
      }
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [screen]);

  return (
    <main style={styles.page}>
      <div style={styles.content}>
        {loaded && sections.length === 0 ? (
          <p style={styles.emptyText}>Menu coming soon.</p>
        ) : (
          <MenuBoard sections={sections} />
        )}
        <MenuFooter />
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#100C08',
    display: 'flex',
    justifyContent: 'center',
    padding: 'clamp(28px, 4vw, 56px)',
  },
  content: {
    width: '100%',
    maxWidth: 900,
  },
  emptyText: {
    color: 'rgba(245,236,215,0.4)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 16,
  },
};
