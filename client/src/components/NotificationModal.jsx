import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/api';
import { Bell, Check, Clock, Calendar, DollarSign, Info } from 'lucide-react';

export const NotificationModal = ({ onClose, onCountUpdate }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getAll();
      if (res.data.success) {
        setNotifications(res.data.data);
        if (onCountUpdate) onCountUpdate(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markRead('all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      if (onCountUpdate) onCountUpdate(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'attendance':
        return <Clock size={16} className="text-emerald-400" />;
      case 'leave':
        return <Calendar size={16} className="text-purple-400" />;
      case 'payroll':
        return <DollarSign size={16} className="text-amber-400" />;
      default:
        return <Info size={16} className="text-sky-400" />;
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#161b22] border border-[#30363d] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] bg-[#1b222c]">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Notifications</h3>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
        >
          Mark all read
        </button>
      </div>

      {/* Content List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-[#21262d]">
        {loading ? (
          <div className="p-6 text-center text-xs text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-500">No new notifications</div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3.5 flex items-start gap-3 transition-colors ${
                notif.is_read ? 'bg-transparent opacity-75' : 'bg-purple-950/20'
              }`}
            >
              <div className="mt-0.5 p-1.5 rounded-lg bg-[#21262d] border border-[#30363d]">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{notif.title}</p>
                <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">{notif.message}</p>
                <span className="text-[10px] text-gray-500 font-mono mt-1 block">
                  {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {!notif.is_read && (
                <span className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"></span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationModal;
