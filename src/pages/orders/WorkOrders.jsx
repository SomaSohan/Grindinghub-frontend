import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { Briefcase, Loader2, Target, CalendarDays, CheckCircle, XCircle, Clock, Truck, Hammer } from 'lucide-react';

const WorkOrders = () => {
    const { user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        if (user) {
            loadOrders();
        }
    }, [user]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const role = user.role.toLowerCase();
            const id = user.userId;
            const res = await api.get(`/work-orders/${role}/${id}`);
            // Sort by newest first
            const sorted = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setOrders(sorted);
        } catch (error) {
            console.error("Failed to load work orders", error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId, newStatus) => {
        setUpdatingId(orderId);
        try {
            await api.put(`/work-orders/${orderId}/status`, { status: newStatus });
            setOrders(orders.map(o => o.orderId === orderId ? { ...o, status: newStatus } : o));
        } catch (error) {
            console.error("Failed to update status", error);
        } finally {
            setUpdatingId(null);
        }
    };

    const getStatusUI = (status) => {
        switch (status) {
            case 'PENDING': return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: Clock, label: 'Pending Approval' };
            case 'ACCEPTED': return { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', icon: CheckCircle, label: 'Accepted by Factory' };
            case 'IN_PROGRESS': return { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', icon: Hammer, label: 'Grinding in Progress' };
            case 'READY': return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: Truck, label: 'Ready for Pickup' };
            case 'DECLINED': return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', icon: XCircle, label: 'Declined' };
            default: return { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)', icon: Briefcase, label: status };
        }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Work Orders</h1>
                <p style={styles.subtitle}>Track and manage your grinding service requests</p>
            </header>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '60px' }}>
                    <Loader2 size={40} className="spinner" color="#0ea5e9" />
                </div>
            ) : orders.length === 0 ? (
                <div style={styles.emptyState}>
                    <Briefcase size={48} color="var(--text-muted)" />
                    <h3 style={{ marginTop: '16px' }}>No Work Orders found</h3>
                    <p>You don't have any active service requests right now.</p>
                </div>
            ) : (
                <div style={styles.grid}>
                    {orders.map(order => {
                        const sUi = getStatusUI(order.status);
                        const StatusIcon = sUi.icon;
                        const isClient = user.role === 'CLIENT';

                        return (
                            <div key={order.orderId} className="glass-card" style={styles.card}>
                                <div style={styles.cardHeader}>
                                    <div style={styles.orderId}>Order #{order.orderId}</div>
                                    <div style={{ ...styles.badge, color: sUi.color, background: sUi.bg }}>
                                        <StatusIcon size={14} /> {sUi.label}
                                    </div>
                                </div>

                                <div style={styles.infoGrid}>
                                    <div style={styles.infoBox}>
                                        <Target size={18} color="#0ea5e9" />
                                        <div>
                                            <div style={styles.lbl}>Service Details</div>
                                            <div style={styles.val}>{order.service?.machineName} - {order.service?.materialName}</div>
                                        </div>
                                    </div>
                                    <div style={styles.infoBox}>
                                        <Briefcase size={18} color="#8b5cf6" />
                                        <div>
                                            <div style={styles.lbl}>{isClient ? 'Factory Name' : 'Client Name'}</div>
                                            <div style={styles.val}>{isClient ? order.factory?.factoryName : order.client?.name}</div>
                                        </div>
                                    </div>
                                    <div style={styles.infoBox}>
                                        <CalendarDays size={18} color="#f59e0b" />
                                        <div>
                                            <div style={styles.lbl}>Preferred Date</div>
                                            <div style={styles.val}>{order.preferredDate}</div>
                                        </div>
                                    </div>
                                    <div style={styles.infoBox}>
                                        <Truck size={18} color="#10b981" />
                                        <div>
                                            <div style={styles.lbl}>Material Weight</div>
                                            <div style={styles.val}>{order.weightInTons} Tons</div>
                                        </div>
                                    </div>
                                </div>

                                {/* FACTORY CONTROLS */}
                                {!isClient && order.status !== 'DECLINED' && order.status !== 'READY' && (
                                    <div style={styles.controls}>
                                        {order.status === 'PENDING' && (
                                            <>
                                                <button
                                                    className="btn-primary"
                                                    style={{ flex: 1, background: '#10b981' }}
                                                    onClick={() => updateStatus(order.orderId, 'ACCEPTED')}
                                                    disabled={updatingId === order.orderId}
                                                >
                                                    {updatingId === order.orderId ? <Loader2 size={16} className="spinner" /> : 'Accept'}
                                                </button>
                                                <button
                                                    className="btn-secondary"
                                                    style={{ flex: 1, color: '#ef4444' }}
                                                    onClick={() => updateStatus(order.orderId, 'DECLINED')}
                                                    disabled={updatingId === order.orderId}
                                                >
                                                    Decline
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'ACCEPTED' && (
                                            <button
                                                className="btn-primary"
                                                style={{ width: '100%', background: '#8b5cf6' }}
                                                onClick={() => updateStatus(order.orderId, 'IN_PROGRESS')}
                                                disabled={updatingId === order.orderId}
                                            >
                                                Start Grinding Process
                                            </button>
                                        )}
                                        {order.status === 'IN_PROGRESS' && (
                                            <button
                                                className="btn-primary"
                                                style={{ width: '100%', background: '#10b981' }}
                                                onClick={() => updateStatus(order.orderId, 'READY')}
                                                disabled={updatingId === order.orderId}
                                            >
                                                Mark as Ready for Pickup
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', minHeight: 'calc(100vh - var(--nav-height))' },
    header: { textAlign: 'center', marginBottom: '40px' },
    title: { fontSize: '2.5rem', marginBottom: '10px' },
    subtitle: { color: 'var(--text-muted)', fontSize: '1.2rem' },
    emptyState: { textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border-color)' },
    grid: { display: 'flex', flexDirection: 'column', gap: '20px' },
    card: { padding: '24px' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' },
    orderId: { fontSize: '1.2rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif" },
    badge: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 },
    infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' },
    infoBox: { display: 'flex', gap: '12px', alignItems: 'flex-start' },
    lbl: { fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' },
    val: { fontSize: '1rem', fontWeight: 500, color: 'var(--text-main)', wordBreak: 'break-word' },
    controls: { display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }
};

export default WorkOrders;
