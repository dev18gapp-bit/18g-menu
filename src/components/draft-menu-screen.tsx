'use client';

import { useEffect, useState } from 'react';
import { fetchMenu, formatPrice, groupByScreen, type MenuItem, type MenuSection } from '@/lib/menu-data';

const POLL_INTERVAL_MS = 120_000;

// Per-screen layout: which section is the big "featured" hero box (if any),
// and the display order / icon / numbering for the rest. Sections not
// listed here still render, appended at the end in whatever order the API
// returned them, so nothing from the live data ever silently disappears.
interface ScreenConfig {
  pageLabel: string;
  title: string;
  hero: string | null;
  order: { name: string; icon: string }[];
}

const SCREEN_CONFIG: Record<number, ScreenConfig> = {
  1: {
    pageLabel: 'MENU — 01 / 02',
    title: 'COFFEE',
    hero: 'The Lab Experience',
    order: [
      { name: 'Classic', icon: '☕' },
      { name: 'Speciality Espresso', icon: '🥛' },
    ],
  },
  2: {
    pageLabel: 'MENU — 02 / 02',
    title: 'BEYOND COFFEE',
    hero: null,
    order: [
      { name: 'Matcha Bar', icon: '🍵' },
      { name: 'Chai', icon: '🫖' },
      { name: 'Refreshers', icon: '🍹' },
      { name: 'Viennoiserie', icon: '🥐' },
      { name: 'Patisserie', icon: '🍰' },
      { name: 'Deli', icon: '🥪' },
    ],
  },
};

const ADD_ONS = ['Go large — $1', 'Add a double shot — $3', 'Alternative milk — $0.50', 'Add foam — $1'];

// "12/16 oz" -> ['M','L']; "8/12/16 oz" -> ['S','M','L']; "5 oz" -> ['ONE SIZE']
function sizeLabels(value: string): string[] {
  const segments = value
    .replace(/oz/gi, '')
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean);
  if (segments.length <= 1) return ['ONE SIZE'];
  if (segments.length === 2) return ['M', 'L'];
  return ['S', 'M', 'L'];
}

function DrinkRow({ item }: { item: MenuItem }) {
  const sizes = sizeLabels(item.hotSize || item.coldSize);
  return (
    <div style={styles.row}>
      <div style={styles.rowLine}>
        <span style={styles.rowName}>{item.name}</span>
        {item.hotSize && <span style={{ ...styles.pill, ...styles.pillHot }}>HOT</span>}
        {item.coldSize && <span style={{ ...styles.pill, ...styles.pillIced }}>ICED</span>}
        <span style={styles.leader} />
        {sizes.map((s) => (
          <span key={s} style={styles.sizeBox}>
            {s}
          </span>
        ))}
        <span style={styles.rowPrice}>{formatPrice(item.price)}</span>
      </div>
      {item.description && <p style={styles.rowDesc}>{item.description}</p>}
    </div>
  );
}

function FoodRow({ item }: { item: MenuItem }) {
  return (
    <div style={styles.row}>
      <div style={styles.rowLine}>
        <span style={styles.rowName}>{item.name}</span>
        <span style={styles.leader} />
        <span style={styles.rowPrice}>{formatPrice(item.price)}</span>
      </div>
      {item.description && <p style={styles.rowDesc}>{item.description}</p>}
    </div>
  );
}

function TwoColGrid({ items, food }: { items: MenuItem[]; food?: boolean }) {
  const splitAt = Math.ceil(items.length / 2);
  const cols = [items.slice(0, splitAt), items.slice(splitAt)];
  return (
    <div style={styles.grid}>
      {cols.map(
        (col, i) =>
          col.length > 0 && (
            <div key={i} style={styles.gridCol}>
              {col.map((item) => (food ? <FoodRow key={item.id} item={item} /> : <DrinkRow key={item.id} item={item} />))}
            </div>
          )
      )}
    </div>
  );
}

