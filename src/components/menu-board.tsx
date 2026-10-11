import { formatPrice, type MenuSection } from '@/lib/menu-data';

interface MenuBoardProps {
  sections: MenuSection[];
  /** Admin-uploaded graphics keyed by slot — section name here, 'header' used by MenuScreen. */
  graphics?: Record<string, string>;
}

export default function MenuBoard({ sections, graphics = {} }: MenuBoardProps) {
  return (
    <div style={styles.board}>
      {sections.map((section) => (
        <section key={section.name} style={styles.section}>
          <div style={styles.sectionHead}>
            {graphics[section.name] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={graphics[section.name]} alt="" style={styles.sectionIcon} />
            )}
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
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  sectionIcon: {
    width: 30,
    height: 30,
    objectFit: 'contain',
    // Works whether the uploaded PNG has a real transparent background or
    // (the Canva-free workaround) a solid black one — on our near-black
    // page background, screen-blending a black fill makes it disappear
    // while leaving light line-art colors essentially unchanged.
    mixBlendMode: 'screen',
  },
  sectionTitle: {
    color: '#C9A84C',
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
    borderTop: '1px dashed rgba(201,168,76,0.35)',
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
    color: '#F5ECD7',
    fontFamily: 'var(--font-raleway)',
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: '0.3px',
  },
  badge: {
    marginLeft: 8,
    color: 'rgba(245,236,215,0.45)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  itemPrice: {
    flexShrink: 0,
    color: '#C9A84C',
    fontFamily: 'var(--font-raleway)',
    fontSize: 15,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  itemDescription: {
    marginTop: 3,
    color: 'rgba(245,236,215,0.5)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 12.5,
    lineHeight: 1.45,
  },
};
