'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { type ImagePayload } from '@/lib/files';
import { type MenuItem, type MenuSection } from '@/lib/menu-data';
import PhotoUpload from '@/components/photo-upload';
import MenuBoard from '@/components/menu-board';
import MenuFooter from '@/components/menu-footer';

interface ItemRow {
  id: string;
  screen: number;
  section: string;
  section_order: number;
  name: string;
  description: string;
  hot_iced: string;
  price: number | null;
  image_url: string | null;
  sort_order: number;
  active: boolean;
}

const SECTION_SUGGESTIONS: Record<number, string[]> = {
  1: ['Classic', 'Originals', 'Speciality Coffee'],
  2: ['Refreshers', 'Matcha Bar', 'Speciality Milk Espresso'],
};

function formatPrice(price: number | null): string {
  return price === null ? '—' : `$${price.toFixed(2)}`;
}

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [screen, setScreen] = useState<1 | 2>(1);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [newSection, setNewSection] = useState('');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newHotIced, setNewHotIced] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newImage, setNewImage] = useState<ImagePayload | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // localStorage isn't available during the static-export server render —
    // see the Coffee Builder admin for the full rationale on this pattern.
    const stored = localStorage.getItem('menuAdminToken');
    if (!stored) {
      router.push('/admin/login');
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(stored);
  }, [router]);

  const load = useCallback(
    async (activeToken: string, activeScreen: number) => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}/menu-admin/items?screen=${activeScreen}`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        });
        if (res.status === 401) {
          localStorage.removeItem('menuAdminToken');
          router.push('/admin/login');
          return;
        }
        setItems(await res.json());
      } catch {
        setError('Could not load the menu — check your connection and try again.');
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (token) load(token, screen);
  }, [token, screen, load]);

  const sections = useMemo(() => {
    const map = new Map<string, ItemRow[]>();
    for (const item of items) {
      if (!map.has(item.section)) map.set(item.section, []);
      map.get(item.section)!.push(item);
    }
    return Array.from(map.entries());
  }, [items]);

  // What the TV actually shows: active items only, grouped the same way the
  // public screen pages do. Rendered off-screen (see exportRef below) using
  // the exact same MenuBoard/MenuFooter components, so the exported image
  // matches the live screen exactly rather than being a lookalike.
  const exportSections = useMemo<MenuSection[]>(() => {
    const map = new Map<string, MenuItem[]>();
    for (const row of items) {
      if (!row.active) continue;
      const item: MenuItem = {
        id: row.id,
        screen: row.screen,
        section: row.section,
        sectionOrder: row.section_order,
        name: row.name,
        description: row.description,
        hotIced: row.hot_iced,
        price: row.price,
        imageUrl: row.image_url,
        sortOrder: row.sort_order,
      };
      if (!map.has(row.section)) map.set(row.section, []);
      map.get(row.section)!.push(item);
    }
    return Array.from(map.entries()).map(([name, sectionItems]) => ({ name, items: sectionItems }));
  }, [items]);

  const exportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  async function handleExportImage() {
    if (!exportRef.current) return;
    setExporting(true);
    setExportError('');
    try {
      // Loaded dynamically — html2canvas touches the DOM at import time in
      // some bundles, which would break the static-export build if it were
      // a top-level import.
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#100C08',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/jpeg', 0.92);
      link.download = `18g-menu-screen-${screen}.jpg`;
      link.click();
    } catch {
      setExportError('Could not export the image. If any items have photos, the storage account may need CORS enabled for this site.');
    } finally {
      setExporting(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const section = newSection.trim();
    if (!token || !newName.trim() || !section) return;
    setCreating(true);
    try {
      const sectionItems = items.filter((i) => i.section === section);
      const sectionOrder = sectionItems[0]?.section_order ?? sections.length;
      await fetch(`${API_URL}/menu-admin/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          screen,
          section,
          sectionOrder,
          name: newName.trim(),
          description: newDescription.trim(),
          hotIced: newHotIced.trim(),
          price: newPrice.trim() === '' ? null : Number(newPrice),
          sortOrder: sectionItems.length,
          ...(newImage ? { image: newImage } : {}),
        }),
      });
      setNewName('');
      setNewDescription('');
      setNewHotIced('');
      setNewPrice('');
      setNewImage(null);
      await load(token, screen);
    } finally {
      setCreating(false);
    }
  }

  async function patchItem(id: string, patch: Record<string, unknown>) {
    if (!token) return;
    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`${API_URL}/menu-admin/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Could not save that change.');
        return;
      }
      await load(token, screen);
    } finally {
      setBusyId(null);
    }
  }

  async function deleteItem(id: string, name: string) {
    if (!token) return;
    if (!window.confirm(`Remove "${name}"? This can't be undone.`)) return;
    setBusyId(id);
    try {
      await fetch(`${API_URL}/menu-admin/items/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await load(token, screen);
    } finally {
      setBusyId(null);
    }
  }

  async function swap(sectionItems: ItemRow[], index: number, direction: -1 | 1) {
    const a = sectionItems[index];
    const b = sectionItems[index + direction];
    if (!a || !b || !token) return;
    setBusyId(a.id);
    try {
      await Promise.all([
        fetch(`${API_URL}/menu-admin/items/${a.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ sortOrder: b.sort_order }),
        }),
        fetch(`${API_URL}/menu-admin/items/${b.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ sortOrder: a.sort_order }),
        }),
      ]);
      await load(token, screen);
    } finally {
      setBusyId(null);
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
          <p style={styles.label}>MENU ADMIN</p>
          <div style={styles.divider} />
        </div>
        <button style={styles.signOutBtn} onClick={signOut}>
          Sign Out
        </button>
      </div>

      <div style={styles.tabsRow}>
        <div style={styles.tabs}>
          {[1, 2].map((s) => (
            <button
              key={s}
              style={{ ...styles.tab, ...(screen === s ? styles.tabActive : {}) }}
              onClick={() => setScreen(s as 1 | 2)}
            >
              Screen {s}
            </button>
          ))}
        </div>
        <button type="button" onClick={handleExportImage} disabled={exporting} style={styles.exportBtn}>
          {exporting ? 'Exporting…' : `⬇ Export Screen ${screen} Image`}
        </button>
      </div>
      {exportError && <p style={styles.errorText}>{exportError}</p>}

      {/* Rendered off-screen with the real MenuBoard/MenuFooter components so
          the exported JPEG is pixel-identical to the live screen — never
          shown, only captured by html2canvas above. */}
      <div style={styles.exportCanvasWrap} aria-hidden="true">
        <div ref={exportRef} style={styles.exportCanvas}>
          <MenuBoard sections={exportSections} />
          <MenuFooter />
        </div>
      </div>

      <form style={styles.addForm} onSubmit={handleCreate}>
        <div style={styles.addFormRow}>
          <input
            style={styles.addInput}
            list="section-suggestions"
            placeholder="Section (e.g. Classic)"
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
          />
          <datalist id="section-suggestions">
            {SECTION_SUGGESTIONS[screen].map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <input
            style={styles.addInput}
            placeholder="Drink name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            style={{ ...styles.addInput, maxWidth: 120 }}
            placeholder="Hot / Iced"
            value={newHotIced}
            onChange={(e) => setNewHotIced(e.target.value)}
          />
          <input
            style={{ ...styles.addInput, maxWidth: 100 }}
            type="number"
            step="0.01"
            placeholder="Price"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
          />
        </div>
        <div style={styles.addFormRow}>
          <input
            style={{ ...styles.addInput, flex: 2 }}
            placeholder="Short description (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
          <button type="submit" style={styles.addBtn} disabled={creating || !newName.trim() || !newSection.trim()}>
            {creating ? 'Adding…' : 'Add'}
          </button>
        </div>
        <PhotoUpload
          imageUrl={newImage ? `data:${newImage.contentType};base64,${newImage.data}` : null}
          onUpload={setNewImage}
          onError={setError}
        />
      </form>

      {error && <p style={styles.errorText}>{error}</p>}

      {loading ? (
        <p style={styles.emptyText}>Loading…</p>
      ) : sections.length === 0 ? (
        <p style={styles.emptyText}>Nothing on Screen {screen} yet — add the first item above.</p>
      ) : (
        <div style={styles.sectionList}>
          {sections.map(([sectionName, sectionItems]) => (
            <div key={sectionName}>
              <p style={styles.sectionHeading}>{sectionName}</p>
              <div style={styles.list}>
                {sectionItems.map((item, i) => (
                  <div key={item.id} style={{ ...styles.row, opacity: item.active ? 1 : 0.45 }}>
                    <div style={styles.reorder}>
                      <button
                        style={styles.reorderBtn}
                        disabled={i === 0 || busyId === item.id}
                        onClick={() => swap(sectionItems, i, -1)}
                        aria-label="Move up"
                      >
                        ↑
                      </button>
                      <button
                        style={styles.reorderBtn}
                        disabled={i === sectionItems.length - 1 || busyId === item.id}
                        onClick={() => swap(sectionItems, i, 1)}
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                    </div>

                    <PhotoUpload
                      imageUrl={item.image_url}
                      busy={busyId === item.id}
                      onUpload={(image) => patchItem(item.id, { image })}
                      onError={setError}
                    />

                    <div style={styles.rowFields}>
                      <input
                        style={styles.rowInput}
                        defaultValue={item.name}
                        onBlur={(e) => e.target.value.trim() && e.target.value !== item.name && patchItem(item.id, { name: e.target.value.trim() })}
                      />
                      <input
                        style={{ ...styles.rowInput, ...styles.rowDescription }}
                        defaultValue={item.description}
                        onBlur={(e) => e.target.value !== item.description && patchItem(item.id, { description: e.target.value })}
                      />
                      <input
                        style={{ ...styles.rowInput, ...styles.rowHotIced }}
                        defaultValue={item.hot_iced}
                        placeholder="Hot / Iced"
                        onBlur={(e) => e.target.value !== item.hot_iced && patchItem(item.id, { hotIced: e.target.value })}
                      />
                      <input
                        style={{ ...styles.rowInput, ...styles.rowPrice }}
                        type="number"
                        step="0.01"
                        defaultValue={item.price ?? ''}
                        placeholder={formatPrice(null)}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          const next = v === '' ? null : Number(v);
                          if (next !== item.price) patchItem(item.id, { price: next });
                        }}
                      />
                    </div>

                    <label style={styles.activeToggle}>
                      <input
                        type="checkbox"
                        checked={item.active}
                        onChange={(e) => patchItem(item.id, { active: e.target.checked })}
                      />
                      Active
                    </label>

                    <button style={styles.deleteBtn} onClick={() => deleteItem(item.id, item.name)} disabled={busyId === item.id}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
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
    marginBottom: 32,
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
  tabsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  tabs: {
    display: 'flex',
    gap: 12,
  },
  exportBtn: {
    backgroundColor: 'rgba(201,168,76,0.12)',
    border: '1px solid rgba(201,168,76,0.4)',
    borderRadius: 6,
    padding: '8px 16px',
    color: '#C9A84C',
    fontFamily: 'var(--font-raleway)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.5px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  exportCanvasWrap: {
    position: 'absolute',
    left: -9999,
    top: 0,
    overflow: 'hidden',
    width: 1,
    height: 1,
  },
  exportCanvas: {
    width: 900,
    backgroundColor: '#100C08',
    padding: 'clamp(28px, 4vw, 56px)',
  },
  tab: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(201,168,76,0.25)',
    borderRadius: 4,
    padding: '8px 18px',
    color: 'rgba(245,236,215,0.5)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  tabActive: {
    borderColor: '#C9A84C',
    color: '#C9A84C',
    backgroundColor: 'rgba(201,168,76,0.08)',
  },
  addForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 24,
    maxWidth: 900,
  },
  addFormRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  },
  addInput: {
    flex: 1,
    minWidth: 140,
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(201,168,76,0.25)',
    borderRadius: 6,
    padding: '10px 14px',
    color: '#F5ECD7',
    fontFamily: 'var(--font-raleway)',
    fontSize: 14,
    outline: 'none',
  },
  addBtn: {
    backgroundColor: 'rgba(201,168,76,0.12)',
    border: '1px solid rgba(201,168,76,0.5)',
    borderRadius: 6,
    padding: '10px 22px',
    color: '#C9A84C',
    fontFamily: 'var(--font-raleway)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    cursor: 'pointer',
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
  sectionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
    maxWidth: 900,
  },
  sectionHeading: {
    color: '#C9A84C',
    fontFamily: 'var(--font-raleway)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    border: '1px solid rgba(245,236,215,0.12)',
    borderRadius: 8,
    padding: '12px 16px',
  },
  reorder: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  reorderBtn: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(245,236,215,0.2)',
    borderRadius: 4,
    width: 26,
    height: 22,
    color: 'rgba(245,236,215,0.6)',
    cursor: 'pointer',
    fontSize: 12,
    lineHeight: 1,
  },
  rowFields: {
    flex: 1,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    minWidth: 0,
  },
  rowInput: {
    flex: 1,
    minWidth: 120,
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    borderRadius: 4,
    padding: '6px 8px',
    color: '#F5ECD7',
    fontFamily: 'var(--font-raleway)',
    fontSize: 14,
    fontWeight: 600,
  },
  rowDescription: {
    color: 'rgba(245,236,215,0.55)',
    fontWeight: 400,
    fontSize: 13,
    flex: 2,
  },
  rowHotIced: {
    flex: '0 1 100px',
    minWidth: 90,
    fontSize: 12,
  },
  rowPrice: {
    flex: '0 1 90px',
    minWidth: 80,
    fontVariantNumeric: 'tabular-nums',
  },
  activeToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: 'rgba(245,236,215,0.55)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(229,161,92,0.4)',
    borderRadius: 4,
    padding: '6px 14px',
    color: '#E5A15C',
    fontFamily: 'var(--font-raleway)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
};
