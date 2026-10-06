export default function MenuFooter() {
  return (
    <div style={styles.footer}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/logo.jpg" alt="" style={styles.logo} />
      <span style={styles.name}>18g COFFEE &amp; ROASTERY</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1px solid rgba(245,236,215,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  logo: {
    height: 36,
    width: 'auto',
    borderRadius: 4,
  },
  name: {
    color: 'rgba(245,236,215,0.6)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '2px',
  },
};
