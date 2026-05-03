import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const navigate = useNavigate();

    const handleSendOTP = (e) => {
        e.preventDefault();
        if (phoneNumber.length >= 10) {
            console.log('Sending OTP to:', '+91' + phoneNumber);
            // Mock handler: Redirect to Dashboard upon successful entry
            navigate('/dashboard');
        } else {
            alert('Please enter a valid 10-digit mobile number.');
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

                {/* Input Form */}
                <form onSubmit={handleSendOTP} style={styles.form}>
                    <label style={styles.label}>Mobile Number</label>
                    <div style={styles.inputGroup}>
                        <div style={styles.prefix}>+91</div>
                        <input
                            type="tel"
                            style={{ ...styles.input, backgroundColor: '#ffffff' }}
                            placeholder="98765 43210"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                            maxLength={10}
                            autoFocus
                        />
                    </div>

                    <button type="submit" style={styles.button}>
                        Send OTP
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

                {/* Divider */}
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

// Styles object for clean inline styling
const styles = {
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa', // Light grey background
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
        color: '#1b3664', // Dark blue
        fontSize: '24px',
        fontWeight: '700',
        margin: '0 0 6px 0',
    },
    subtitle: {
        color: '#8c95a1', // Muted grey
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '1px',
        margin: '0 0 32px 0',
    },
    form: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
    },
    label: {
        color: '#4a5568',
        fontSize: '14px',
        fontWeight: '600',
        marginBottom: '8px',
        alignSelf: 'flex-start',
    },
    inputGroup: {
        display: 'flex',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
        height: '48px',
        backgroundColor: '#ffffff',
    },
    prefix: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        color: '#64748b',
        fontSize: '15px',
        fontWeight: '500',
    },
    input: {
        flex: 1,
        border: 'none',
        padding: '0 16px',
        fontSize: '15px',
        outline: 'none',
        color: '#1e293b',
        width: '100%',
        letterSpacing: '0.5px',
    },
    button: {
        backgroundColor: '#1b3664',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        height: '48px',
        fontSize: '16px',
        fontWeight: '600',
        marginTop: '24px',
        cursor: 'pointer',
        width: '100%',
        transition: 'background-color 0.2s ease',
    },
    securedContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        marginTop: '24px',
    },
    securedText: {
        color: '#94a3b8',
        fontSize: '13px',
        fontWeight: '500',
    },
    divider: {
        height: '1px',
        backgroundColor: '#f1f5f9',
        width: '100%',
        margin: '32px 0 24px 0',
    },
    termsText: {
        color: '#94a3b8',
        fontSize: '12px',
        textAlign: 'center',
        lineHeight: '1.5',
        margin: '0 0 24px 0',
    },
    footerLinks: {
        display: 'flex',
        alignItems: 'center',
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

export default Login;