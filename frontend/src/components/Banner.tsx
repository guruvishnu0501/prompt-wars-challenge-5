import React from 'react';
import { AlertTriangle, Bot } from 'lucide-react';
import { EventPlan } from '../types';

interface BannerProps {
  event: EventPlan;
}

export const Banner: React.FC<BannerProps> = ({ event }) => {
  const isBudgetExceeded = event.total_spent > event.total_budget;
  const deficit = Math.round((event.total_spent - event.total_budget) * 100) / 100;

  return (
    <div className="space-y-3 mb-6 no-print">
      {/* Demo Mode Notice */}
      {event.is_demo && (
        <div
          role="status"
          className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm flex items-start gap-3"
        >
          <Bot className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 text-sm text-amber-900">
            <span className="font-semibold block sm:inline">Demo Mode Active: </span>
            <span>
              This event blueprint was generated using the deterministic EventWise Intelligence Engine.
              No live Groq API key is configured or required. To activate real-time LLaMA-3.3-70b planning, provide a{' '}
              <code className="bg-amber-100 text-amber-800 px-1 py-0.5 rounded font-mono text-xs">GROQ_API_KEY</code>{' '}
              in your backend <code className="bg-amber-100 text-amber-800 px-1 py-0.5 rounded font-mono text-xs">.env</code> file.
            </span>
          </div>
        </div>
      )}

      {/* Budget Overrun Warning */}
      {isBudgetExceeded && (
        <div
          role="alert"
          className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg shadow-sm flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 text-sm text-rose-900">
            <strong className="font-semibold">Budget Exceeded Alert: </strong>
            Total committed expenses (${event.total_spent.toLocaleString()}) exceed your total budget (${event.total_budget.toLocaleString()}) by{' '}
            <strong className="font-bold text-rose-700">${deficit.toLocaleString()}</strong>. Consider adjusting discretionary allocations or increasing the total budget.
          </div>
        </div>
      )}

      {/* Overdue Tasks Alert */}
      {event.overdue_task_count > 0 && (
        <div
          role="alert"
          className="bg-orange-50 border-l-4 border-orange-500 p-3.5 rounded-r-lg shadow-sm flex items-center justify-between gap-3 text-sm text-orange-900"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" aria-hidden="true" />
            <span>
              You have <strong className="font-semibold">{event.overdue_task_count} overdue milestone task{event.overdue_task_count > 1 ? 's' : ''}</strong> that require immediate attention.
            </span>
          </div>
          <span className="text-xs bg-orange-200 text-orange-800 font-bold px-2 py-0.5 rounded-full">
            Action Required
          </span>
        </div>
      )}
    </div>
  );
};
