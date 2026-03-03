import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Home, LogOut, User, Factory, ShieldCheck, MessageSquare, Briefcase, Bell } from 'lucide-react';
import api from '../services/api';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [unread, setUnread] = useState({ chats: 0, orders: 0 });

    useEffect(() => {
        let interval;
        if (user && (user.role === 'FACTORY' || user.role === 'CLIENT')) {
            const fetchNotifications = async () => {
                try {
                    const res = await api.get(`/notifications/${user.userId}/${user.role}`);
                    setUnread(res.data);
                } catch (err) {
                    // Ignore errors silently for polling
                }
            };
            fetchNotifications();
            interval = setInterval(fetchNotifications, 10000); // Check every 10 seconds
        }
        return () => clearInterval(interval);
    }, [user]);

    return (
        <nav style={styles.nav}>
            <div style={styles.container}>
                <div style={styles.brand} onClick={() => navigate('/')}>
                    <Factory size={28} color="#0ea5e9" />
                    <span style={styles.brandText}>
                        Grinding<span style={styles.brandAccent}>Hub</span>
                    </span>
                </div>

                <div style={styles.links}>
                    {user ? (
                        <>
                            {user.role === 'CLIENT' && (
                                <Link to="/client/dashboard" style={styles.link}>
                                    <Home size={18} /> Search Services
                                </Link>
                            )}
                            {user.role === 'FACTORY' && (
                                <Link to="/factory/dashboard" style={styles.link}>
                                    <Factory size={18} /> My Factory
                                </Link>
                            )}
                            {user.role === 'ADMIN' && (
                                <Link to="/admin/dashboard" style={{ ...styles.link, color: '#f43f5e' }}>
                                    <ShieldCheck size={18} /> Admin Panel
                                </Link>
                            )}
                            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)', margin: '0 5px' }}></div>

                            {(user.role === 'CLIENT' || user.role === 'FACTORY') && (
                                <Link to="/work-orders" style={{ ...styles.link, position: 'relative' }}>
                                    <Briefcase size={18} /> Orders
                                    {unread.orders > 0 && (
                                        <span style={styles.badge}>{unread.orders}</span>
                                    )}
                                </Link>
                            )}

                            <Link to="/messages" style={{ ...styles.link, position: 'relative', marginLeft: '5px', marginRight: '5px' }}>
                                <MessageSquare size={18} /> Messages
                                {unread.chats > 0 && (
                                    <span style={styles.badge}>{unread.chats}</span>
                                )}
                            </Link>

                            <button onClick={logout} className="btn-secondary" style={styles.logoutBtn}>
                                <LogOut size={16} /> Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" style={styles.link}>Login</Link>
                            <Link to="/register" className="btn-primary" style={{ marginLeft: '15px' }}>Sign Up</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

const styles = {
    nav: {
        height: 'var(--nav-height)',
        background: 'rgba(2, 6, 23, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border-color)',
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 100,
    },
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        height: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 20px',
    },
    brand: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
    },
    brandText: {
        fontSize: '1.5rem',
        fontWeight: '800',
        color: '#f8fafc',
        letterSpacing: '-1px',
        fontFamily: "'Outfit', sans-serif"
    },
    brandAccent: {
        color: 'var(--accent-primary)',
    },
    links: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
    },
    link: {
        color: 'var(--text-main)',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'color 0.2s',
    },
    badge: {
        position: 'absolute',
        top: '-8px',
        right: '-12px',
        backgroundColor: '#ef4444',
        color: 'white',
        fontSize: '0.7rem',
        fontWeight: 'bold',
        padding: '2px 6px',
        borderRadius: '10px',
        border: '2px solid rgba(2, 6, 23, 1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    logoutBtn: {
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    }
};

export default Navbar;
