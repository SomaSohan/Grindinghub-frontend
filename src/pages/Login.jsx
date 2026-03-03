import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, Lock, Loader2 } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const res = await login(email, password);
        setLoading(false);

        if (res.success) {
            if (res.role === 'ADMIN') navigate('/admin/dashboard');
            else if (res.role === 'CLIENT') navigate('/client/dashboard');
            else navigate('/factory/dashboard');
        } else {
            setError(res.error);
        }
    };

    return (
        <div style={styles.container}>
            <div className="glass-card" style={styles.card}>
                <h2 style={styles.title}>Welcome Back</h2>
                <p style={styles.subtitle}>Enter your credentials to access your portal</p>

                {error && <div style={styles.errorBanner}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form} autoComplete="off">
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email Address</label>
                        <div style={styles.inputWrapper}>
                            <User size={18} style={styles.inputIcon} />
                            <input
                                type="email"
                                className="input-base"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                required
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" style={styles.submitBtn} disabled={loading}>
                        {loading ? <Loader2 size={20} className="spinner" /> : 'Log In'}
                    </button>
                </form>

                <p style={styles.footer}>
                    Don't have an account? <span style={styles.link} onClick={() => navigate('/register')}>Sign up</span>
                </p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: 'calc(100vh - 100px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
    },
    card: {
        width: '100%',
        maxWidth: '450px',
        padding: '40px',
        animation: 'fadeIn 0.5s ease',
    },
    title: {
        fontSize: '2rem',
        marginBottom: '8px',
        textAlign: 'center',
    },
    subtitle: {
        color: 'var(--text-muted)',
        textAlign: 'center',
        marginBottom: '30px',
    },
    errorBanner: {
        background: 'rgba(239, 68, 68, 0.1)',
        color: '#ef4444',
        border: '1px solid #ef4444',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center',
        fontSize: '0.9rem',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    inputWrapper: {
        position: 'relative',
    },
    inputIcon: {
        position: 'absolute',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--text-muted)',
    },
    label: {
        fontSize: '0.9rem',
        fontWeight: '500',
        color: '#cbd5e1',
    },
    submitBtn: {
        marginTop: '10px',
        padding: '14px',
    },
    footer: {
        marginTop: '24px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
    },
    link: {
        color: 'var(--accent-primary)',
        cursor: 'pointer',
        fontWeight: '500',
    }
};

export default Login;
