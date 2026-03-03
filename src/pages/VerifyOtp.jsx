import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { FileDigit, KeyRound } from 'lucide-react';

// Using a Set in the frontend memory to track and prevent duplicate license numbers per user request
const usedLicenses = new Set();

const VerifyOtp = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';

    const [otp, setOtp] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!email) {
            navigate('/register');
        }
    }, [email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (usedLicenses.has(licenseNumber)) {
            setLoading(false);
            return setError('This License Number is already registered by another factory.');
        }

        try {
            await api.post('/users/verify', { email, otp, licenseNumber });

            // On success, store the used license in our frontend Set
            usedLicenses.add(licenseNumber);

            setLoading(false);
            navigate('/login', { state: { message: 'Factory Verified! You can now log in.' } });
        } catch (err) {
            setLoading(false);
            const msg = err.response?.data?.message || err.response?.data || 'Verification Failed.';
            setError(msg);
        }
    };

    return (
        <div style={styles.container}>
            <div className="glass-card" style={styles.card}>
                <h2 style={styles.title}>Verify Factory</h2>
                <p style={styles.subtitle}>Enter the OTP sent to <b>{email}</b> and your License Number to verify your factory.</p>

                {error && <div style={styles.errorBanner}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>OTP Code</label>
                        <div style={styles.inputWrapper}>
                            <KeyRound size={18} style={styles.inputIcon} />
                            <input
                                type="text"
                                className="input-base"
                                placeholder="123456"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>GST License Number *</label>
                        <div style={styles.inputWrapper}>
                            <FileDigit size={18} style={styles.inputIcon} />
                            <input
                                type="text"
                                className="input-base"
                                placeholder="e.g. 27ABCDE1234F1Z5"
                                value={licenseNumber}
                                onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
                                required
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                        <p style={styles.hint}>Format: 15-character GST number (e.g. <b>27AAAAA0000A1Z5</b>)</p>
                    </div>

                    <button type="submit" className="btn-primary" style={styles.submitBtn} disabled={loading}>
                        {loading ? 'Verifying...' : 'Verify & Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: { minHeight: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
    card: { width: '100%', maxWidth: '450px', padding: '40px', animation: 'fadeIn 0.5s ease', textAlign: 'center' },
    title: { fontSize: '2rem', marginBottom: '8px' },
    subtitle: { color: 'var(--text-muted)', marginBottom: '30px', lineHeight: '1.5' },
    errorBanner: { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', padding: '12px', borderRadius: '8px', marginBottom: '20px' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    inputWrapper: { position: 'relative' },
    inputIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' },
    label: { fontSize: '0.9rem', fontWeight: '500', color: '#cbd5e1' },
    hint: { fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' },
    submitBtn: { marginTop: '10px', padding: '14px' }
};

export default VerifyOtp;
