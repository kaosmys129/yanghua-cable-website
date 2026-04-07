export default function Custom500Page() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fffaf0',
        color: '#0f172a',
        padding: '32px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 560, textAlign: 'center' }}>
        <p style={{ margin: 0, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#f59e0b', fontWeight: 700 }}>
          Yanghua Cable
        </p>
        <h1 style={{ marginTop: 16, marginBottom: 16, fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>Server Error</h1>
        <p style={{ margin: 0, fontSize: '1.05rem', lineHeight: 1.7, color: '#475569' }}>
          The page could not be rendered right now. Please refresh in a moment or return to the homepage.
        </p>
      </div>
    </main>
  );
}
