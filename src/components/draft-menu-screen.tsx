'use client';

import { useEffect, useState } from 'react';
import { fetchMenu, formatPrice, groupByScreen, type MenuItem, type MenuSection } from '@/lib/menu-data';

const POLL_INTERVAL_MS = 120_000;

// Simple line-art icons in the spirit of the reference PDF's small section
// glyphs (flask, cup, whisk, etc.) — hand-drawn outlines, not emoji.
type IconKey = 'flask' | 'cup' | 'pitcher' | 'whisk' | 'tea' | 'glass' | 'croissant' | 'cake' | 'sandwich' | 'dot';

function Icon({ name, style }: { name: IconKey; style?: React.CSSProperties }) {
  const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const paths: Record<IconKey, React.ReactNode> = {
    flask: (
      <>
        <path d="M9 2h6M10 2v6l-5 10a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-10V2" />
        <path d="M7.5 15h9" />
      </>
    ),
    cup: (
      <>
        <path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
        <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" />
        <path d="M4 8V5h13v3" />
      </>
    ),
    pitcher: <path d="M6 3h8l-1 4h2l2 3-3 11H8L5 10l2-3h2L6 3Z" />,
    whisk: (
      <>
        <path d="M4 12c0 4 3.5 8 8 8s8-4 8-8" />
        <path d="M12 2v6M9 3l1 5M15 3l-1 5" />
      </>
    ),
    tea: (
      <>
        <path d="M5 10h11a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3H8a4 4 0 0 1-4-4v-3Z" />
        <path d="M5 11H2M9 6v4" />
        <path d="M18 11l3-1-1 4" />
      </>
    ),
    glass: (
      <>
        <path d="M7 4h10l-1.3 15.2a2 2 0 0 1-2 1.8h-3.4a2 2 0 0 1-2-1.8L7 4Z" />
        <path d="M14 2l1 6" />
      </>
    ),
    croissant: <path d="M4 15c2-7 8-11 14-10-1 1-2 2-2 4 2 0 3 1 4 2-1 3-4 5-7 5-1 2-2 3-4 3-3 0-5-2-5-4Z" />,
    cake: (
      <>
        <path d="M4 20h16M6 20l1-9 5-6 5 6 1 9" />
        <path d="M9 11h6" />
      </>
    ),
    sandwich: (
      <>
        <path d="M3 11h18l-2 7a2 2 0 0 1-2 1.6H7A2 2 0 0 1 5 18l-2-7Z" />
        <path d="M3 11c1-4 4-7 9-7s8 3 9 7" />
      </>
    ),
    dot: <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />,
  };
  return (
    <svg {...common} width="1em" height="1em" style={style}>
      {paths[name]}
    </svg>
  );
}

// Per-screen layout: which section is the big "featured" hero box (if any),
// and the display order / icon / numbering for the rest. Sections not
// listed here still render, appended at the end in whatever order the API
// returned them, so nothing from the live data ever silently disappears.
interface ScreenConfig {
  pageLabel: string;
  title: string;
  hero: { name: string; tagline: string } | null;
  order: { name: string; icon: IconKey }[];
}

const SCREEN_CONFIG: Record<number, ScreenConfig> = {
  1: {
    pageLabel: 'MENU — 01 / 02',
    title: 'COFFEE',
    hero: { name: 'The Lab Experience', tagline: 'FEATURED · SLOW BREWS, ESPRESSO & MATCHA' },
    order: [
      { name: 'Classic', icon: 'cup' },
      { name: 'Speciality Espresso', icon: 'pitcher' },
    ],
  },
  2: {
    pageLabel: 'MENU — 02 / 02',
    title: 'BEYOND COFFEE',
    hero: null,
    order: [
      { name: 'Matcha Bar', icon: 'whisk' },
      { name: 'Chai', icon: 'tea' },
      { name: 'Refreshers', icon: 'glass' },
      { name: 'Viennoiserie', icon: 'croissant' },
      { name: 'Patisserie', icon: 'cake' },
      { name: 'Deli', icon: 'sandwich' },
    ],
  },
};

// Display-only renames — the underlying DB section name (used for data
// lookups above) stays "Matcha Bar" so the live screens are unaffected.
const DISPLAY_NAME: Record<string, string> = {
  'Matcha Bar': 'Ceremonial Matcha',
};

// Draft-only presentation overrides for The Lab Experience: the live data
// has every item as iced/one-size, but this design calls for every item to
// show M/L except Espressotini (one size), and Aeropress specifically as
// hot. Overriding here (not in the DB) keeps the live screens untouched.
function labOverrides(item: MenuItem): { hot?: boolean; iced?: boolean; sizes?: string[] } {
  if (item.name === 'Espressotini') return { sizes: ['ONE SIZE'] };
  if (item.name === 'Aeropress') return { hot: true, iced: false, sizes: ['M', 'L'] };
  return { sizes: ['M', 'L'] };
}

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

function DrinkRow({ item, dark, overrides }: { item: MenuItem; dark?: boolean; overrides?: { hot?: boolean; iced?: boolean; sizes?: string[] } }) {
  const showHot = overrides?.hot ?? Boolean(item.hotSize);
  const showIced = overrides?.iced ?? Boolean(item.coldSize);
  const sizes = overrides?.sizes ?? sizeLabels(item.hotSize || item.coldSize);
  return (
    <div style={styles.row}>
      <div style={styles.rowLine}>
        <span style={dark ? styles.rowNameDark : styles.rowName}>{item.name}</span>
        {showHot && <span style={{ ...styles.pill, ...styles.pillHot }}>HOT</span>}
        {showIced && <span style={{ ...styles.pill, ...styles.pillIced }}>ICED</span>}
        <span style={dark ? styles.leaderDark : styles.leader} />
        {sizes.map((s) => (
          <span key={s} style={dark ? styles.sizeBoxDark : styles.sizeBox}>
            {s}
          </span>
        ))}
        <span style={dark ? styles.rowPriceDark : styles.rowPrice}>{formatPrice(item.price)}</span>
      </div>
      {item.description && <p style={dark ? styles.rowDescDark : styles.rowDesc}>{item.description}</p>}
    </div>
  );
}

