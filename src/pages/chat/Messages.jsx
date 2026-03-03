import React, { useState, useEffect, useContext, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { Send, User as UserIcon, Loader2, ArrowLeft, MessageSquare } from 'lucide-react';

const Messages = () => {
    const { user } = useContext(AuthContext);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const chatContainerRef = useRef(null);

    const [contacts, setContacts] = useState([]);
    const [activeContact, setActiveContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);

    // Initial load: Fetch contacts
    useEffect(() => {
        if (!user) return;
        fetchContacts();
    }, [user]);

    // Check URL to see if we should auto-open a chat with a specific user
    useEffect(() => {
        if (!user || loadingContacts) return;

        const autoOpenUserId = searchParams.get('userId');
        const autoOpenUserName = searchParams.get('name');

        if (autoOpenUserId && autoOpenUserName) {
            const userIdInt = parseInt(autoOpenUserId, 10);

            // Check if this user is already in contacts
            const existingContact = contacts.find(c => c.userId === userIdInt);

            if (existingContact) {
                openChat(existingContact);
            } else {
                // If not in contacts, temporarily add them to the top of the list so we can chat
                const tempContact = {
                    userId: userIdInt,
                    name: autoOpenUserName,
                    role: 'User'
                };
                setContacts(prev => [tempContact, ...prev]);
                openChat(tempContact);
            }
        }
    }, [searchParams, loadingContacts, user]);

    // Polling mechanism for new messages
    useEffect(() => {
        if (!activeContact || !user) return;

        const interval = setInterval(() => {
            pollMessages(activeContact.userId);
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(interval);
    }, [activeContact, user]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchContacts = async () => {
        setLoadingContacts(true);
        try {
            const res = await api.get(`/chat/contacts/${user.userId}`);
            setContacts(res.data);
        } catch (error) {
            console.error("Failed to load contacts", error);
        } finally {
            setLoadingContacts(false);
        }
    };

    const openChat = async (contact) => {
        setActiveContact(contact);
        setLoadingMessages(true);
        try {
            const res = await api.get(`/chat/conversation/${user.userId}/${contact.userId}`);
            setMessages(res.data);
        } catch (error) {
            console.error("Failed to load conversation", error);
        } finally {
            setLoadingMessages(false);
        }
    };

    const pollMessages = async (contactId) => {
        try {
            const res = await api.get(`/chat/conversation/${user.userId}/${contactId}`);
            // Only update state if message length changed to avoid flashing UI
            setMessages(prev => {
                if (prev.length !== res.data.length) return res.data;
                return prev;
            });
        } catch (error) {
            // silent fail on polling 
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeContact) return;

        const payload = {
            senderId: user.userId,
            receiverId: activeContact.userId,
            content: newMessage.trim(),
        };

        try {
            // Optimistically update UI
            const optimisticMsg = { ...payload, id: Date.now(), timestamp: new Date().toISOString() };
            setMessages(prev => [...prev, optimisticMsg]);
            setNewMessage('');

            // Send to DB
            await api.post('/chat', payload);

            // Re-fetch properly
            pollMessages(activeContact.userId);

            // If this is the first message to a temporary contact, refresh contacts list fully
            if (messages.length === 0) {
                fetchContacts();
            }
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    return (
        <div style={styles.container}>
            <div className="glass-card" style={styles.chatWrapper}>

                {/* Sidebar: Contacts List */}
                <div style={{ ...styles.sidebar, display: activeContact && window.innerWidth < 768 ? 'none' : 'flex' }}>
                    <div style={styles.sidebarHeader}>
                        <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Messages</h2>
                    </div>

                    <div style={styles.contactsList}>
                        {loadingContacts ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                                <Loader2 size={24} className="spinner" color="#0ea5e9" />
                            </div>
                        ) : contacts.length === 0 ? (
                            <div style={styles.emptyContacts}>
                                <MessageSquare size={32} color="var(--text-muted)" />
                                <p style={{ marginTop: '10px' }}>No conversations yet.</p>
                            </div>
                        ) : (
                            contacts.map(contact => (
                                <div
                                    key={contact.userId}
                                    style={{
                                        ...styles.contactItem,
                                        ...(activeContact?.userId === contact.userId ? styles.activeContactItem : {})
                                    }}
                                    onClick={() => openChat(contact)}
                                >
                                    <div style={styles.avatar}>
                                        <UserIcon size={20} color={activeContact?.userId === contact.userId ? '#fff' : '#0ea5e9'} />
                                    </div>
                                    <div>
                                        <div style={styles.contactName}>{contact.name}</div>
                                        <div style={styles.contactRole}>{contact.role}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Area: Chat Window */}
                <div style={{ ...styles.chatArea, display: !activeContact && window.innerWidth < 768 ? 'none' : 'flex' }}>
                    {!activeContact ? (
                        <div style={styles.emptyChat}>
                            <MessageSquare size={64} color="var(--border-color)" />
                            <h3 style={{ marginTop: '20px', color: 'var(--text-muted)' }}>Select a conversation</h3>
                            <p style={{ color: 'var(--text-muted)' }}>Choose a contact from the sidebar to start chatting</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div style={styles.chatHeader}>
                                <button className="mobile-only-btn" style={styles.backBtn} onClick={() => setActiveContact(null)}>
                                    <ArrowLeft size={20} />
                                </button>
                                <div style={styles.avatar}>
                                    <UserIcon size={20} color="#0ea5e9" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{activeContact.name}</h3>
                                    <span style={{ fontSize: '0.8rem', color: '#10b981' }}>{activeContact.role}</span>
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <div style={styles.messagesContainer} ref={chatContainerRef}>
                                {loadingMessages ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                                        <Loader2 size={30} className="spinner" color="#0ea5e9" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div style={styles.emptyMessages}>
                                        Send a message to start the conversation!
                                    </div>
                                ) : (
                                    messages.map((msg, index) => {
                                        const isMine = msg.senderId === user.userId;
                                        return (
                                            <div key={msg.id || index} style={{
                                                ...styles.messageRow,
                                                justifyContent: isMine ? 'flex-end' : 'flex-start'
                                            }}>
                                                <div style={{
                                                    ...styles.messageBubble,
                                                    background: isMine ? '#0ea5e9' : 'rgba(255,255,255,0.05)',
                                                    color: isMine ? '#fff' : 'var(--text-main)',
                                                    borderBottomRightRadius: isMine ? '4px' : '16px',
                                                    borderBottomLeftRadius: !isMine ? '4px' : '16px',
                                                }}>
                                                    {msg.content}
                                                    <div style={{
                                                        ...styles.messageTime,
                                                        color: isMine ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)'
                                                    }}>
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Message Input */}
                            <form style={styles.inputArea} onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    className="input-base"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    style={styles.messageInput}
                                    autoComplete="off"
                                />
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    style={styles.sendBtn}
                                    disabled={!newMessage.trim()}
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        height: 'calc(100vh - 100px)'
    },
    chatWrapper: {
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
        padding: 0
    },
    sidebar: {
        width: '320px',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(0,0,0,0.1)'
    },
    sidebarHeader: {
        padding: '24px',
        borderBottom: '1px solid var(--border-color)',
    },
    contactsList: {
        flex: 1,
        overflowY: 'auto',
    },
    contactItem: {
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        borderBottom: '1px solid rgba(255,255,255,0.02)',
        transition: 'background 0.2s',
    },
    activeContactItem: {
        background: 'rgba(14, 165, 233, 0.1)',
        borderLeft: '4px solid #0ea5e9'
    },
    avatar: {
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
    },
    contactName: {
        fontWeight: '600',
        color: 'var(--text-main)'
    },
    contactRole: {
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        textTransform: 'capitalize'
    },
    emptyContacts: {
        padding: '40px 20px',
        textAlign: 'center',
        color: 'var(--text-muted)'
    },
    chatArea: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(0,0,0,0.2)'
    },
    emptyChat: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
    },
    chatHeader: {
        padding: '20px 24px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        background: 'rgba(255,255,255,0.02)'
    },
    backBtn: {
        background: 'none',
        border: 'none',
        color: 'var(--text-main)',
        cursor: 'pointer',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    messagesContainer: {
        flex: 1,
        padding: '24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    emptyMessages: {
        textAlign: 'center',
        color: 'var(--text-muted)',
        marginTop: 'auto',
        marginBottom: 'auto'
    },
    messageRow: {
        display: 'flex',
        width: '100%'
    },
    messageBubble: {
        maxWidth: '70%',
        padding: '12px 16px',
        borderRadius: '16px',
        position: 'relative',
        wordBreak: 'break-word'
    },
    messageTime: {
        fontSize: '0.65rem',
        marginTop: '6px',
        textAlign: 'right'
    },
    inputArea: {
        padding: '20px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        gap: '12px',
        background: 'rgba(255,255,255,0.02)'
    },
    messageInput: {
        flex: 1,
        borderRadius: '24px',
        paddingLeft: '20px'
    },
    sendBtn: {
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
    }
};

export default Messages;
