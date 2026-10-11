'use client';

import { useEffect, useState } from 'react';
import { fetchMenu, fetchMenuGraphics, groupByScreen, type MenuSection } from '@/lib/menu-data';
import MenuBoard from '@/components/menu-board';
import MenuFooter from '@/components/menu-footer';

const POLL_INTERVAL_MS = 120_000; // 2 min — board content rarely changes, no need to hammer the API

export default function MenuScreen({ screen }: { screen: number }) {
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [graphics, setGraphics] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [items, graphicsMap] = await Promise.all([fetchMenu(), fetchMenuGraphics()]);
      if (!cancelled) {
        setSections(groupByScreen(items, screen));
        setGraphics(graphicsMap);
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

  const pageStyle: React.CSSProperties = graphics.background
    ? {
        ...styles.page,
        backgroundImage: `url(${graphics.background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : styles.page;

  const contentStyle: React.CSSProperties = graphics.background ? { ...styles.content, ...styles.contentPanel } : styles.content;

  return (
    <main style={pageStyle}>
      {graphics.background && <div style={styles.scrim} />}
      <div style={contentStyle}>
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
    position: 'relative',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#100C08',
    display: 'flex',
    justifyContent: 'center',
    padding: 'clamp(28px, 4vw, 56px)',
  },
  // Sits between the background image and the content so menu text stays
  // legible no matter what's in the uploaded design. Kept light so the
  // background's true color still reads through — just enough to lift
  // text contrast, not enough to wash a light design out to near-black.
  scrim: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(16,12,8,0.35)',
  },
  content: {
    position: 'relative',
    width: '100%',
    maxWidth: 900,
  },
  // Guarantees text contrast over a background image regardless of how
  // light the uploaded design is — the scrim alone isn't enough once it's
  // kept subtle enough to preserve the background's true color.
  contentPanel: {
    backgroundColor: 'rgba(16,12,8,0.55)',
    borderRadius: 16,
    padding: 'clamp(20px, 3vw, 40px)',
  },
  emptyText: {
    color: 'rgba(245,236,215,0.4)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 16,
  },
};
