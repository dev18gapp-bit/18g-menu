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
    borderTop: '1px solid rgba(27,21,16,0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  logo: {
    height: 48,
    width: 'auto',
    borderRadius: 4,
  },
  name: {
    color: 'rgba(27,21,16,0.65)',
    fontFamily: 'var(--font-menu)',
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: '1.5px',
  },
};
