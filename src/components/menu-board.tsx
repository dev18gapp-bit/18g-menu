import { formatPrice, type MenuItem, type MenuSection } from '@/lib/menu-data';

interface MenuBoardProps {
  sections: MenuSection[];
  /** 1 = single list top-to-bottom, 2 = two columns side by side (default). */
  columns?: 1 | 2;
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
          {item.hotSize && (
            <span style={styles.emoji} title="Served hot">
              ☕
            </span>
          )}
          {item.coldSize && (
            <span style={styles.emoji} title="Served iced">
              🧊
            </span>
          )}
          {!item.hotSize && !item.coldSize && item.hotIced && <span style={styles.badge}>{item.hotIced}</span>}
        </span>
        <span style={styles.itemPrice}>{formatPrice(item.price)}</span>
      </div>
      {item.description && <p style={styles.itemDescription}>{item.description}</p>}
    </div>
  );
}

// Fills column(s) top-to-bottom (left column first, then right, when there
// are two) — not a wrapping grid, which interleaves items left/right and
// breaks the reading order of a longer list.
function ItemList({ items, columns }: { items: MenuItem[]; columns: 1 | 2 }) {
  const splitAt = columns === 1 ? items.length : Math.ceil(items.length / 2);
  const groups = columns === 1 ? [items] : [items.slice(0, splitAt), items.slice(splitAt)];

  return (
    <div style={styles.columns}>
      {groups.map(
        (group, i) =>
          group.length > 0 && (
            <div key={i} style={styles.column}>
              {group.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )
      )}
    </div>
  );
}

export default function MenuBoard({ sections, columns = 2 }: MenuBoardProps) {
  return (
    <div style={styles.board}>
      {sections.map((section) => (
        <section key={section.name} style={styles.section}>
          <div style={styles.sectionHead}>
            <h2 style={styles.sectionTitle}>{section.name}</h2>
            <div style={styles.sectionRule} />
          </div>

          <ItemList items={section.items} columns={columns} />
        </section>
      ))}
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
  emoji: {
    marginLeft: 10,
    fontSize: 20,
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