function FoodRow({ item, dark }: { item: MenuItem; dark?: boolean }) {
  return (
    <div style={styles.row}>
      <div style={styles.rowLine}>
        <span style={dark ? styles.rowNameDark : styles.rowName}>{item.name}</span>
        <span style={dark ? styles.leaderDark : styles.leader} />
        <span style={dark ? styles.rowPriceDark : styles.rowPrice}>{formatPrice(item.price)}</span>
      </div>
      {item.description && <p style={dark ? styles.rowDescDark : styles.rowDesc}>{item.description}</p>}
    </div>
  );
}

function TwoColGrid({
  items,
  food,
  dark,
  getOverrides,
}: {
  items: MenuItem[];
  food?: boolean;
  dark?: boolean;
  getOverrides?: (item: MenuItem) => { hot?: boolean; iced?: boolean; sizes?: string[] } | undefined;
}) {
  const splitAt = Math.ceil(items.length / 2);
  const cols = [items.slice(0, splitAt), items.slice(splitAt)];
  return (
    <div style={styles.grid}>
      {cols.map(
        (col, i) =>
          col.length > 0 && (
            <div key={i} style={styles.gridCol}>
              {col.map((item) =>
                food ? (
                  <FoodRow key={item.id} item={item} dark={dark} />
                ) : (
                  <DrinkRow key={item.id} item={item} dark={dark} overrides={getOverrides?.(item)} />
                )
              )}
            </div>
          )
      )}
    </div>
  );
}

function HeroSection({ section, index, tagline }: { section: MenuSection; index: number; tagline: string }) {
  return (
    <div style={styles.hero}>
      <p style={styles.heroKicker}>
        {String(index).padStart(2, '0')} — {tagline}
      </p>
      <div style={styles.heroHead}>
        <h2 style={styles.heroTitle}>{section.name}</h2>
        <div style={styles.heroNote}>
          <p style={styles.heroNoteTitle}>Choose your beans</p>
          <p style={styles.heroNoteBody}>Any drink here can be made with the beans of your choice.</p>
        </div>
      </div>
      <TwoColGrid items={section.items} dark getOverrides={labOverrides} />
    </div>
  );
}

function NumberedSection({ section, index, icon, food }: { section: MenuSection; index: number; icon: IconKey; food: boolean }) {
  return (
    <section style={styles.section}>
      <div style={styles.sectionHead}>
        <span style={styles.sectionNum}>{String(index).padStart(2, '0')}</span>
        <h2 style={styles.sectionTitle}>{DISPLAY_NAME[section.name] ?? section.name}</h2>
        <div style={styles.sectionRule} />
        <Icon name={icon} style={styles.sectionIcon} />
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
  const hero = config.hero ? byName.get(config.hero.name) : undefined;
  const orderedNames = new Set(config.order.map((o) => o.name).concat(config.hero ? [config.hero.name] : []));
  const rest = config.order.map((o) => ({ section: byName.get(o.name), icon: o.icon })).filter((r) => r.section) as {
    section: MenuSection;
    icon: IconKey;
  }[];
  // Anything the API returns that isn't explicitly placed above still shows,
  // using a generic icon, instead of silently vanishing from the draft.
  const extra = sections.filter((s) => !orderedNames.has(s.name)).map((s) => ({ section: s, icon: 'dot' as IconKey }));
  const allSections = [...rest, ...extra];

  return (
    <main style={styles.page}>
      <div style={styles.headerBar}>
        <div>
          <p style={styles.pageLabel}>{config.pageLabel}</p>
          <h1 style={styles.pageTitle}>{config.title}</h1>
        </div>
      </div>

      <div style={styles.body}>
        {!loaded ? (
          <p style={styles.emptyText}>Loading…</p>
        ) : (
          <>
            {hero && <HeroSection section={hero} index={1} tagline={config.hero!.tagline} />}
            {allSections.map((r, i) => (
              <NumberedSection
                key={r.section.name}
                section={r.section}
                index={i + (hero ? 2 : 1)}
                icon={r.icon}
                food={!r.section.items.some((it) => it.hotSize || it.coldSize)}
              />
            ))}
            <AddOns />
            <GoodToKnow />
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
    alignItems: 'center',
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
    color: MAROON,
    opacity: 0.6,
    flexShrink: 0,
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
  rowNameDark: {
    color: CREAM,
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
  leaderDark: {
    flex: 1,
    height: 0,
    borderBottom: `2px dotted rgba(243,236,222,0.3)`,
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
  sizeBoxDark: {
    border: `1.5px solid rgba(243,236,222,0.4)`,
    borderRadius: 5,
    padding: '2px 8px',
    fontSize: 13,
    fontWeight: 700,
    color: CREAM,
    whiteSpace: 'nowrap',
  },
  rowPrice: {
    color: MAROON,
    fontSize: 20,
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
  rowPriceDark: {
    color: '#E0A84E',
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
  rowDescDark: {
    color: 'rgba(243,236,222,0.65)',
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
