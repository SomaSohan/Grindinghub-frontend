import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Factory, Trash2, Ban, ShieldCheck, Loader2 } from 'lucide-react';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [factories, setFactories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            const [usersRes, factoriesRes] = await Promise.all([
                api.get('/users'), // Requires ADMIN
                api.get('/factories') // We recently opened this for ADMIN
            ]);

            // Exclude admins from the display if desired, or keep everyone to see
            setUsers(usersRes.data || []);
            setFactories(factoriesRes.data || []);
        } catch (error) {
            console.error('Error fetching admin data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to permanently delete this user? This cannot be undone.")) return;

        try {
            await api.delete(`/users/${userId}`); // Requires ADMIN
            fetchAdminData(); // Refresh the list
        } catch (error) {
            console.error("Failed to delete user", error);
            alert("Could not delete user.");
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <Loader2 size={44} color="#f43f5e" className="spinner" />
                <p style={{ color: 'var(--text-muted)' }}>Loading Admin Portal...</p>
            </div>
        );
    }

    // Analytics
    const totalClients = users.filter(u => u.role === 'CLIENT').length;
    const totalFactories = users.filter(u => u.role === 'FACTORY').length;
    const totalAdmins = users.filter(u => u.role === 'ADMIN').length;

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={styles.titleWrap}>
                    <ShieldCheck size={36} color="#f43f5e" />
                    <h1 style={styles.title}>Admin Portal</h1>
                </div>
                <p style={styles.subtitle}>System Overview & Management</p>
            </header>

            {/* Quick Stats */}
            <div style={styles.statsGrid}>
                <div className="glass-card" style={styles.statCard}>
                    <Users size={32} color="#0ea5e9" />
                    <div>
                        <h3 style={styles.statNumber}>{totalClients}</h3>
                        <p style={styles.statLabel}>Total Clients</p>
                    </div>
                </div>
                <div className="glass-card" style={styles.statCard}>
                    <Factory size={32} color="#10b981" />
                    <div>
                        <h3 style={styles.statNumber}>{totalFactories}</h3>
                        <p style={styles.statLabel}>Registered Factories</p>
                    </div>
                </div>
                <div className="glass-card" style={styles.statCard}>
                    <ShieldCheck size={32} color="#f43f5e" />
                    <div>
                        <h3 style={styles.statNumber}>{totalAdmins}</h3>
                        <p style={styles.statLabel}>System Admins</p>
                    </div>
                </div>
            </div>

            {/* User Management Section */}
            <div className="glass-card" style={styles.tableCard}>
                <div style={styles.tableHeader}>
                    <h2>User Management</h2>
                </div>

                <div style={styles.tableResponsive}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>ID</th>
                                <th style={styles.th}>Name</th>
                                <th style={styles.th}>Email</th>
                                <th style={styles.th}>Role</th>
                                <th style={styles.th}>Phone</th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.userId} style={styles.tr}>
                                    <td style={styles.td}>{user.userId}</td>
                                    <td style={styles.td}><b>{user.name}</b></td>
                                    <td style={styles.td}>{user.email}</td>
                                    <td style={styles.td}>
                                        <span style={{
                                            ...styles.roleBadge,
                                            background: user.role === 'ADMIN' ? 'rgba(244, 63, 94, 0.1)' :
                                                user.role === 'FACTORY' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(14, 165, 233, 0.1)',
                                            color: user.role === 'ADMIN' ? '#f43f5e' :
                                                user.role === 'FACTORY' ? '#10b981' : '#0ea5e9',
                                        }}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={styles.td}>{user.phone || 'N/A'}</td>
                                    <td style={styles.td}>
                                        {user.role !== 'ADMIN' && (
                                            <button
                                                style={styles.deleteBtn}
                                                onClick={() => handleDeleteUser(user.userId)}
                                                title="Delete User"
                                            >
                                                <Ban size={16} /> Suspend/Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' },
    header: { marginBottom: '40px' },
    titleWrap: { display: 'flex', alignItems: 'center', gap: '12px' },
    title: { fontSize: '2.5rem', margin: 0 },
    subtitle: { color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '8px' },

    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' },
    statCard: { display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', borderTop: '4px solid var(--border-color)' },
    statNumber: { fontSize: '2.5rem', fontWeight: 'bold', margin: '0 0 5px 0' },
    statLabel: { color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' },

    tableCard: { padding: '0', overflow: 'hidden' },
    tableHeader: { padding: '24px', borderBottom: '1px solid var(--border-color)' },
    tableResponsive: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    th: { padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', background: 'rgba(255,255,255,0.02)' },
    td: { padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' },
    tr: { transition: 'background 0.2s ease', ':hover': { background: 'rgba(255,255,255,0.02)' } },

    roleBadge: { padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' },
    deleteBtn: { background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s ease' }
};

export default AdminDashboard;
