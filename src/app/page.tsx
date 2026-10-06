import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={styles.page}>
      <p style={styles.label}>18g COFFEE &amp; ROASTERY</p>
      <h1 style={styles.heading}>Menu Boards</h1>
      <div style={styles.links}>
        <Link href="/screen-1" style={styles.link}>
          Screen 1 — Classic, Originals &amp; Speciality Coffee
        </Link>
        <Link href="/screen-2" style={styles.link}>
          Screen 2 — Refreshers, Matcha Bar &amp; Speciality Milk Espresso
        </Link>
        <Link href="/admin" style={styles.adminLink}>
          Admin →
        </Link>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#100C08',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  label: {
    color: 'rgba(245,236,215,0.5)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '3px',
  },
  heading: {
    color: '#F5ECD7',
    fontFamily: 'var(--font-playfair)',
    fontSize: 32,
    fontWeight: 600,
    marginBottom: 28,
  },
  links: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    alignItems: 'center',
  },
  link: {
    color: '#C9A84C',
    fontFamily: 'var(--font-raleway)',
    fontSize: 15,
    fontWeight: 600,
    textDecoration: 'none',
    border: '1px solid rgba(201,168,76,0.3)',
    borderRadius: 8,
    padding: '14px 28px',
  },
  adminLink: {
    marginTop: 16,
    color: 'rgba(245,236,215,0.4)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 12,
    textDecoration: 'none',
  },
};
