import { formatPrice, type MenuItem, type MenuSection } from '@/lib/menu-data';

interface MenuBoardProps {
  sections: MenuSection[];
}

function ItemRow({ item, badge }: { item: MenuItem; badge: string | null }) {
  return (
    <div style={styles.card}>
      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" style={styles.cardImage} />
      )}
      <div style={styles.cardTop}>
        <span style={styles.itemName}>
          {item.name}
          {badge && <span style={styles.badge}>{badge}</span>}
        </span>
        <span style={styles.itemPrice}>{formatPrice(item.price)}</span>
      </div>
      {item.description && <p style={styles.itemDescription}>{item.description}</p>}
    </div>
  );
}

export default function MenuBoard({ sections }: MenuBoardProps) {
  return (
    <div style={styles.board}>
      {sections.map((section) => {
        const hotItems = section.items.filter((i) => i.hotSize);
        const icedItems = section.items.filter((i) => i.coldSize);
        // Items with neither — e.g. Pastries, Deli — render as a single
        // flat grid with no Hot/Iced split, falling back to the legacy
        // plain hotIced badge if one's set.
        const plainItems = section.items.filter((i) => !i.hotSize && !i.coldSize);

        return (
          <section key={section.name} style={styles.section}>
            <div style={styles.sectionHead}>
              <h2 style={styles.sectionTitle}>{section.name}</h2>
              <div style={styles.sectionRule} />
            </div>

            {hotItems.length > 0 && (
              <div style={styles.tempGroup}>
                <p style={styles.tempLabel}>Hot</p>
                <div style={styles.grid}>
                  {hotItems.map((item) => (
                    <ItemRow key={`${item.id}-hot`} item={item} badge={item.hotSize} />
                  ))}
                </div>
              </div>
            )}

            {icedItems.length > 0 && (
              <div style={styles.tempGroup}>
                <p style={styles.tempLabel}>Iced</p>
                <div style={styles.grid}>
                  {icedItems.map((item) => (
                    <ItemRow key={`${item.id}-iced`} item={item} badge={item.coldSize} />
                  ))}
                </div>
              </div>
            )}

            {plainItems.length > 0 && (
              <div style={styles.grid}>
                {plainItems.map((item) => (
                  <ItemRow key={item.id} item={item} badge={item.hotIced || null} />
                ))}
              </div>
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
    gap: 36,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
  },
  sectionHead: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#B87333',
    fontFamily: 'var(--font-raleway)',
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: '3px',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  sectionRule: {
    flex: 1,
    height: 0,
    borderTop: '1px dashed rgba(184,115,51,0.4)',
  },
  tempGroup: {
    marginBottom: 20,
  },
  tempLabel: {
    color: '#B87333',
    fontFamily: 'var(--font-raleway)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    opacity: 0.75,
    marginBottom: 10,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '10px 28px',
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
    fontFamily: 'var(--font-raleway)',
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: '0.3px',
  },
  badge: {
    marginLeft: 8,
    color: '#1B1510',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  itemPrice: {
    flexShrink: 0,
    color: '#1B1510',
    fontFamily: 'var(--font-raleway)',
    fontSize: 15,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  itemDescription: {
    marginTop: 3,
    color: 'rgba(27,21,16,0.62)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 12.5,
    lineHeight: 1.45,
  },
};
