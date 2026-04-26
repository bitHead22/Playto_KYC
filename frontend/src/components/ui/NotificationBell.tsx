import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Bell, CheckCheck, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

interface Notification {
  id: number;
  event_type: string;
  timestamp: string;
  is_read: boolean;
  message: string;
  submission_id: number | null;
}

interface Props {
  /** Role of the current user — determines where "View" links navigate */
  role: 'merchant' | 'reviewer';
}

const EVENT_COLORS: Record<string, string> = {
  STATUS_CHANGED_TO_APPROVED:        'bg-green-500',
  STATUS_CHANGED_TO_REJECTED:        'bg-red-500',
  STATUS_CHANGED_TO_MORE_INFO_REQUESTED: 'bg-orange-500',
  STATUS_CHANGED_TO_UNDER_REVIEW:    'bg-purple-500',
  STATUS_CHANGED_TO_SUBMITTED:       'bg-blue-500',
  NEW_SUBMISSION_FOR_REVIEW:         'bg-cyan-500',
};

function dotColor(event_type: string) {
  return EVENT_COLORS[event_type] ?? 'bg-white/40';
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell({ role }: Props) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data.results);
      setUnread(res.data.unread_count);
    } catch {
      // silently fail — don't break the page if this errors
    }
  }, []);

  // Initial fetch + polling every 30 s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markOne = async (id: number) => {
    await api.post(`/notifications/${id}/read/`);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnread((prev) => Math.max(0, prev - 1));
  };

  const markAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await api.post('/notifications/read-all/');
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  };

  const handleClick = async (e: React.MouseEvent, n: Notification) => {
    e.stopPropagation();
    if (!n.is_read) await markOne(n.id);
    if (n.submission_id) {
      setOpen(false);
      if (role === 'merchant') {
        navigate(`/merchant/details/${n.submission_id}`);
      } else {
        navigate(`/reviewer/details/${n.submission_id}`);
      }
    }
  };

  return (
    <div ref={panelRef} className="relative" id="notification-bell">
      {/* Bell trigger */}
      <button
        id="notification-bell-btn"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) fetchNotifications();
        }}
        className="relative w-9 h-9 flex items-center justify-center rounded-sm border border-white/10 hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-white/70" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white px-1 leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          id="notification-panel"
          className="absolute right-0 top-12 w-[360px] bg-[#0d0d0d] border border-white/10 shadow-2xl z-50 flex flex-col"
          style={{ maxHeight: '480px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
            <div>
              <p className="text-xs font-bold tracking-wider uppercase">Notifications</p>
              {unread > 0 && (
                <p className="text-[10px] text-white/40 mt-0.5">{unread} unread</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAll}
                  className="flex items-center gap-1 text-[10px] font-bold text-white/50 hover:text-white transition-colors tracking-wider uppercase"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-white/40 hover:text-white transition-colors ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-6 h-6 text-white/20 mx-auto mb-2" />
                <p className="text-xs text-white/40">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={(e) => handleClick(e, n)}
                  className={`group flex items-start gap-3 px-4 py-3.5 border-b border-white/5 cursor-pointer transition-colors
                    ${n.is_read ? 'opacity-50 hover:opacity-70' : 'hover:bg-white/5'}`}
                >
                  {/* Colour dot */}
                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${dotColor(n.event_type)} ${n.is_read ? 'opacity-40' : ''}`} />

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${n.is_read ? 'text-white/50' : 'text-white/90'}`}>
                      {n.message}
                    </p>
                    <p className="text-[10px] text-white/30 mt-1 font-mono">{relativeTime(n.timestamp)}</p>
                  </div>

                  {/* Navigate arrow (only if linked to a submission) */}
                  {n.submission_id && (
                    <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/60 transition-colors shrink-0 mt-0.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
