'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';

interface ItemRow {
  id: string;
  screen: number;
  section: string;
  name: string;
  price: number | null;
  food_cost: number | null;
  other_cost: number | null;
}

function money(v: number | null): string {
  return v === null ? '—' : `$${v.toFixed(2)}`;
}

function totalCost(row: ItemRow): number | null {
  if (row.food_cost === null && row.other_cost === null) return null;
  return (row.food_cost ?? 0) + (row.other_cost ?? 0);
}

function costPercent(row: ItemRow): string {
  const cost = totalCost(row);
  if (cost === null || !row.price) return '—';
  return `${((cost / row.price) * 100).toFixed(0)}%`;
}

function margin(row: ItemRow): string {
  const cost = totalCost(row);
  if (cost === null || row.price === null) return '—';
  return money(row.price - cost);
}

export default function CostingPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
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
        const res = await fetch(`${API_URL}/menu-admin/items`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        });
        if (res.status === 401) {
          localStorage.removeItem('menuAdminToken');
          router.push('/admin/login');
          return;
        }
        setItems(await res.json());
      } catch {
        setError('Could not load items — check your connection and try again.');
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

  async function patchCost(id: string, patch: Record<string, unknown>) {
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
      await load(token);
    } finally {
      setBusyId(null);
    }
  }

  function signOut() {
    localStorage.removeItem('menuAdminToken');
    router.push('/admin/login');
  }

  const sections = useMemo(() => {
    const map = new Map<string, ItemRow[]>();
    for (const item of items) {
      const key = `Screen ${item.screen} — ${item.section}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries());
  }, [items]);

  const avgCostPercent = useMemo(() => {
    const withBoth = items.filter((i) => totalCost(i) !== null && i.price);
    if (withBoth.length === 0) return null;
    const avg = withBoth.reduce((sum, i) => sum + (totalCost(i)! / i.price!) * 100, 0) / withBoth.length;
    return avg.toFixed(0);
  }, [items]);

  if (!token) return null;

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.label}>MENU ADMIN — COSTING</p>
          <div style={styles.divider} />
          <nav style={styles.nav}>
            <Link href="/admin" style={styles.navLink}>
              Menu
            </Link>
            <span style={styles.navLinkActive}>Costing</span>
          </nav>
        </div>
        <button style={styles.signOutBtn} onClick={signOut}>
          Sign Out
        </button>
      </div>

      {error && <p style={styles.errorText}>{error}</p>}

      {avgCostPercent && (
        <p style={styles.summary}>
          Average cost across priced items: <span style={styles.summaryValue}>{avgCostPercent}%</span> of menu price
        </p>
      )}

      {loading ? (
        <p style={styles.emptyText}>Loading…</p>
      ) : items.length === 0 ? (
        <p style={styles.emptyText}>No menu items yet — add some on the Menu page first.</p>
      ) : (
        <div style={styles.sectionList}>
          {sections.map(([sectionLabel, sectionItems]) => (
            <div key={sectionLabel}>
              <p style={styles.sectionHeading}>{sectionLabel}</p>
              <div className="table-scroll" style={styles.tableScroll}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Item</th>
                      <th style={styles.th}>Price</th>
                      <th style={styles.th}>Food Cost</th>
                      <th style={styles.th}>Other Cost</th>
                      <th style={styles.th}>Total Cost</th>
                      <th style={styles.th}>Cost %</th>
                      <th style={styles.th}>Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionItems.map((item) => (
                      <tr key={item.id} style={{ opacity: busyId === item.id ? 0.5 : 1 }}>
                        <td style={styles.tdName}>{item.name}</td>
                        <td style={styles.td}>{money(item.price)}</td>
                        <td style={styles.td}>
                          <input
                            type="number"
                            step="0.01"
                            style={styles.input}
                            defaultValue={item.food_cost ?? ''}
                            placeholder="—"
                            onBlur={(e) => {
                              const v = e.target.value.trim();
                              const next = v === '' ? null : Number(v);
                              if (next !== item.food_cost) patchCost(item.id, { foodCost: next });
                            }}
                          />
                        </td>
                        <td style={styles.td}>
                          <input
                            type="number"
                            step="0.01"
                            style={styles.input}
                            defaultValue={item.other_cost ?? ''}
                            placeholder="—"
                            onBlur={(e) => {
                              const v = e.target.value.trim();
                              const next = v === '' ? null : Number(v);
                              if (next !== item.other_cost) patchCost(item.id, { otherCost: next });
                            }}
                          />
                        </td>
                        <td style={styles.tdComputed}>{money(totalCost(item))}</td>
                        <td style={styles.tdComputed}>{costPercent(item)}</td>
                        <td style={styles.tdComputed}>{margin(item)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
  summary: {
    marginBottom: 20,
    color: 'rgba(245,236,215,0.6)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 13,
  },
  summaryValue: {
    color: '#C9A84C',
    fontWeight: 700,
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
    gap: 32,
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
  tableScroll: {
    overflowX: 'auto',
    border: '1px solid rgba(245,236,215,0.12)',
    borderRadius: 8,
  },
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    minWidth: 680,
  },
  th: {
    textAlign: 'left',
    padding: '10px 14px',
    fontFamily: 'var(--font-raleway)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    color: 'rgba(245,236,215,0.45)',
    borderBottom: '1px solid rgba(245,236,215,0.12)',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '8px 14px',
    fontFamily: 'var(--font-raleway)',
    fontSize: 13,
    color: '#F5ECD7',
    borderBottom: '1px solid rgba(245,236,215,0.08)',
    fontVariantNumeric: 'tabular-nums',
  },
  tdName: {
    padding: '8px 14px',
    fontFamily: 'var(--font-raleway)',
    fontSize: 13,
    fontWeight: 600,
    color: '#F5ECD7',
    borderBottom: '1px solid rgba(245,236,215,0.08)',
    whiteSpace: 'nowrap',
  },
  tdComputed: {
    padding: '8px 14px',
    fontFamily: 'var(--font-raleway)',
    fontSize: 13,
    fontWeight: 700,
    color: '#C9A84C',
    borderBottom: '1px solid rgba(245,236,215,0.08)',
    fontVariantNumeric: 'tabular-nums',
  },
  input: {
    width: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(201,168,76,0.25)',
    borderRadius: 4,
    padding: '5px 8px',
    color: '#F5ECD7',
    fontFamily: 'var(--font-raleway)',
    fontSize: 13,
    fontVariantNumeric: 'tabular-nums',
  },
};