function HeroSection({ section, index }: { section: MenuSection; index: number }) {
  return (
    <div style={styles.hero}>
      <p style={styles.heroKicker}>
        {String(index).padStart(2, '0')} — FEATURED · {section.name.toUpperCase()}
      </p>
      <div style={styles.heroHead}>
        <h2 style={styles.heroTitle}>{section.name}</h2>
        <div style={styles.heroNote}>
          <p style={styles.heroNoteTitle}>Choose your beans</p>
          <p style={styles.heroNoteBody}>Any drink here can be made with the beans of your choice.</p>
        </div>
      </div>
      <TwoColGrid items={section.items} />
    </div>
  );
}

function NumberedSection({ section, index, icon, food }: { section: MenuSection; index: number; icon: string; food: boolean }) {
  return (
    <section style={styles.section}>
      <div style={styles.sectionHead}>
        <span style={styles.sectionNum}>{String(index).padStart(2, '0')}</span>
        <h2 style={styles.sectionTitle}>{section.name}</h2>
        <div style={styles.sectionRule} />
        <span style={styles.sectionIcon}>{icon}</span>
      </div>
      <TwoColGrid items={section.items} food={food} />
    </section>
  );
}

function GoodToKnow() {
  return (
    <div style={styles.gtk}>
      <p style={styles.gtkTitle}>Good to know</p>
      <div style={styles.gtkRow}>
        <span style={styles.gtkKey}>M · Medium</span>
        <span>12 oz hot · 16 oz iced</span>
      </div>
      <div style={styles.gtkRow}>
        <span style={styles.gtkKey}>L · Large</span>
        <span>16 oz hot · 20 oz iced</span>
      </div>
    </div>
  );
}

function AddOns() {
  return (
    <section style={styles.section}>
      <div style={styles.sectionHead}>
        <h2 style={styles.sectionTitle}>Add-Ons</h2>
        <div style={styles.sectionRule} />
      </div>
      <div style={styles.chips}>
        {ADD_ONS.map((a) => (
          <span key={a} style={styles.chip}>
            {a}
          </span>
        ))}
      </div>
    </section>
  );
}

export default function DraftMenuScreen({ screen }: { screen: 1 | 2 }) {
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [loaded, setLoaded] = useState(false);
  const config = SCREEN_CONFIG[screen];

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

  const byName = new Map(sections.map((s) => [s.name, s]));
  const hero = config.hero ? byName.get(config.hero) : undefined;
  const orderedNames = new Set(config.order.map((o) => o.name).concat(config.hero ? [config.hero] : []));
  const rest = config.order.map((o) => ({ section: byName.get(o.name), icon: o.icon })).filter((r) => r.section) as {
    section: MenuSection;
    icon: string;
  }[];
  // Anything the API returns that isn't explicitly placed above still shows,
  // using a generic icon, instead of silently vanishing from the draft.
  const extra = sections.filter((s) => !orderedNames.has(s.name)).map((s) => ({ section: s, icon: '•' }));
  const allSections = [...rest, ...extra];

  return (
    <main style={styles.page}>
      <div style={styles.headerBar}>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.jpg" alt="" style={styles.headerLogo} />
        </div>
        <div style={styles.headerRight}>
          <p style={styles.pageLabel}>{config.pageLabel}</p>
          <h1 style={styles.pageTitle}>{config.title}</h1>
        </div>
      </div>

      <div style={styles.body}>
        {!loaded ? (
          <p style={styles.emptyText}>Loading…</p>
        ) : (
          <>
            {hero && <HeroSection section={hero} index={1} />}
            {allSections.map((r, i) => (
              <NumberedSection
                key={r.section.name}
                section={r.section}
                index={i + (hero ? 2 : 1)}
                icon={r.icon}
                food={!r.section.items.some((it) => it.hotSize || it.coldSize)}
              />
            ))}
            {screen === 2 && <AddOns />}
            {screen === 2 && <GoodToKnow />}
          </>
        )}
      </div>

      <div style={styles.footerBar}>
        <span>Ask your barista about milk options</span>
        <span>18g Coffee &amp; Roastery</span>
      </div>
    </main>
  );
}

