import React, { useState } from 'react';
import { useNavigate }     from 'react-router-dom';
import { loginWithEmail }  from '../lib/auth';
import useAuthStore        from '../store/authStore';

const Login = () => {
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState(null);

    const navigate = useNavigate();

    // If already authenticated, bounce to dashboard immediately
    const uid = useAuthStore((s) => s.uid);
    if (uid) {
        navigate('/dashboard', { replace: true });
        return null;
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await loginWithEmail(email, password);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            // err is already a human-readable string from auth.js
            setError(typeof err === 'string' ? err : 'Sign-in failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                {/* Logo */}
                <div style={styles.logoContainer}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 12H7L10 4L14 20L17 12H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>

                {/* Headers */}
                <h1 style={styles.title}>TransactFlowOS</h1>
                <h2 style={styles.subtitle}>MEMBER PORTAL</h2>

                {/* Inline Error Banner */}
                {error && (
                    <div style={styles.errorBanner}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* Input Form */}
                <form onSubmit={handleLogin} style={styles.form}>
                    <label style={styles.label}>Email Address</label>
                    <div style={{
                        ...styles.inputGroup,
                        borderColor: error ? '#fca5a5' : '#e2e8f0',
                    }}>
                        <input
                            type="email"
                            style={styles.input}
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setError(null); }}
                            autoFocus
                            disabled={loading}
                            required
                        />
                    </div>

                    <label style={{ ...styles.label, marginTop: '20px' }}>Password</label>
                    <div style={{
                        ...styles.inputGroup,
                        borderColor: error ? '#fca5a5' : '#e2e8f0',
                        position: 'relative',
                    }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            style={{ ...styles.input, paddingRight: '44px' }}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(null); }}
                            disabled={loading}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={styles.eyeButton}
                            disabled={loading}
                            tabIndex="-1"
                        >
                            {showPassword ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            )}
                        </button>
                    </div>

                    <button
                        type="submit"
                        style={{
                            ...styles.button,
                            opacity: loading ? 0.7 : 1,
                            cursor:  loading ? 'not-allowed' : 'pointer',
                        }}
                        disabled={loading}
                    >
                        {loading ? (
                            <span style={styles.buttonInner}>
                                <span style={styles.btnSpinner} /> Signing in…
                            </span>
                        ) : 'Sign In'}
                    </button>
                </form>

                {/* Secured By Indicator */}
                <div style={styles.securedContainer}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        <polyline points="9 12 11 14 15 10"></polyline>
                    </svg>
                    <span style={styles.securedText}>Secured by Firebase</span>
                </div>

                <div style={styles.divider}></div>

                {/* Terms Text */}
                <p style={styles.termsText}>
                    By signing in, you agree to our Terms of Service and Privacy Policy.
                </p>

                {/* Footer Links */}
                <div style={styles.footerLinks}>
                    <span style={styles.link}>Help Center</span>
                    <span style={styles.separator}>|</span>
                    <span style={styles.link}>Contact Support</span>
                </div>
            </div>
        </div>
    );
};

// ── Styles ────────────────────────────────────────────────────────
const styles = {
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '40px 32px',
        width: '100%',
        maxWidth: '380px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    logoContainer: {
        backgroundColor: '#1a1a1a',
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
    },
    title: {
        color: '#1b3664',
        fontSize: '24px',
        fontWeight: '700',
        margin: '0 0 6px 0',
    },
    subtitle: {
        color: '#8c95a1',
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '1px',
        margin: '0 0 24px 0',
    },
    errorBanner: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fca5a5',
        borderRadius: '8px',
        padding: '10px 14px',
        marginBottom: '16px',
        width: '100%',
        boxSizing: 'border-box',
        color: '#b91c1c',
        fontSize: '13px',
        fontWeight: '500',
        lineHeight: '1.4',
    },
    form: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
    },
    label: {
        color: '#64748b',
        fontSize: '13px',
        fontWeight: '500',
        marginBottom: '10px',
        alignSelf: 'flex-start',
    },
    inputGroup: {
        display: 'flex',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
        height: '48px',
        backgroundColor: '#ffffff',
        marginBottom: '4px',
        transition: 'border-color 0.15s ease',
    },
    input: {
        flex: 1,
        border: 'none',
        padding: '0 16px',
        fontSize: '15px',
        outline: 'none',
        color: '#1e293b',
        backgroundColor: 'transparent',
        width: '100%',
        letterSpacing: '0.5px',
    },
    eyeButton: {
        position: 'absolute',
        right: '4px',
        top: '50%',
        transform: 'translateY(-50%)',
        border: 'none',
        background: 'transparent',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
        borderRadius: '6px',
        transition: 'background-color 0.2s ease',
    },
    button: {
        backgroundColor: '#1b3664',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        height: '52px',
        fontSize: '16px',
        fontWeight: '700',
        marginTop: '32px',
        cursor: 'pointer',
        width: '100%',
        transition: 'background-color 0.2s ease, opacity 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonInner: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    btnSpinner: {
        display: 'inline-block',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.4)',
        borderTop: '2px solid #ffffff',
        animation: 'spin 0.65s linear infinite',
    },
    securedContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        marginTop: '32px',
    },
    securedText: {
        color: '#94a3b8',
        fontSize: '12px',
        fontWeight: '500',
    },
    divider: {
        height: '1px',
        backgroundColor: '#f1f5f9',
        width: '100%',
        margin: '48px 0 32px 0',
    },
    termsText: {
        color: '#94a3b8',
        fontSize: '11px',
        textAlign: 'center',
        lineHeight: '1.5',
        margin: '0 0 32px 0',
    },
    footerLinks: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
    },
    link: {
        color: '#335c98',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        textDecoration: 'none',
    },
    separator: {
        color: '#cbd5e1',
        fontSize: '12px',
    },
};

// Inject spinner keyframes (reuses auth provider's id-check pattern)
if (typeof document !== 'undefined' && !document.getElementById('auth-spinner-style')) {
    const style = document.createElement('style');
    style.id = 'auth-spinner-style';
    style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
}

export default Login;