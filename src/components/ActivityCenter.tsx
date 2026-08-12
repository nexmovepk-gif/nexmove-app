'use client';

import React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActivityNotification {
  id: string;
  category: 'DEAL' | 'RENT' | 'LISTING' | 'SYSTEM';
  title: string;
  /** Privacy-safe body — NO real client names or contact numbers */
  body: string;
  timestamp: string;
  unread?: boolean;
}

interface Props {
  notifications: ActivityNotification[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  ActivityNotification['category'],
  { icon: string; badgeClass: string; labelClass: string; label: string }
> = {
  DEAL:    { icon: '🛡️', badgeClass: 'bg-purple-100 border-purple-200', labelClass: 'text-purple-700', label: 'Deal'    },
  RENT:    { icon: '💳', badgeClass: 'bg-blue-100 border-blue-200',     labelClass: 'text-blue-700',   label: 'Rent'    },
  LISTING: { icon: '🏠', badgeClass: 'bg-emerald-100 border-emerald-200', labelClass: 'text-emerald-700', label: 'Listing' },
  SYSTEM:  { icon: '⚙️', badgeClass: 'bg-gray-100 border-gray-200',     labelClass: 'text-gray-600',   label: 'System'  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ActivityCenter({ notifications }: Props) {
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900">Notifications & Activity</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500 font-medium">Privacy-Safe Log · No Client PII Exposed</span>
      </div>

      {/* Feed */}
      <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <li className="px-6 py-8 text-center text-sm text-gray-500">No recent activity.</li>
        ) : (
          notifications.map((n) => {
            const cfg = CATEGORY_CONFIG[n.category];
            return (
              <li
                key={n.id}
                className={`flex items-start gap-4 px-6 py-4 transition hover:bg-gray-50 ${
                  n.unread ? 'border-l-4 border-emerald-500' : 'border-l-4 border-transparent'
                }`}
              >
                {/* Icon bubble */}
                <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border ${cfg.badgeClass} text-base`}>
                  {cfg.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.labelClass}`}>
                      {cfg.label}
                    </span>
                    {n.unread && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    )}
                  </div>
                  <p className="text-sm font-bold text-gray-900 leading-snug">{n.title}</p>
                  <p className="text-xs text-gray-600 leading-relaxed mt-0.5">{n.body}</p>
                </div>

                {/* Timestamp */}
                <span className="flex-shrink-0 text-[10px] text-gray-400 font-medium whitespace-nowrap pt-0.5">
                  {n.timestamp}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
