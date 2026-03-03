import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Settings, Users, CheckCircle } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div style={styles.container}>
            {/* Hero Section */}
            <section style={styles.hero}>
                <h1 style={styles.title}>
                    The Premier <span className="text-gradient">Marketplace</span><br />
                    For Global Grinding Services
                </h1>
                <p style={styles.subtitle}>
                    Connect with elite factories offering heavy machinery grinding services. Seamless, fast, and transparent access tailored for your industrial needs.
                </p>

                <div style={styles.ctaGroup}>
                    <button className="btn-primary" onClick={() => navigate('/register')} style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
                        Get Started <ArrowRight size={20} />
                    </button>
                    <button className="btn-secondary" onClick={() => navigate('/login')} style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
                        Login to Portal
                    </button>
                </div>
            </section>

            {/* Features Grid */}
            <section style={styles.features}>
                <div className="glass-card" style={styles.card}>
                    <div style={styles.iconWrapper}><Settings size={32} color="#0ea5e9" /></div>
                    <h3 style={styles.cardTitle}>For Factories</h3>
                    <p style={styles.cardText}>List your specific grinding machinery, handle specialized materials, and define precise pricing models.</p>
                </div>

                <div className="glass-card" style={styles.card}>
                    <div style={styles.iconWrapper}><Users size={32} color="#10b981" /></div>
                    <h3 style={styles.cardTitle}>For Clients</h3>
                    <p style={styles.cardText}>Search exclusively for factories near your precise GPS location or filter by machine and material requirements.</p>
                </div>

                <div className="glass-card" style={styles.card}>
                    <div style={styles.iconWrapper}><CheckCircle size={32} color="#8b5cf6" /></div>
                    <h3 style={styles.cardTitle}>Verified Ecosystem</h3>
                    <p style={styles.cardText}>OTP verification and license tracking ensure that only legitimate entities operate on GrindingHub.</p>
                </div>
            </section>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
    },
    hero: {
        textAlign: 'center',
        padding: '100px 0 60px',
    },
    title: {
        fontSize: '4.5rem',
        fontWeight: '800',
        lineHeight: '1.1',
        marginBottom: '24px',
    },
    subtitle: {
        fontSize: '1.25rem',
        color: 'var(--text-muted)',
        maxWidth: '650px',
        margin: '0 auto 40px',
        lineHeight: '1.6',
    },
    ctaGroup: {
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
        alignItems: 'center',
    },
    features: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '30px',
        marginTop: '60px',
    },
    card: {
        padding: '40px 30px',
        textAlign: 'left',
        transition: 'transform 0.3s ease',
    },
    iconWrapper: {
        width: '60px',
        height: '60px',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
    },
    cardTitle: {
        fontSize: '1.5rem',
        marginBottom: '12px',
    },
    cardText: {
        color: 'var(--text-muted)',
        lineHeight: '1.6',
    },
};

export default LandingPage;
