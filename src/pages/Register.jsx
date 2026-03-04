import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Mail, Lock, User, Phone, Briefcase } from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'CLIENT' // Default
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address.');
            setLoading(false);
            return;
        }

        try {
            const response = await api.post('/users/register', formData);
            setLoading(false);

            // Inspect response for FACTORY OTP flow
            if (response.data && response.data.next === 'verify') {
                // Redirect to OTP Verification Screen
                navigate('/verify-otp', { state: { email: formData.email } });
            } else {
                // Normal client creation success
                navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
            }

        } catch (err) {
            setLoading(false);
            let msg = 'Registration failed.';
            if (err.response && err.response.data) {
                msg = err.response.data.message || err.response.data || msg;
            }
            setError(msg);
        }
    };

    return (
        <div style={styles.container}>
            <div className="glass-card" style={styles.card}>
                <h2 style={styles.title}>Join GrindingHub</h2>
                <p style={styles.subtitle}>Create your account to connect or list services</p>

                {error && <div style={styles.errorBanner}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form} autoComplete="off">

                    <div style={styles.roleToggle}>
                        <button
                            type="button"
                            style={formData.role === 'CLIENT' ? styles.roleActive : styles.roleInactive}
                            onClick={() => setFormData({ ...formData, role: 'CLIENT' })}
                        >
                            I am a Client
                        </button>
                        <button
                            type="button"
                            style={formData.role === 'FACTORY' ? styles.roleActive : styles.roleInactive}
                            onClick={() => setFormData({ ...formData, role: 'FACTORY' })}
                        >
                            I am a Factory
                        </button>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Full Name</label>
                        <div style={styles.inputWrapper}>
                            <User size={18} style={styles.inputIcon} />
                            <input
                                type="text"
                                className="input-base"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                autoComplete="off"
                                required
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email Address</label>
                        <div style={styles.inputWrapper}>
                            <Mail size={18} style={styles.inputIcon} />
                            <input
                                type="email"
                                className="input-base"
                                placeholder="name@company.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                autoComplete="off"
                                required
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Phone Number</label>
                        <div style={styles.inputWrapper}>
                            <Phone size={18} style={styles.inputIcon} />
                            <input
                                type="text"
                                className="input-base"
                                placeholder="+1 234 567 890"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                autoComplete="off"
                                required
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Password</label>
                        <div style={styles.inputWrapper}>
                            <Lock size={18} style={styles.inputIcon} />
                            <input
                                type="password"
                                className="input-base"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                autoComplete="new-password"
                                required
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    {formData.role === 'FACTORY' && (
                        <div style={styles.infoBox}>
                            <Briefcase size={20} color="#0ea5e9" />
                            <p>As a Factory, you will be asked to verify your email via OTP and provide a License Number on the next step.</p>
                        </div>
                    )}

                    <button type="submit" className="btn-primary" style={styles.submitBtn} disabled={loading}>
                        {loading ? 'Processing...' : 'Create Account'}
                    </button>
                </form>

                <p style={styles.footer}>
                    Already have an account? <span style={styles.link} onClick={() => navigate('/login')}>Log In</span>
                </p>
            </div>
        </div>
    );
};

// Reusing some styles from Login
const styles = {
    container: { minHeight: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
    card: { width: '100%', maxWidth: '500px', padding: '40px', animation: 'fadeIn 0.5s ease' },
    title: { fontSize: '2rem', marginBottom: '8px', textAlign: 'center' },
    subtitle: { color: 'var(--text-muted)', textAlign: 'center', marginBottom: '30px' },
    errorBanner: { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    inputWrapper: { position: 'relative' },
    inputIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' },
    label: { fontSize: '0.9rem', fontWeight: '500', color: '#cbd5e1' },
    submitBtn: { marginTop: '10px', padding: '14px' },
    footer: { marginTop: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' },
    link: { color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '500' },
    roleToggle: { display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' },
    roleActive: { flex: 1, padding: '12px', background: 'var(--accent-primary)', color: 'white', border: 'none', fontWeight: '600' },
    roleInactive: { flex: 1, padding: '12px', background: 'transparent', color: 'var(--text-muted)', border: 'none', fontWeight: '600', cursor: 'pointer' },
    infoBox: { background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.3)', padding: '15px', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--accent-primary)', fontSize: '0.9rem', lineHeight: '1.5' }
};

export default Register;
