import { Fragment } from 'react';
import { formatPrice, type MenuItem, type MenuSection } from '@/lib/menu-data';

interface MenuBoardProps {
  sections: MenuSection[];
}

// Admin enters hot/cold price text with $ for clarity (e.g. "$6.99/$7.99"),
// but the screen itself shows plain numbers — strip it at render time rather
// than asking admins to type prices without the familiar $ sign.
const noDollar = (s: string) => s.replace(/\$/g, '');

function SizeTable({ items, showHot, showIced }: { items: MenuItem[]; showHot: boolean; showIced: boolean }) {
  // Each temperature that's actually offered gets its own Size + Price pair,
  // since hot and iced versions of the same drink are often priced
  // differently by size — a single shared price column can't represent that.
  // Size/price columns use max-content (not a fixed px guess) so a two-value
  // price like "$6.09/$6.92" widens its own column instead of overflowing
  // into the next one.
  const columns = [
    'minmax(160px, 1fr)',
    ...(showHot ? ['max-content', 'max-content'] : []),
    ...(showIced ? ['max-content', 'max-content'] : []),
  ];

  return (
    <div style={{ ...styles.table, gridTemplateColumns: columns.join(' ') }}>
      <div style={styles.headerCell} />
      {showHot && (
        <>
          <div style={styles.headerCell}>Hot</div>
          <div style={{ ...styles.headerCell, textAlign: 'right' }}>Price</div>
        </>
      )}
      {showIced && (
        <>
          <div style={styles.headerCell}>Iced</div>
          <div style={{ ...styles.headerCell, textAlign: 'right' }}>Price</div>
        </>
      )}

      {items.map((item) => (
        <Fragment key={item.id}>
          <div style={styles.nameCell}>
            {item.name}
            {item.description && <p style={styles.itemDescription}>{item.description}</p>}
          </div>
          {showHot && (
            <>
              <div style={styles.sizeCell}>{item.hotSize || '—'}</div>
              <div style={styles.priceCell}>{item.hotSize ? (item.hotPrice ? noDollar(item.hotPrice) : '—') : ''}</div>
            </>
          )}
          {showIced && (
            <>
              <div style={styles.sizeCell}>{item.coldSize || '—'}</div>
              <div style={styles.priceCell}>{item.coldSize ? (item.coldPrice ? noDollar(item.coldPrice) : '—') : ''}</div>
            </>
          )}
        </Fragment>
      ))}
    </div>
  );
}

function ItemCard({ item }: { item: MenuItem }) {
  return (
    <div style={styles.card}>
      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" style={styles.cardImage} />
      )}
      <div style={styles.cardTop}>
        <span style={styles.itemName}>
          {item.name}
          {item.hotIced && <span style={styles.badge}>{item.hotIced}</span>}
        </span>
        <span style={styles.itemPrice}>{formatPrice(item.price)}</span>
      </div>
      {item.description && <p style={styles.itemDescription}>{item.description}</p>}
    </div>
  );
}

// Two fixed columns, filled top-to-bottom (left column first, then right) —
// not a wrapping grid, which interleaves items left/right/left/right and
// breaks the reading order of a longer list.
function TwoColumnList({ items }: { items: MenuItem[] }) {
  const splitAt = Math.ceil(items.length / 2);
  const columns = [items.slice(0, splitAt), items.slice(splitAt)];

  return (
    <div style={styles.columns}>
      {columns.map(
        (column, i) =>
          column.length > 0 && (
            <div key={i} style={styles.column}>
              {column.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )
      )}
    </div>
  );
}

export default function MenuBoard({ sections }: MenuBoardProps) {
  return (
    <div style={styles.board}>
      {sections.map((section) => {
        const hasSizing = section.items.some((i) => i.hotSize || i.coldSize);
        const showHot = section.items.some((i) => i.hotSize);
        const showIced = section.items.some((i) => i.coldSize);

        return (
          <section key={section.name} style={styles.section}>
            <div style={styles.sectionHead}>
              <h2 style={styles.sectionTitle}>{section.name}</h2>
              <div style={styles.sectionRule} />
            </div>

            {hasSizing ? (
              <SizeTable items={section.items} showHot={showHot} showIced={showIced} />
            ) : (
              <TwoColumnList items={section.items} />
            )}
          </section>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  board: {
    display: 'flex',
    flexDirection: 'column',
    gap: 44,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
  },
  sectionHead: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#B87333',
    fontFamily: 'var(--font-menu)',
    fontSize: 34,
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  sectionRule: {
    flex: 1,
    height: 0,
    borderTop: '2px dashed rgba(184,115,51,0.4)',
  },
  table: {
    display: 'grid',
    rowGap: 18,
    columnGap: 24,
    alignItems: 'baseline',
  },
  headerCell: {
    color: '#B87333',
    fontFamily: 'var(--font-menu)',
    fontSize: 19,
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    paddingBottom: 10,
    borderBottom: '2px solid rgba(184,115,51,0.3)',
  },
  nameCell: {
    color: '#1B1510',
    fontFamily: 'var(--font-menu)',
    fontSize: 30,
    fontWeight: 700,
    letterSpacing: '0',
  },
  sizeCell: {
    color: '#1B1510',
    fontFamily: 'var(--font-menu)',
    fontSize: 24,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  priceCell: {
    color: '#1B1510',
    fontFamily: 'var(--font-menu)',
    fontSize: 25,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'right',
    whiteSpace: 'nowrap',
  },
  columns: {
    display: 'flex',
    gap: 40,
  },
  column: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  card: {
    paddingBottom: 10,
  },
  cardImage: {
    width: '100%',
    height: 90,
    objectFit: 'cover',
    borderRadius: 6,
    marginBottom: 8,
  },
  cardTop: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemName: {
    color: '#1B1510',
    fontFamily: 'var(--font-menu)',
    fontSize: 30,
    fontWeight: 700,
    letterSpacing: '0',
  },
  badge: {
    marginLeft: 10,
    color: '#1B1510',
    fontFamily: 'var(--font-menu)',
    fontSize: 19,
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  itemPrice: {
    flexShrink: 0,
    color: '#1B1510',
    fontFamily: 'var(--font-menu)',
    fontSize: 30,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  itemDescription: {
    marginTop: 4,
    color: 'rgba(27,21,16,0.75)',
    fontFamily: 'var(--font-menu)',
    fontSize: 19,
    fontWeight: 550,
    lineHeight: 1.45,
  },
};
