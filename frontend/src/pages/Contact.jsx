import React, { useState, useEffect, useRef } from 'react';
import contactBannerBg from '../assets/contact_banner.png';
import { FiSend, FiMessageSquare, FiUser, FiMail, FiPhone, FiMapPin, FiClock, FiCheck, FiTrash2 } from 'react-icons/fi';

const Contact = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: '',
    message: '',
  });

  const [toastMessage, setToastMessage] = useState('');

  // Live Chat Box State - auto fill from signed in user if available
  const [chatEmail, setChatEmail] = useState(() => {
    const saved = localStorage.getItem('chatUserEmail');
    if (saved) return saved;
    try {
      const u = JSON.parse(localStorage.getItem('user'));
      return u?.email || '';
    } catch (e) { return ''; }
  });

  const [chatName, setChatName] = useState(() => {
    const saved = localStorage.getItem('chatUserName');
    if (saved) return saved;
    try {
      const u = JSON.parse(localStorage.getItem('user'));
      return u?.name || u?.firstName || (u?.email ? u.email.split('@')[0] : '');
    } catch (e) { return ''; }
  });

  const [chatStarted, setChatStarted] = useState(() => {
    if (localStorage.getItem('chatUserEmail')) return true;
    try {
      const u = JSON.parse(localStorage.getItem('user'));
      return Boolean(u?.email);
    } catch (e) { return false; }
  });

  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const chatContainerRef = useRef(null);

  // Sync user info on mount if user signs in later
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user'));
      if (u?.email) {
        if (!chatEmail) setChatEmail(u.email);
        if (!chatName) setChatName(u.name || u.firstName || u.email.split('@')[0]);
        setChatStarted(true);
      }
    } catch (e) {}
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleClearUserChat = async () => {
    if (!chatEmail) return;
    if (!window.confirm('Are you sure you want to clear your chat history?')) return;

    try {
      const res = await fetch(`http://localhost:5001/api/messages?email=${encodeURIComponent(chatEmail)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMessages([]);
        showToast('Chat history cleared!');
      }
    } catch (err) {
      console.error('Failed to clear chat:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5001/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: formData.email,
          userName: formData.fullName,
          sender: 'user',
          message: `[Subject: ${formData.subject}] ${formData.message}`
        })
      });

      if (res.ok) {
        // Also save as feedback entry in MongoDB
        fetch('http://localhost:5001/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: formData.fullName,
            productName: formData.subject || 'General Feedback',
            rating: 5,
            comment: formData.message
          })
        }).catch((err) => console.error('Error saving feedback:', err));

        showToast('Thank you! Your message has been sent to DoggoCare Admin.');
        // Automatically link chat
        setChatEmail(formData.email);
        setChatName(formData.fullName);
        localStorage.setItem('chatUserEmail', formData.email);
        localStorage.setItem('chatUserName', formData.fullName);
        setChatStarted(true);
        setFormData({ fullName: '', email: '', subject: '', message: '' });
      } else {
        showToast('Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      showToast('Error connecting to server.');
    }
  };

  // Poll for messages if chat is active
  useEffect(() => {
    if (!chatStarted || !chatEmail) return;

    const fetchChatMessages = async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/messages?email=${encodeURIComponent(chatEmail)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setMessages(data);
          }
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
      }
    };

    fetchChatMessages();
    const interval = setInterval(fetchChatMessages, 2000);
    return () => clearInterval(interval);
  }, [chatStarted, chatEmail]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleStartChat = (e) => {
    e.preventDefault();
    if (!chatEmail || !chatName) return;
    localStorage.setItem('chatUserEmail', chatEmail);
    localStorage.setItem('chatUserName', chatName);
    setChatStarted(true);
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatEmail) return;

    const msgText = chatInput;
    setChatInput('');

    try {
      const res = await fetch('http://localhost:5001/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: chatEmail,
          userName: chatName || chatEmail.split('@')[0],
          sender: 'user',
          message: msgText
        })
      });

      if (res.ok) {
        const savedMsg = await res.json();
        setMessages((prev) => Array.isArray(prev) ? [...prev, savedMsg] : [savedMsg]);
      }
    } catch (err) {
      console.error('Failed to send chat message:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans flex flex-col items-center py-6 px-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#FA9132] text-white px-6 py-3 rounded-xl shadow-lg font-medium text-sm transition-all duration-300">
          {toastMessage}
        </div>
      )}

      {/* Top Banner Section */}
      <section className="w-full max-w-[1240px] mb-10">
        <div
          className="w-full min-h-[260px] md:min-h-[300px] rounded-[32px] relative flex flex-col justify-center px-8 md:px-16 py-8 shadow-sm overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: `url(${contactBannerBg})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent z-0"></div>

          <div className="relative z-10 max-w-[420px]">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 tracking-tight drop-shadow-md">
              Contact Us & Live Chat
            </h1>
            <p className="text-white/95 text-xs md:text-sm font-medium leading-relaxed drop-shadow">
              Have questions about DoggoCare, disease detection, or orders? Message our admin directly in real-time below!
            </p>
          </div>
        </div>
      </section>

      {/* Main 2-Column Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-[1240px] mb-16 items-start">
        
        {/* Left Column: Contact Info & Message Form */}
        <div className="space-y-8">
          {/* Get In Touch Card */}
          <div className="bg-white rounded-[28px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col">
            <h2 className="text-xl font-extrabold text-[#FA9132] mb-6 flex items-center gap-2">
              <FiPhone /> Get In Touch
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Address */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-50 text-[#FA9132] flex items-center justify-center shrink-0">
                  <FiMapPin />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xs mb-0.5">Address</h3>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Faculty of Technology,<br />Rajarata University of Sri Lanka
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-50 text-[#FA9132] flex items-center justify-center shrink-0">
                  <FiPhone />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xs mb-0.5">Phone</h3>
                  <p className="text-gray-600 text-xs">+94 71 234 5678</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-50 text-[#FA9132] flex items-center justify-center shrink-0">
                  <FiMail />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xs mb-0.5">Email</h3>
                  <p className="text-gray-600 text-xs">doggocare@gmail.com</p>
                </div>
              </div>

              {/* Working Hours */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-50 text-[#FA9132] flex items-center justify-center shrink-0">
                  <FiClock />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xs mb-0.5">Working Hours</h3>
                  <p className="text-gray-600 text-xs">Mon – Fri: 8.30 AM – 5.00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Our Location - Embedded Google Map Card */}
          <div className="bg-white rounded-[28px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col">
            <h2 className="text-xl font-extrabold text-[#FA9132] mb-4 flex items-center gap-2">
              <FiMapPin /> Our Location
            </h2>
            <div className="w-full h-[300px] rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <iframe
                title="Faculty of Technology, Rajarata University of Sri Lanka"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3947.880496155601!2d80.50158227591873!3d8.314646791720815!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3afcf5b169527ec5%3A0xb3515082ce7f67ad!2sFaculty%20of%20Technology%2C%20Rajarata%20University%20of%20Sri%20Lanka!5e0!3m2!1sen!2slk!4v1700000000000!5m2!1sen!2slk"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>

        {/* Right Column: LIVE CHAT WITH ADMIN CARD */}
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] flex flex-col h-[620px] overflow-hidden">
          
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-[#FA9132] to-[#ff7300] p-5 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-xl font-bold">
                <FiMessageSquare />
              </div>
              <div>
                <h3 className="font-extrabold text-base leading-tight">Live Chat with Admin</h3>
                <p className="text-[11px] text-white/90 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online • Fast Response
                </p>
              </div>
            </div>
            {chatStarted && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearUserChat}
                  title="Clear Chat History"
                  className="text-xs bg-white/15 hover:bg-red-500/80 px-2.5 py-1 rounded-full font-semibold transition flex items-center gap-1"
                >
                  <FiTrash2 className="text-xs" /> Clear
                </button>
                <button
                  onClick={() => {
                    setChatStarted(false);
                    localStorage.removeItem('chatUserEmail');
                  }}
                  className="text-xs bg-white/15 hover:bg-white/25 px-3 py-1 rounded-full font-semibold transition"
                >
                  Switch Account
                </button>
              </div>
            )}
          </div>

          {/* Chat Body */}
          {!chatStarted ? (
            /* Start Chat Form */
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-16 h-16 bg-orange-50 text-[#FA9132] rounded-full flex items-center justify-center text-2xl">
                <FiUser />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">Start Live Chat</h4>
                <p className="text-xs text-gray-500 max-w-xs mt-1">
                  Enter your details to chat directly with DoggoCare Admin.
                </p>
              </div>

              <form onSubmit={handleStartChat} className="w-full max-w-sm space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={chatName}
                  onChange={(e) => setChatName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#FA9132]"
                />
                <input
                  type="email"
                  placeholder="Your Email Address"
                  value={chatEmail}
                  onChange={(e) => setChatEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#FA9132]"
                />
                <button
                  type="submit"
                  className="w-full bg-[#FA9132] hover:bg-[#e07f28] text-white font-bold py-3 rounded-xl text-xs transition shadow-sm"
                >
                  Join Live Chat
                </button>
              </form>
            </div>
          ) : (
            /* Active Chat Thread */
            <div className="flex-1 flex flex-col justify-between bg-gray-50/50 overflow-hidden">
              {/* Message List */}
              <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="text-center my-2">
                  <span className="bg-orange-100/60 text-[#FA9132] text-[10px] font-bold px-3 py-1 rounded-full border border-orange-200/50">
                    Connected with DoggoCare Admin
                  </span>
                </div>

                {messages.length === 0 ? (
                  <div className="text-center py-10 text-xs text-gray-400">
                    No messages yet. Send a message to start chatting!
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isMe = m.sender === 'user';
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] text-gray-400 font-semibold mb-1 px-1">
                          {isMe ? 'You' : 'Admin'} • {m.createdAt && !isNaN(new Date(m.createdAt).getTime()) ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-sm font-medium leading-relaxed ${
                            isMe
                              ? 'bg-gradient-to-r from-[#FA9132] to-[#ff7300] text-white rounded-br-none'
                              : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                          }`}
                        >
                          {m.message}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendChatMessage} className="p-4 bg-white border-t border-gray-100 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type your message to Admin..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#FA9132]"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="w-11 h-11 bg-[#FA9132] hover:bg-[#e07f28] disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center transition shadow-sm shrink-0"
                >
                  <FiSend className="text-sm" />
                </button>
              </form>
            </div>
          )}

        </div>

      </section>
    </div>
  );
};

export default Contact;
