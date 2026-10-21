'use client';

import { useEffect, useState } from 'react';
import { fetchMenu, fetchMenuGraphics, groupByScreen, type MenuSection } from '@/lib/menu-data';
import MenuBoard from '@/components/menu-board';
import MenuFooter from '@/components/menu-footer';

const POLL_INTERVAL_MS = 120_000; // 2 min — board content rarely changes, no need to hammer the API

const ADD_ONS = ['Go large — $1', 'Add a double shot — $3', 'Alternative milk — $0.50', 'Add foam — $1'];

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
        {/* Sits inside the content card, behind the menu text — the card's
            own near-opaque background would otherwise hide a watermark
            placed behind the whole page. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.jpg" alt="" style={styles.watermark} />
        <div style={styles.contentInner}>
          {screen === 1 && (
            <div style={styles.addOns}>
              {ADD_ONS.map((line, i) => (
                <span key={line} style={styles.addOnItem}>
                  {i > 0 && <span style={styles.addOnDot}>•</span>}
                  {line}
                </span>
              ))}
            </div>
          )}
          {loaded && sections.length === 0 ? (
            <p style={styles.emptyText}>Menu coming soon.</p>
          ) : (
            <MenuBoard sections={sections} columns={1} />
          )}
          <MenuFooter />
        </div>
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
    overflow: 'hidden',
  },
  // Big, light brand mark centered behind the menu text. The logo file has
  // a solid white square background (not transparent) — 'multiply' makes
  // white areas a no-op against the card's cream background while the dark
  // mark itself shows through at low opacity, so it reads as a watermark
  // rather than a white box. Needs 'position: relative' on its sibling
  // (contentInner) below, or the non-positioned menu text would paint
  // first and this positioned image would cover it instead of sitting
  // behind it.
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: 900,
    height: 'auto',
    opacity: 0.16,
    mixBlendMode: 'multiply',
    pointerEvents: 'none',
  },
  contentInner: {
    position: 'relative',
  },
  addOns: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '6px 10px',
    marginBottom: 28,
    paddingBottom: 20,
    borderBottom: '1px dashed rgba(184,115,51,0.35)',
  },
  addOnItem: {
    color: 'rgba(27,21,16,0.7)',
    fontFamily: 'var(--font-menu)',
    fontSize: 16,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  addOnDot: {
    color: '#B87333',
    marginRight: 10,
  },
  emptyText: {
    color: 'rgba(27,21,16,0.5)',
    fontFamily: 'var(--font-menu)',
    fontSize: 26,
  },
};
