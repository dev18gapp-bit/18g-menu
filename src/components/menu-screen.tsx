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

  return (
    <main style={styles.page}>
      {graphics.background && (
        // Pinned to the viewport (not the content box) so `cover` scales
        // against the actual screen size instead of the page's content
        // height — otherwise a screen with more menu items renders a
        // taller box and the same image ends up zoomed/cropped
        // differently than a shorter screen.
        <div style={{ ...styles.bgLayer, backgroundImage: `url(${graphics.background})` }} />
      )}
      {graphics.background && <div style={styles.scrim} />}
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
    position: 'relative',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#F2EBDC',
    display: 'flex',
    justifyContent: 'center',
    padding: 'clamp(28px, 4vw, 56px)',
  },
  bgLayer: {
    position: 'fixed',
    inset: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  // Sits between the background image and the content so menu text stays
  // legible no matter what's in the uploaded design. Kept light so the
  // background's true color still reads through — just enough to lift
  // contrast, not enough to wash a light design out to near-black.
  scrim: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(16,12,8,0.35)',
  },
  content: {
    position: 'relative',
    width: '100%',
    maxWidth: 1200,
    // Cream "paper card" so black item names and copper accents read
    // clearly whether or not a background photo is set.
    backgroundColor: 'rgba(250,244,231,0.88)',
    borderRadius: 16,
    padding: 'clamp(20px, 3vw, 40px)',
    boxShadow: '0 20px 50px rgba(20,14,8,0.25)',
  },
  emptyText: {
    color: 'rgba(27,21,16,0.5)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 26,
  },
};
