import React from 'react';

const Agreement = () => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Agreement</h1>
        <p style={styles.subtitle}>Please review and accept the terms and conditions for the chit fund group.</p>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Terms of Service</h2>
        <div style={styles.content}>
          <p style={styles.paragraph}>1. Members must contribute the specified amount by the 10th of every month.</p>
          <p style={styles.paragraph}>2. Loan eligibility is determined by the group pool availability and foreman approval.</p>
          <p style={styles.paragraph}>3. Late payments will incur a penalty as per the group's agreed rules.</p>
          <p style={styles.paragraph}>4. The foreman reserves the right to mediate disputes and manage the pool health.</p>
        </div>
      </div>

      <button style={styles.acceptBtn}>Accept Agreement</button>
    </div>
  );
};

const styles = {
  container: {
    padding: '24px 18px 60px',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    boxSizing: 'border-box',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1b3664',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.5',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    marginBottom: '24px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1b3664',
    margin: '0 0 16px 0',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  paragraph: {
    fontSize: '14px',
    color: '#475569',
    margin: 0,
    lineHeight: '1.6',
  },
  acceptBtn: {
    width: '100%',
    height: '52px',
    backgroundColor: '#1b3664',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
  }
};

export default Agreement;