import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { Search, MapPin, Factory, Target, Loader2, Mail, Phone, X, ExternalLink, Navigation, Heart, MessageSquare } from 'lucide-react';

const SearchDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('material'); // material, machine, city

    // Favorites state
    const [favorites, setFavorites] = useState(new Set());
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    // Modal State
    const [selectedService, setSelectedService] = useState(null);
    const [selectedFactory, setSelectedFactory] = useState(null);
    const [contactInfo, setContactInfo] = useState(null);
    const [loadingContact, setLoadingContact] = useState(false);

    // Booking State
    const [bookingMode, setBookingMode] = useState(false);
    const [weight, setWeight] = useState('');
    const [date, setDate] = useState('');
    const [bookingLoad, setBookingLoad] = useState(false);

    // Location features
    const [clientLocation, setClientLocation] = useState(null);
    const [locating, setLocating] = useState(false);

    // Helper to format decimal hours into hours and minutes
    const formatTimePerTon = (hoursDecimal) => {
        if (!hoursDecimal) return 'N/A';
        const totalMinutes = Math.round(hoursDecimal * 60);
        const hrs = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m / Ton`;
        if (hrs > 0) return `${hrs}h / Ton`;
        return `${mins}m / Ton`;
    };

    // Haversine formula to calculate distance in KM between two coordinates
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity; // Return high number if no GPS data
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    };

    useEffect(() => {
        // Initially load all services and favorites
        fetchAllServices();
        if (user?.userId) {
            fetchFavorites();
        }
    }, [user]);

    const fetchFavorites = async () => {
        try {
            const res = await api.get(`/favorites/user/${user.userId}`);
            const favSet = new Set(res.data.map(f => f.factoryId));
            setFavorites(favSet);
        } catch (err) {
            console.error("Failed to load favorites", err);
        }
    };

    const toggleFavorite = async (factoryId) => {
        if (!user) return;

        const isFav = favorites.has(factoryId);
        try {
            if (isFav) {
                await api.delete(`/favorites/user/${user.userId}/factory/${factoryId}`);
                setFavorites(prev => {
                    const next = new Set(prev);
                    next.delete(factoryId);
                    return next;
                });
            } else {
                await api.post('/favorites', {
                    userId: user.userId,
                    factoryId: factoryId
                });
                setFavorites(prev => {
                    const next = new Set(prev);
                    next.add(factoryId);
                    return next;
                });
            }
        } catch (error) {
            console.error("Failed to toggle favorite", error);
        }
    };

    const fetchAllServices = async () => {
        setLoading(true);
        try {
            const res = await api.get('/grinding-services');
            setServices(res.data);
        } catch (err) {
            console.error("Failed to load", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSortByDistance = () => {
        if (!navigator.geolocation) {
            return alert("Geolocation is not supported by your browser");
        }

        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setClientLocation({ lat: latitude, lng: longitude });

                const sortedServices = [...services].map(service => {
                    const dist = calculateDistance(latitude, longitude, service.factory?.latitude, service.factory?.longitude);
                    return { ...service, distanceKm: dist };
                }).sort((a, b) => a.distanceKm - b.distanceKm);

                setServices(sortedServices);
                setLocating(false);
            },
            (error) => {
                console.error("Error getting location", error);
                alert("Failed to get your location. Please ensure location permissions are granted.");
                setLocating(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            return fetchAllServices();
        }

        setLoading(true);
        try {
            let res;
            if (searchType === 'material') {
                res = await api.get(`/grinding-services/material/${searchTerm}`);
                setServices(res.data);
            } else if (searchType === 'machine') {
                res = await api.get(`/grinding-services/machine/${searchTerm}`);
                setServices(res.data);
            } else if (searchType === 'city') {
                // Search factory by city
                const facRes = await api.get(`/factories/city/${searchTerm}`);
                const cityFactories = facRes.data;
                // Collect services from all these factories
                let cityServices = [];
                for (let fac of cityFactories) {
                    const sRes = await api.get(`/grinding-services/factory/${fac.factoryId}`);
                    cityServices = [...cityServices, ...sRes.data];
                }
                setServices(cityServices);
            }
        } catch (err) {
            console.error("Search failed", err);
            setServices([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenContact = async (service) => {
        setSelectedService(service);
        setSelectedFactory(service.factory);
        setContactInfo(null);
        setBookingMode(false);
        setLoadingContact(true);
        try {
            const res = await api.get(`/users/contact/${service.factory.userId}`);
            setContactInfo(res.data);
        } catch (err) {
            console.error("Failed to load contact info", err);
        } finally {
            setLoadingContact(false);
        }
    };

    const handleBookService = async (e) => {
        e.preventDefault();
        setBookingLoad(true);
        try {
            await api.post('/work-orders', {
                clientId: user.userId,
                factoryId: selectedFactory.factoryId,
                serviceId: selectedService.serviceId,
                weightInTons: weight,
                preferredDate: date
            });
            alert('Request sent successfully! You can track it in your Work Orders.');
            closeContactModal();
        } catch (err) {
            console.error("Booking failed", err);
            alert("Failed to send request");
        } finally {
            setBookingLoad(false);
        }
    };

    const closeContactModal = () => {
        setSelectedFactory(null);
        setSelectedService(null);
        setContactInfo(null);
        setBookingMode(false);
        setWeight('');
        setDate('');
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Service Discovery Hub</h1>
                <p style={styles.subtitle}>Find verified grinding services tailored to your needs</p>
            </header>

            {/* Search Bar */}
            <section className="glass-card" style={styles.searchSection}>
                <form onSubmit={handleSearch} style={styles.searchForm}>
                    <div style={styles.searchWrap}>
                        <Search style={styles.searchIcon} size={20} />
                        <input
                            type="text"
                            className="input-base"
                            placeholder={`Search by ${searchType}...`}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '45px', fontSize: '1.1rem', height: '50px' }}
                        />
                    </div>

                    <select
                        className="input-base"
                        style={styles.select}
                        value={searchType}
                        onChange={e => setSearchType(e.target.value)}
                    >
                        <option value="material">By Material</option>
                        <option value="machine">By Machine Name</option>
                        <option value="city">By City Location</option>
                    </select>

                    <button type="submit" className="btn-primary" style={{ padding: '0 30px' }}>
                        Find Services
                    </button>

                    <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '0 20px', display: 'flex', gap: '8px', alignItems: 'center' }}
                        onClick={handleSortByDistance}
                        disabled={locating || services.length === 0}
                    >
                        {locating ? <Loader2 size={18} className="spinner" /> : <Navigation size={18} />}
                        {locating ? 'Locating...' : 'Near Me'}
                    </button>

                    <button
                        type="button"
                        className={showFavoritesOnly ? "btn-primary" : "btn-secondary"}
                        style={{ padding: '0 20px', display: 'flex', gap: '8px', alignItems: 'center' }}
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    >
                        <Heart size={18} fill={showFavoritesOnly ? "white" : "transparent"} color={showFavoritesOnly ? "white" : "var(--text-main)"} />
                        Favorites
                    </button>
                </form>
            </section>

            {/* Results */}
            <section>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '60px' }}>
                        <Loader2 size={40} className="spinner" color="#0ea5e9" />
                    </div>
                ) : services.length === 0 ? (
                    <div style={styles.emptyState}>
                        <Target size={48} color="var(--text-muted)" />
                        <h3 style={{ marginTop: '16px' }}>No services found</h3>
                        <p>Try adjusting your search terms or filter.</p>
                    </div>
                ) : (
                    <div style={styles.resultsGrid}>
                        {services.filter(s => showFavoritesOnly ? favorites.has(s.factory.factoryId) : true).map(service => (
                            <div key={service.serviceId} className="glass-card" style={styles.resultCard}>
                                <div style={styles.cardHeader}>
                                    <div>
                                        <h3 style={styles.machineTitle}>{service.machineName}</h3>
                                        <span style={styles.priceTag}>${service.pricePerKg} <small>/KG</small></span>
                                    </div>
                                    <button
                                        style={styles.heartBtn}
                                        onClick={() => toggleFavorite(service.factory.factoryId)}
                                        title={favorites.has(service.factory.factoryId) ? "Remove from Favorites" : "Save as Favorite"}
                                    >
                                        <Heart
                                            size={24}
                                            color={favorites.has(service.factory.factoryId) ? "#ef4444" : "var(--text-muted)"}
                                            fill={favorites.has(service.factory.factoryId) ? "#ef4444" : "transparent"}
                                        />
                                    </button>
                                </div>

                                <div style={styles.cardBody}>
                                    <div style={styles.infoRow}>
                                        <Target size={16} color="#0ea5e9" />
                                        <span>Material: <b>{service.materialName}</b></span>
                                    </div>
                                    <div style={styles.infoRow}>
                                        <Loader2 size={16} color="#f59e0b" style={{ transform: 'none', animation: 'none' }} />
                                        <span>Speed: <b>{formatTimePerTon(service.timePerQuintal)}</b></span>
                                    </div>
                                    <div style={styles.infoRow}>
                                        <Factory size={16} color="#8b5cf6" />
                                        <span>{service.factory.factoryName}</span>
                                    </div>
                                    <div style={styles.infoRow}>
                                        <MapPin size={16} color="#10b981" />
                                        <span>{service.factory.city}, {service.factory.state}</span>
                                    </div>
                                    {clientLocation && service.distanceKm !== undefined && service.distanceKm !== Infinity && (
                                        <div style={styles.infoRow}>
                                            <Navigation size={16} color="#ec4899" />
                                            <span>Distance: <b style={{ color: '#ec4899' }}>{service.distanceKm.toFixed(1)} km away</b></span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    className="btn-secondary"
                                    style={styles.contactBtn}
                                    onClick={() => handleOpenContact(service)}
                                >
                                    Contact & Request
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Contact Modal */}
            {selectedFactory && (
                <div style={styles.modalOverlay} onClick={closeContactModal}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button style={styles.closeBtn} onClick={closeContactModal}>
                            <X size={24} />
                        </button>

                        <div style={{ ...styles.modalHeader, marginBottom: '20px' }}>
                            <div style={styles.factoryMeta}>
                                <Factory size={28} color="#0ea5e9" />
                            </div>
                            <h2 style={{ margin: '10px 0 5px', fontSize: '1.8rem' }}>{selectedFactory.factoryName}</h2>
                            <p style={{ color: 'var(--text-muted)', margin: 0 }}>{selectedFactory.description}</p>
                        </div>

                        {/* Action Toggle */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button
                                style={{ flex: 1, padding: '10px', background: !bookingMode ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                onClick={() => setBookingMode(false)}
                            >
                                Contact Info
                            </button>
                            <button
                                style={{ flex: 1, padding: '10px', background: bookingMode ? '#10b981' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                onClick={() => setBookingMode(true)}
                            >
                                Request Service
                            </button>
                        </div>

                        {!bookingMode ? (
                            <>
                                <div style={{ ...styles.infoSection, marginTop: '20px' }}>
                                    <h4 style={styles.infoTitle}>Location Details</h4>
                                    <p style={styles.contactRow}>
                                        <MapPin size={18} color="#10b981" />
                                        {selectedFactory.address}, {selectedFactory.city}, {selectedFactory.state}
                                    </p>

                                    {(selectedFactory.latitude && selectedFactory.longitude) && (
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${selectedFactory.latitude},${selectedFactory.longitude}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="btn-secondary"
                                            style={styles.mapBtn}
                                        >
                                            <ExternalLink size={16} /> Open in Google Maps
                                        </a>
                                    )}
                                </div>

                                <div style={{ ...styles.infoSection, marginTop: '20px' }}>
                                    <h4 style={styles.infoTitle}>Contact Owner</h4>
                                    {loadingContact ? (
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--text-muted)' }}>
                                            <Loader2 size={16} className="spinner" /> Loading details...
                                        </div>
                                    ) : contactInfo ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <p style={styles.contactRow}>
                                                <Target size={18} color="#8b5cf6" />
                                                <b>{contactInfo.name}</b>
                                            </p>
                                            <p style={styles.contactRow}>
                                                <Phone size={18} color="#0ea5e9" />
                                                <a href={`tel:${contactInfo.phone}`} style={{ color: 'var(--text-main)', textDecoration: 'none' }}>
                                                    {contactInfo.phone || "Not available"}
                                                </a>
                                            </p>
                                            <p style={styles.contactRow}>
                                                <Mail size={18} color="#f59e0b" />
                                                <a href={`mailto:${contactInfo.email}`} style={{ color: 'var(--text-main)', textDecoration: 'none' }}>
                                                    {contactInfo.email}
                                                </a>
                                            </p>
                                            <button
                                                className="btn-primary"
                                                style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                                onClick={() => navigate(`/messages?userId=${selectedFactory.userId}&name=${encodeURIComponent(selectedFactory.factoryName)}`)}
                                            >
                                                <MessageSquare size={18} /> Message Factory Owner
                                            </button>
                                        </div>
                                    ) : (
                                        <p style={{ color: '#ef4444' }}>Could not fetch contact details.</p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <form onSubmit={handleBookService} style={{ ...styles.infoSection, marginTop: '20px' }}>
                                <h4 style={styles.infoTitle}>Service Request</h4>
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Service Selected</div>
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <b>{selectedService.machineName}</b> - {selectedService.materialName}<br />
                                        <small style={{ color: '#10b981' }}>${selectedService.pricePerKg} / KG</small>
                                    </div>
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Material Weight (Tons)</label>
                                    <input
                                        type="number"
                                        className="input-base"
                                        min="0.1" step="0.1"
                                        required
                                        value={weight}
                                        onChange={e => setWeight(e.target.value)}
                                        placeholder="e.g., 5.5"
                                    />
                                </div>
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Preferred Delivery Date</label>
                                    <input
                                        type="date"
                                        className="input-base"
                                        required
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="btn-primary" style={{ width: '100%', background: '#10b981' }} disabled={bookingLoad}>
                                    {bookingLoad ? <Loader2 className="spinner" size={18} /> : 'Submit Request'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' },
    header: { textAlign: 'center', marginBottom: '40px' },
    title: { fontSize: '2.5rem', marginBottom: '10px' },
    subtitle: { color: 'var(--text-muted)', fontSize: '1.2rem' },
    searchSection: { padding: '20px', marginBottom: '40px' },
    searchForm: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
    searchWrap: { position: 'relative', flex: '1 1 300px' },
    searchIcon: { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' },
    select: { flex: '0 0 200px', height: '50px', appearance: 'none', background: 'var(--bg-card)' },
    emptyState: { textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' },
    resultsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' },
    resultCard: { padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', borderTop: '4px solid #0ea5e9' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
    machineTitle: { fontSize: '1.4rem', margin: 0, fontWeight: '700' },
    priceTag: { background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '6px 12px', borderRadius: '16px', fontWeight: 'bold', display: 'inline-block', marginTop: '8px' },
    cardBody: { display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1, marginBottom: '24px' },
    infoRow: { display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)' },
    contactBtn: { width: '100%', padding: '12px' },
    heartBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', transition: 'transform 0.2s', ':active': { transform: 'scale(0.9)' } },
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { background: 'var(--bg-card)', padding: '40px', borderRadius: '16px', width: '90%', maxWidth: '500px', position: 'relative', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' },
    closeBtn: { position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' },
    factoryMeta: { width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    infoSection: { background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' },
    infoTitle: { margin: '0 0 16px 0', fontSize: '1rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' },
    contactRow: { display: 'flex', alignItems: 'center', gap: '12px', margin: 0, color: 'var(--text-main)' },
    mapBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', marginTop: '16px', textDecoration: 'none' }
};

export default SearchDashboard;
