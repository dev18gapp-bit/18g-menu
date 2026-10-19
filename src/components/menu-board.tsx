import { formatPrice, type MenuSection } from '@/lib/menu-data';

interface MenuBoardProps {
  sections: MenuSection[];
}

export default function MenuBoard({ sections }: MenuBoardProps) {
  return (
    <div style={styles.board}>
      {sections.map((section) => (
        <section key={section.name} style={styles.section}>
          <div style={styles.sectionHead}>
            <h2 style={styles.sectionTitle}>{section.name}</h2>
            <div style={styles.sectionRule} />
          </div>

          <div style={styles.grid}>
            {section.items.map((item) => (
              <div key={item.id} style={styles.card}>
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" style={styles.cardImage} />
                )}
                <div style={styles.cardTop}>
                  <span style={styles.itemName}>
                    {item.name}
                    {item.size && <span style={styles.badge}>{item.size}</span>}
                    {item.hotIced && <span style={styles.badge}>{item.hotIced}</span>}
                  </span>
                  <span style={styles.itemPrice}>{formatPrice(item.price)}</span>
                </div>
                {item.description && <p style={styles.itemDescription}>{item.description}</p>}
              </div>
            ))}
          </div>
        </section>
      ))}
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
