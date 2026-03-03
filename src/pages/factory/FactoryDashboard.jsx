import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { Plus, Trash2, Loader2, Factory, MapPin, Settings, BarChart2, Eye, Heart, MousePointerClick } from 'lucide-react';

const FactoryDashboard = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [myFactory, setMyFactory] = useState(null);
    const [services, setServices] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form for adding services
    const [showAddForm, setShowAddForm] = useState(false);
    const [newService, setNewService] = useState({
        machineName: '',
        materialName: '',
        timeHours: '',
        timeMinutes: '',
        pricePerKg: ''
    });

    // Helper to format decimal hours into hours and minutes
    const formatTimePerTon = (hoursDecimal) => {
        if (!hoursDecimal) return 'N/A';
        const totalMinutes = Math.round(hoursDecimal * 60);
        const hrs = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
        if (hrs > 0) return `${hrs}h`;
        return `${mins}m`;
    };
    const [savingService, setSavingService] = useState(false);

    useEffect(() => {
        // We only care if user has loaded (and user is truthy)
        // If AuthContext is still loading, wait. If user is null, the AuthContext should redirect them to login anyway.
        if (!user) return;

        // Read userId from context OR directly from localStorage as fallback
        const uid = user.userId || parseInt(localStorage.getItem('userId'), 10);

        if (uid && !isNaN(uid)) {
            checkFactoryProfile(uid);
        } else {
            // No valid userId means stale/corrupt session — force fresh login
            console.warn('No userId found. Clearing session and redirecting to login.');
            localStorage.clear();
            // Redirect to login to fetch fresh tokens & id
            navigate('/login');
        }
    }, [user, navigate]);

    // ─── CORE FLOW LOGIC ──────────────────────────────────────────
    // Check if this factory user has already set up their profile.
    // If NO → redirect to profile setup page.
    // If YES → load their services.
    const checkFactoryProfile = async (userId) => {
        try {
            const res = await api.get(`/factories/user/${userId}`);
            const factoriesList = res.data;

            if (!factoriesList || factoriesList.length === 0) {
                // First time: no factory profile yet → go to setup
                navigate('/factory/setup');
            } else {
                // Returning user: profile exists → show dashboard
                setMyFactory(factoriesList[0]);
                await Promise.all([
                    loadServices(factoriesList[0].factoryId),
                    loadAnalytics(factoriesList[0].factoryId)
                ]);
                setLoading(false);
            }
        } catch (err) {
            console.error('Failed to check factory profile', err);
            // If 403/401 the token is expired — send them back to login
            if (err.response?.status === 401 || err.response?.status === 403) {
                localStorage.clear();
                navigate('/login');
            } else {
                setLoading(false);
            }
        }
    };

    const loadServices = async (factoryId) => {
        try {
            const res = await api.get(`/grinding-services/factory/${factoryId}`);
            setServices(res.data);
        } catch (err) {
            console.error('Failed to load services', err);
        }
    };

    const loadAnalytics = async (factoryId) => {
        try {
            const res = await api.get(`/factories/${factoryId}/analytics`);
            setAnalytics(res.data);
        } catch (err) {
            console.error('Failed to load analytics', err);
        }
    };

    const handleAddService = async (e) => {
        e.preventDefault();
        setSavingService(true);
        try {
            // Calculate total hours per Ton
            const hrs = parseInt(newService.timeHours || 0, 10);
            const mins = parseInt(newService.timeMinutes || 0, 10);
            const totalHoursPerTon = hrs + (mins / 60);

            const payload = {
                machineName: newService.machineName,
                materialName: newService.materialName,
                timePerQuintal: totalHoursPerTon, // Reusing this backend field to store 'Time per Ton' internally
                pricePerKg: newService.pricePerKg
            };

            await api.post(`/grinding-services/${myFactory.factoryId}`, payload);
            setNewService({ machineName: '', materialName: '', timeHours: '', timeMinutes: '', pricePerKg: '' });
            setShowAddForm(false);
            await loadServices(myFactory.factoryId);
        } catch (err) {
            console.error('Failed to add service', err);
        } finally {
            setSavingService(false);
        }
    };

    const handleDeleteService = async (serviceId) => {
        if (!window.confirm('Delete this service?')) return;
        try {
            await api.delete(`/grinding-services/${serviceId}`);
            await loadServices(myFactory.factoryId);
        } catch (err) {
            console.error('Failed to delete', err);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
                <Loader2 size={44} color="#0ea5e9" className="spinner" />
                <p style={{ color: 'var(--text-muted)' }}>Loading your factory...</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>

            {/* Header */}
            <div style={styles.header}>
                <div>
                    <div style={styles.factoryMeta}>
                        <Factory size={20} color="#0ea5e9" />
                        <span style={styles.factoryLabel}>Factory Dashboard</span>
                    </div>
                    <h1 style={styles.title}>{myFactory?.factoryName}</h1>
                    <p style={styles.location}>
                        <MapPin size={16} color="#10b981" /> {myFactory?.city}, {myFactory?.state}
                    </p>
                    {myFactory?.description && (
                        <p style={styles.description}>{myFactory.description}</p>
                    )}
                </div>

                <div style={styles.headerActions}>
                    <button className="btn-secondary" style={styles.editBtn} onClick={() => navigate('/factory/setup')}>
                        <Settings size={16} /> Edit Profile
                    </button>
                    <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
                        <Plus size={18} /> Add New Service
                    </button>
                </div>
            </div>

            {/* Analytics Insights */}
            {analytics && (
                <div style={{ marginBottom: '40px' }}>
                    <div style={styles.sectionTitle}>
                        <BarChart2 size={24} color="#0ea5e9" />
                        <h2>Dashboard Insights</h2>
                    </div>
                    <div style={styles.analyticsGrid}>
                        <div className="glass-card" style={styles.analyticCard}>
                            <div style={styles.analyticIconWrap}>
                                <Eye size={24} color="#8b5cf6" />
                            </div>
                            <div>
                                <h3 style={styles.analyticNumber}>{analytics.searchAppearances}</h3>
                                <p style={styles.analyticText}>Searches appeared in this week</p>
                            </div>
                        </div>

                        <div className="glass-card" style={styles.analyticCard}>
                            <div style={{ ...styles.analyticIconWrap, background: 'rgba(16, 185, 129, 0.1)' }}>
                                <MousePointerClick size={24} color="#10b981" />
                            </div>
                            <div>
                                <h3 style={styles.analyticNumber}>{analytics.contactClicks}</h3>
                                <p style={styles.analyticText}>Clients clicked to view your contact info</p>
                            </div>
                        </div>

                        <div className="glass-card" style={styles.analyticCard}>
                            <div style={{ ...styles.analyticIconWrap, background: 'rgba(236, 72, 153, 0.1)' }}>
                                <Heart size={24} color="#ec4899" />
                            </div>
                            <div>
                                <h3 style={styles.analyticNumber}>{analytics.favoritesCount}</h3>
                                <p style={styles.analyticText}>Clients have favorited your factory</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Service Form */}
            {showAddForm && (
                <div className="glass-card" style={styles.addForm}>
                    <h3 style={{ marginBottom: '20px' }}>➕ Add Grinding Service</h3>
                    <form onSubmit={handleAddService} style={styles.formGrid}>
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Machine Name</label>
                            <input
                                className="input-base"
                                placeholder="e.g. Cylindrical Grinder"
                                value={newService.machineName}
                                onChange={e => setNewService({ ...newService, machineName: e.target.value })}
                                required
                            />
                        </div>
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Material Name</label>
                            <input
                                className="input-base"
                                placeholder="e.g. Steel, Copper, Brass"
                                value={newService.materialName}
                                onChange={e => setNewService({ ...newService, materialName: e.target.value })}
                                required
                            />
                        </div>
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Time per Ton</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <input
                                        className="input-base"
                                        type="number"
                                        min="0"
                                        placeholder="Hours"
                                        value={newService.timeHours}
                                        onChange={e => setNewService({ ...newService, timeHours: e.target.value })}
                                        style={{ paddingRight: '40px' }}
                                    />
                                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>h</span>
                                </div>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <input
                                        className="input-base"
                                        type="number"
                                        min="0"
                                        max="59"
                                        placeholder="Minutes"
                                        value={newService.timeMinutes}
                                        onChange={e => setNewService({ ...newService, timeMinutes: e.target.value })}
                                        style={{ paddingRight: '40px' }}
                                    />
                                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>m</span>
                                </div>
                            </div>
                        </div>
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Price per KG (₹)</label>
                            <input
                                className="input-base"
                                type="number"
                                step="any"
                                placeholder="e.g. 15.00"
                                value={newService.pricePerKg}
                                onChange={e => setNewService({ ...newService, pricePerKg: e.target.value })}
                                required
                            />
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                            <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                            <button type="submit" className="btn-primary" disabled={savingService}>
                                {savingService ? <Loader2 size={16} className="spinner" /> : 'Save Service'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Services List */}
            <div style={styles.sectionTitle}>
                <h2>Your Grinding Services <span style={styles.badge}>{services.length}</span></h2>
            </div>

            {services.length === 0 ? (
                <div style={styles.emptyState}>
                    <Factory size={48} color="var(--text-muted)" />
                    <h3 style={{ marginTop: '16px', color: 'var(--text-muted)' }}>No services listed yet</h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Click <b>"Add New Service"</b> above to get started.</p>
                </div>
            ) : (
                <div style={styles.servicesGrid}>
                    {services.map(service => (
                        <div key={service.serviceId} className="glass-card" style={styles.serviceCard}>
                            <div style={styles.cardHeader}>
                                <div>
                                    <h3 style={styles.machineName}>{service.machineName}</h3>
                                    <span style={styles.materialTag}>{service.materialName}</span>
                                </div>
                                <button onClick={() => handleDeleteService(service.serviceId)} style={styles.deleteBtn} title="Delete service">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <div style={styles.cardStats}>
                                <div style={styles.stat}>
                                    <p style={styles.statLabel}>Price</p>
                                    <p style={styles.statValue}>₹{service.pricePerKg}<small> /KG</small></p>
                                </div>
                                <div style={styles.statDivider} />
                                <div style={styles.stat}>
                                    <p style={styles.statLabel}>Processing Speed</p>
                                    <p style={styles.statValue}>{formatTimePerTon(service.timePerQuintal)}<small> /Ton</small></p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', gap: '20px', flexWrap: 'wrap' },
    factoryMeta: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
    factoryLabel: { color: '#0ea5e9', fontWeight: '600', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' },
    title: { fontSize: '2.8rem', margin: 0, fontWeight: '800' },
    location: { display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginTop: '8px' },
    description: { color: 'var(--text-muted)', marginTop: '8px', maxWidth: '500px', lineHeight: '1.5' },
    headerActions: { display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 },
    editBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' },
    addForm: { padding: '28px', marginBottom: '40px', background: 'rgba(14, 165, 233, 0.05)', border: '1px solid rgba(14, 165, 233, 0.2)' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '0.85rem', fontWeight: '500', color: '#94a3b8' },
    sectionTitle: { marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' },
    badge: { background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9', padding: '2px 10px', borderRadius: '12px', fontSize: '1rem' },
    servicesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' },
    serviceCard: { padding: '24px', borderTop: '4px solid var(--accent-primary)', transition: 'transform 0.2s ease' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
    machineName: { fontSize: '1.3rem', margin: '0 0 6px 0' },
    materialTag: { display: 'inline-block', padding: '3px 10px', background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '500' },
    deleteBtn: { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 },
    cardStats: { display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '14px 20px', gap: '20px' },
    stat: { flex: 1, textAlign: 'center' },
    statLabel: { color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' },
    statValue: { color: '#10b981', fontWeight: '700', fontSize: '1.3rem' },
    statDivider: { width: '1px', height: '40px', background: 'var(--border-color)' },
    emptyState: { textAlign: 'center', padding: '80px 20px', border: '1px dashed var(--border-color)', borderRadius: '16px' },
    analyticsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' },
    analyticCard: { display: 'flex', alignItems: 'center', gap: '20px', padding: '24px' },
    analyticIconWrap: { width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    analyticNumber: { fontSize: '2rem', margin: '0 0 4px 0', fontWeight: '800', color: 'var(--text-main)' },
    analyticText: { margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.4' }
};

export default FactoryDashboard;