const MAROON = '#8B4238';
const MAROON_DARK = '#6E342C';
const CREAM = '#F3ECDE';
const INK = '#2A1E17';

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    width: '100%',
    backgroundColor: CREAM,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'var(--font-menu)',
  },
  headerBar: {
    backgroundColor: MAROON,
    padding: 'clamp(20px, 3vw, 36px) clamp(24px, 4vw, 48px)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLogo: {
    height: 56,
    width: 'auto',
    borderRadius: 6,
    filter: 'brightness(0) invert(1)',
  },
  headerRight: {
    textAlign: 'right',
  },
  pageLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '3px',
    margin: 0,
  },
  pageTitle: {
    color: '#fff',
    fontSize: 'clamp(40px, 6vw, 64px)',
    fontWeight: 800,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    margin: 0,
  },
  body: {
    flex: 1,
    padding: 'clamp(24px, 4vw, 48px)',
    display: 'flex',
    flexDirection: 'column',
    gap: 40,
    maxWidth: 1300,
    width: '100%',
    marginInline: 'auto',
  },
  emptyText: {
    color: 'rgba(42,30,23,0.5)',
    fontSize: 24,
  },
  hero: {
    backgroundColor: '#3A281F',
    borderRadius: 14,
    border: `1px solid rgba(243,236,222,0.25)`,
    padding: 'clamp(20px, 3vw, 36px)',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  heroKicker: {
    color: 'rgba(243,236,222,0.6)',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '2px',
    margin: 0,
  },
  heroHead: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  heroTitle: {
    color: CREAM,
    fontSize: 'clamp(36px, 5vw, 56px)',
    fontWeight: 800,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    margin: 0,
  },
  heroNote: {
    border: `1px solid rgba(243,236,222,0.3)`,
    borderRadius: 8,
    padding: '10px 16px',
    maxWidth: 360,
  },
  heroNoteTitle: {
    color: '#E0A84E',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '1.5px',
    margin: '0 0 4px',
  },
  heroNoteBody: {
    color: 'rgba(243,236,222,0.8)',
    fontSize: 14,
    lineHeight: 1.4,
    margin: 0,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  sectionHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  sectionNum: {
    color: MAROON,
    fontSize: 16,
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
  },
  sectionTitle: {
    backgroundColor: MAROON,
    color: '#fff',
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    padding: '8px 18px',
    borderRadius: 6,
    margin: 0,
    whiteSpace: 'nowrap',
  },
  sectionRule: {
    flex: 1,
    height: 0,
    borderTop: `2px solid ${MAROON_DARK}`,
    opacity: 0.4,
  },
  sectionIcon: {
    fontSize: 24,
    opacity: 0.6,
  },
  grid: {
    display: 'flex',
    gap: 36,
    flexWrap: 'wrap',
  },
  gridCol: {
    flex: '1 1 320px',
    minWidth: 280,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  rowLine: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  rowName: {
    color: INK,
    fontSize: 20,
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },
  pill: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.5px',
    padding: '3px 8px',
    borderRadius: 4,
    color: '#fff',
    whiteSpace: 'nowrap',
  },
  pillHot: {
    backgroundColor: '#B34A3C',
  },
  pillIced: {
    backgroundColor: '#3A5A74',
  },
  leader: {
    flex: 1,
    height: 0,
    borderBottom: `2px dotted rgba(42,30,23,0.3)`,
    marginTop: 8,
  },
  sizeBox: {
    border: `1.5px solid rgba(42,30,23,0.4)`,
    borderRadius: 5,
    padding: '2px 8px',
    fontSize: 13,
    fontWeight: 700,
    color: INK,
    whiteSpace: 'nowrap',
  },
  rowPrice: {
    color: MAROON,
    fontSize: 20,
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
  rowDesc: {
    color: 'rgba(42,30,23,0.6)',
    fontSize: 14,
    fontStyle: 'italic',
    margin: 0,
  },
  gtk: {
    border: `1.5px solid ${MAROON}`,
    borderRadius: 10,
    padding: '16px 22px',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  gtkTitle: {
    color: MAROON,
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    margin: '0 0 4px',
  },
  gtkRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    fontSize: 15,
    color: INK,
  },
  gtkKey: {
    fontWeight: 800,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    border: `1.5px solid rgba(42,30,23,0.4)`,
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 15,
    fontWeight: 700,
    color: INK,
  },
  footerBar: {
    backgroundColor: MAROON_DARK,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    padding: '14px clamp(24px, 4vw, 48px)',
    display: 'flex',
    justifyContent: 'space-between',
  },
};
