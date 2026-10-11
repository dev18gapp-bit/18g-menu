'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import { type ImagePayload } from '@/lib/files';
import PhotoUpload from '@/components/photo-upload';

interface GraphicRow {
  slot: string;
  image_url: string | null;
}

export default function GraphicsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [graphics, setGraphics] = useState<Record<string, string>>({});
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // localStorage isn't available during the static-export server render —
    // see the main admin page for the full rationale on this pattern.
    const stored = localStorage.getItem('menuAdminToken');
    if (!stored) {
      router.push('/admin/login');
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(stored);
  }, [router]);

  const load = useCallback(
    async (activeToken: string) => {
      setError('');
      try {
        const graphicsRes = await fetch(`${API_URL}/menu-admin/graphics`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        });
        if (graphicsRes.status === 401) {
          localStorage.removeItem('menuAdminToken');
          router.push('/admin/login');
          return;
        }

        const graphicsList: GraphicRow[] = await graphicsRes.json();
        const map: Record<string, string> = {};
        for (const g of graphicsList) {
          if (g.image_url) map[g.slot] = g.image_url;
        }
        setGraphics(map);
      } catch {
        setError('Could not load graphics — check your connection and try again.');
      }
    },
    [router]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (token) load(token);
  }, [token, load]);

  async function uploadGraphic(slot: string, image: ImagePayload) {
    if (!token) return;
    setBusySlot(slot);
    setError('');
    try {
      const res = await fetch(`${API_URL}/menu-admin/graphics/${encodeURIComponent(slot)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ image }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Could not upload that graphic.');
        return;
      }
      await load(token);
    } finally {
      setBusySlot(null);
    }
  }

  function signOut() {
    localStorage.removeItem('menuAdminToken');
    router.push('/admin/login');
  }

  if (!token) return null;

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.label}>MENU ADMIN — GRAPHICS</p>
          <div style={styles.divider} />
          <nav style={styles.nav}>
            <Link href="/admin" style={styles.navLink}>
              Menu
            </Link>
            <Link href="/admin/costing" style={styles.navLink}>
              Drink Costing
            </Link>
            <Link href="/admin/costing/food" style={styles.navLink}>
              Food Costing
            </Link>
            <span style={styles.navLinkActive}>Graphics</span>
          </nav>
        </div>
        <button style={styles.signOutBtn} onClick={signOut}>
          Sign Out
        </button>
      </div>

      {error && <p style={styles.errorText}>{error}</p>}

      <section style={styles.bgSection}>
        <p style={styles.sectionHeading}>Background</p>
        <div style={styles.tip}>
          <p style={styles.tipTitle}>Designing this in Canva</p>
          <p style={styles.tipCopy}>
            These TVs are mounted <b>vertically</b> — export in portrait, <b>1080×1920px</b> (or whatever your TV&apos;s
            actual resolution is, tall side up) so it fills the screen without stretching. A landscape/widescreen
            export will get heavily cropped on the sides, so don&apos;t reuse a 1920×1080 design here. This sits
            <b> behind</b> the menu text with a dark overlay on top for readability, so keep the busiest parts of
            your design toward the top and bottom edges — the vertical center, where the menu list sits, will be
            dimmed.
          </p>
        </div>
        <div style={styles.bgCard}>
          <div style={styles.bgPreviewWrap}>
            {graphics.background ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={graphics.background} alt="" style={styles.bgPreview} />
            ) : (
              <span style={styles.bgPreviewEmpty}>No background set</span>
            )}
          </div>
          <PhotoUpload
            imageUrl={graphics.background}
            busy={busySlot === 'background'}
            size={56}
            label="Background"
            onUpload={(image) => uploadGraphic('background', image)}
            onError={setError}
          />
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#100C08',
    padding: 'clamp(24px, 5vw, 60px)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  label: {
    color: '#F5ECD7',
    fontSize: 10,
    fontFamily: 'var(--font-raleway)',
    fontWeight: 700,
    letterSpacing: '4px',
    marginBottom: 12,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: '#C9A84C',
    opacity: 0.6,
    marginBottom: 14,
  },
  nav: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
  },
  navLink: {
    color: 'rgba(245,236,215,0.5)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.5px',
    textDecoration: 'none',
  },
  navLinkActive: {
    color: '#C9A84C',
    fontFamily: 'var(--font-raleway)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.5px',
  },
  signOutBtn: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(245,236,215,0.2)',
    borderRadius: 4,
    padding: '8px 16px',
    color: 'rgba(245,236,215,0.6)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  bgSection: {
    marginBottom: 40,
  },
  sectionHeading: {
    color: '#F5ECD7',
    fontFamily: 'var(--font-raleway)',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  bgCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    maxWidth: 640,
  },
  bgPreviewWrap: {
    aspectRatio: '9 / 16',
    maxWidth: 270,
    borderRadius: 10,
    border: '1px solid rgba(245,236,215,0.12)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bgPreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  bgPreviewEmpty: {
    color: 'rgba(245,236,215,0.3)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 12,
  },
  tip: {
    maxWidth: 640,
    marginBottom: 28,
    padding: '14px 18px',
    border: '1px solid rgba(201,168,76,0.25)',
    borderRadius: 8,
    background: 'rgba(201,168,76,0.06)',
  },
  tipTitle: {
    color: '#C9A84C',
    fontFamily: 'var(--font-raleway)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  tipCopy: {
    color: 'rgba(245,236,215,0.65)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 13,
    lineHeight: 1.6,
  },
  errorText: {
    color: '#E5A15C',
    fontFamily: 'var(--font-raleway)',
    fontSize: 13,
    marginBottom: 16,
  },
};
