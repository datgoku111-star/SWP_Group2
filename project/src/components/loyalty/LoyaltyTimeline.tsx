import React from 'react';

interface PointsHistoryRecord {
  id: string;
  transaction_type: 'EARNED' | 'REDEEMED' | 'REFUNDED';
  points_changed: number;
  reason: string | null;
  created_at: string;
}

export default function LoyaltyTimeline({ history }: { history: PointsHistoryRecord[] }) {
  if (!history || history.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">Khách hàng chưa có lịch sử biến động điểm thưởng.</p>;
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {history.map((event, eventIdx) => {
          const isEarned = event.transaction_type === 'EARNED' || event.transaction_type === 'REFUNDED';
          return (
            <li key={event.id}>
              <div className="relative pb-8">
                {/* Đường kẻ dọc nối liền */}
                {eventIdx !== history.length - 1 ? (
                  <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                ) : null}
                
                <div className="relative flex space-x-3">
                  <div>
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800 text-white text-sm font-bold ${
                      isEarned ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}>
                      {isEarned ? '+' : '-'}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className={`font-semibold mr-2 ${isEarned ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {isEarned ? `+${event.points_changed}` : `${event.points_changed}`} Điểm
                        </span>
                        ({event.transaction_type})
                      </p>
                      {event.reason && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/40 p-2 rounded border border-gray-100 dark:border-gray-700 mt-2">
                          {event.reason}
                        </p>
                      )}
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                      <time dateTime={event.created_at}>
                        {new Date(event.created_at).toLocaleString('vi-VN')}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}