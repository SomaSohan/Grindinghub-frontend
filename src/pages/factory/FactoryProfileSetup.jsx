import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { MapPin, Navigation, Factory, Loader2 } from 'lucide-react';

const FactoryProfileSetup = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [formData, setFormData] = useState({
        factoryName: '',
        address: '',
        city: '',
        state: '',
        description: '',
        latitude: '',
        longitude: ''
    });
    const [locating, setLocating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Auto-detect Exact GPS Location
    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: position.coords.latitude.toFixed(6),
                    longitude: position.coords.longitude.toFixed(6)
                }));
                setLocating(false);
            },
            () => {
                setLocating(false);
                setError('Unable to retrieve your location. Please enter coordinates manually.');
            }
        );
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            // Use the actual userId from the auth context
            await api.post('/factories', {
                ...formData,
                userId: user.userId,
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
            });
            setSaving(false);
            // After profile setup, go to dashboard (which will now show the services page)
            navigate('/factory/dashboard');
        } catch (err) {
            setSaving(false);
            setError('Failed to save factory profile. Please try again.');
        }
    };

    return (
        <div style={styles.page}>
            <div className="glass-card" style={styles.card}>

                <div style={styles.topHeader}>
                    <div style={styles.iconCircle}>
                        <Factory size={32} color="#0ea5e9" />
                    </div>
                    <h2 style={styles.title}>Setup Your Factory Profile</h2>
                    <p style={styles.subtitle}>Tell clients who you are and where to find you. This is a one-time setup.</p>
                </div>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>

                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Factory Name *</label>
                        <input name="factoryName" type="text" className="input-base" placeholder="e.g. Shree Mahadev Grinding Works" value={formData.factoryName} onChange={handleChange} required />
                    </div>

                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Full Address *</label>
                        <input name="address" type="text" className="input-base" placeholder="Street, Area, Landmark" value={formData.address} onChange={handleChange} required />
                    </div>

                    <div style={styles.row}>
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>City *</label>
                            <input name="city" type="text" className="input-base" placeholder="e.g. Pune" value={formData.city} onChange={handleChange} required />
                        </div>
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>State *</label>
                            <input name="state" type="text" className="input-base" placeholder="e.g. Maharashtra" value={formData.state} onChange={handleChange} required />
                        </div>
                    </div>

                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>About Your Factory *</label>
                        <textarea
                            name="description"
                            className="input-base"
                            style={{ resize: 'none', height: '100px' }}
                            placeholder="Describe your factory, specialties, experience..."
                            value={formData.description}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* GPS Location Section */}
                    <div style={styles.gpsSection}>
                        <div style={styles.gpsHeader}>
                            <div>
                                <h4 style={styles.gpsTitle}>
                                    <MapPin size={18} color="#10b981" style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                                    Exact Location
                                    <span style={styles.gpsBadge}>Live GPS</span>
                                </h4>
                                <p style={styles.gpsHint}>Auto-detect your position or enter coordinates manually</p>
                            </div>
                            <button type="button" onClick={handleGetLocation} className="btn-secondary" style={styles.gpsBtn} disabled={locating}>
                                {locating ? <Loader2 size={16} className="spinner" /> : <Navigation size={16} />}
                                {locating ? 'Locating...' : 'Use My Location'}
                            </button>
                        </div>

                        <div style={styles.row}>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Latitude *</label>
                                <input name="latitude" type="number" step="any" className="input-base" placeholder="e.g. 18.5204" value={formData.latitude} onChange={handleChange} required />
                            </div>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Longitude *</label>
                                <input name="longitude" type="number" step="any" className="input-base" placeholder="e.g. 73.8567" value={formData.longitude} onChange={handleChange} required />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" style={styles.submitBtn} disabled={saving}>
                        {saving ? <><Loader2 size={18} className="spinner" /> Creating Profile...</> : 'Save & Continue to Services →'}
                    </button>

                </form>
            </div>
        </div>
    );
};

const styles = {
    page: { padding: '40px 20px', display: 'flex', justifyContent: 'center', minHeight: 'calc(100vh - 100px)', alignItems: 'flex-start' },
    card: { width: '100%', maxWidth: '700px', padding: '48px' },
    topHeader: { textAlign: 'center', marginBottom: '36px' },
    iconCircle: { width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
    title: { fontSize: '2rem', marginBottom: '8px' },
    subtitle: { color: 'var(--text-muted)', lineHeight: '1.5' },
    error: { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' },
    form: { display: 'flex', flexDirection: 'column', gap: '22px' },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
    row: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
    label: { fontSize: '0.875rem', fontWeight: '500', color: '#94a3b8' },
    gpsSection: { border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '20px', background: 'rgba(16, 185, 129, 0.05)' },
    gpsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
    gpsTitle: { fontSize: '1rem', fontWeight: '600', margin: '0 0 4px', display: 'flex', alignItems: 'center' },
    gpsBadge: { fontSize: '0.7rem', padding: '3px 8px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', borderRadius: '12px', marginLeft: '8px', fontWeight: '600' },
    gpsHint: { color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 },
    gpsBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '0.9rem', whiteSpace: 'nowrap' },
    submitBtn: { padding: '14px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }
};

export default FactoryProfileSetup;
