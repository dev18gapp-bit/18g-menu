'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import { type ImagePayload } from '@/lib/files';
import PhotoUpload from '@/components/photo-upload';

interface ItemRow {
  screen: number;
  section: string;
  section_order: number;
}

interface GraphicRow {
  slot: string;
  image_url: string | null;
}

export default function GraphicsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [sectionSlots, setSectionSlots] = useState<string[]>([]);
  const [graphics, setGraphics] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
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
      setLoading(true);
      setError('');
      try {
        const [itemsRes, graphicsRes] = await Promise.all([
          fetch(`${API_URL}/menu-admin/items`, { headers: { Authorization: `Bearer ${activeToken}` } }),
          fetch(`${API_URL}/menu-admin/graphics`, { headers: { Authorization: `Bearer ${activeToken}` } }),
        ]);
        if (itemsRes.status === 401 || graphicsRes.status === 401) {
          localStorage.removeItem('menuAdminToken');
          router.push('/admin/login');
          return;
        }

        const items: ItemRow[] = await itemsRes.json();
        const seen = new Map<string, number>(); // section -> (screen * 1000 + section_order), for stable ordering
        for (const item of items) {
          const key = item.section;
          const order = item.screen * 1000 + item.section_order;
          if (!seen.has(key) || seen.get(key)! > order) seen.set(key, order);
        }
        const sections = Array.from(seen.entries())
          .sort((a, b) => a[1] - b[1])
          .map(([name]) => name);
        setSectionSlots(sections);

        const graphicsList: GraphicRow[] = await graphicsRes.json();
        const map: Record<string, string> = {};
        for (const g of graphicsList) {
          if (g.image_url) map[g.slot] = g.image_url;
        }
        setGraphics(map);
      } catch {
        setError('Could not load graphics — check your connection and try again.');
      } finally {
        setLoading(false);
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

  const slots = useMemo(() => [{ id: 'header', label: 'Header (shown once, top of both screens)' }, ...sectionSlots.map((s) => ({ id: s, label: s }))], [sectionSlots]);

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

      <div style={styles.tip}>
        <p style={styles.tipTitle}>Designing these in Canva</p>
        <p style={styles.tipCopy}>
          Roughly square, ~400×400px. If you&apos;re not on Canva Pro, transparent PNG export isn&apos;t available — instead,
          design the icon in gold/cream line art on a <b>solid black</b> background and export as a normal PNG. The
          screens blend the black away automatically, so it looks the same either way.
        </p>
      </div>

      {error && <p style={styles.errorText}>{error}</p>}

      {loading ? (
        <p style={styles.emptyText}>Loading…</p>
      ) : (
        <div style={styles.grid}>
          {slots.map((slot) => (
            <div key={slot.id} style={styles.card}>
              <p style={styles.cardLabel}>{slot.label}</p>
              <div style={styles.previewWrap}>
                {graphics[slot.id] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={graphics[slot.id]} alt="" style={styles.preview} />
                )}
              </div>
              <PhotoUpload
                imageUrl={graphics[slot.id]}
                busy={busySlot === slot.id}
                size={56}
                onUpload={(image) => uploadGraphic(slot.id, image)}
                onError={setError}
              />
            </div>
          ))}
        </div>
      )}
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
  emptyText: {
    color: 'rgba(245,236,215,0.4)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 14,
  },
  errorText: {
    color: '#E5A15C',
    fontFamily: 'var(--font-raleway)',
    fontSize: 13,
    marginBottom: 16,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
    maxWidth: 960,
  },
  card: {
    border: '1px solid rgba(245,236,215,0.12)',
    borderRadius: 10,
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  cardLabel: {
    color: '#F5ECD7',
    fontFamily: 'var(--font-raleway)',
    fontSize: 13,
    fontWeight: 700,
  },
  previewWrap: {
    minHeight: 4,
  },
  preview: {
    maxWidth: 120,
    maxHeight: 120,
    objectFit: 'contain',
  },
};
