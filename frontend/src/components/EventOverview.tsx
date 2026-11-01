import React from 'react';
import {
  Calendar, Users, DollarSign, MapPin, RefreshCw,
  CalendarClock, Trash2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { EventPlan } from '../types';

interface EventOverviewProps {
  event: EventPlan;
  onOpenBudgetModal: () => void;
  onOpenGuestModal: () => void;
  onOpenDateModal: () => void;
  onOpenRegenerateModal: () => void;
  onDeleteEvent: (id: number) => void;
}

export const EventOverview: React.FC<EventOverviewProps> = ({
  event,
  onOpenBudgetModal,
  onOpenGuestModal,
  onOpenDateModal,
  onOpenRegenerateModal,
  onDeleteEvent
}) => {
  const spentPct = Math.min(100, Math.round((event.total_spent / (event.total_budget || 1)) * 100));
  const taskProgressPct = event.total_task_count > 0
    ? Math.round((event.completed_task_count / event.total_task_count) * 100)
    : 0;

  return (
    <section aria-label="Event summary dashboard" className="mb-8">
      {/* Event Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {event.title}
              </h1>
              <span className="capitalize text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-100 text-brand-800 border border-brand-200">
                {event.event_type}
              </span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                Provider: {event.ai_provider}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <Calendar className="w-4 h-4 text-brand-600" aria-hidden="true" />
                {event.event_date}
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <Users className="w-4 h-4 text-brand-600" aria-hidden="true" />
                {event.guest_count} Guests
              </span>
              {event.location && (
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <MapPin className="w-4 h-4 text-brand-600" aria-hidden="true" />
                  {event.location}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2 no-print">
            <button
              onClick={onOpenBudgetModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors focus:ring-2 focus:ring-brand-500"
              aria-label="Adjust total budget"
            >
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Adjust Budget
            </button>

            <button
              onClick={onOpenGuestModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors focus:ring-2 focus:ring-brand-500"
              aria-label="Change guest count"
            >
              <Users className="w-4 h-4 text-indigo-600" />
              Change Guests
            </button>

            <button
              onClick={onOpenDateModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors focus:ring-2 focus:ring-brand-500"
              aria-label="Reschedule event date"
            >
              <CalendarClock className="w-4 h-4 text-amber-600" />
              Reschedule
            </button>

            <button
              onClick={onOpenRegenerateModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 transition-colors focus:ring-2 focus:ring-brand-500"
              aria-label="Regenerate AI plan"
            >
              <RefreshCw className="w-4 h-4 text-brand-600" />
              Regenerate Plan
            </button>

            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete the event "${event.title}"? This cannot be undone.`)) {
                  onDeleteEvent(event.id);
                }
              }}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus:ring-2 focus:ring-rose-500"
              aria-label="Delete this event"
              title="Delete Event"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Budget</span>
            <DollarSign className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mb-1">
            ${event.total_budget.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 flex justify-between">
            <span>Allocated: ${event.total_allocated.toLocaleString()}</span>
            <span>{Math.round((event.total_allocated / (event.total_budget || 1)) * 100)}%</span>
          </div>
        </div>

        {/* Spent vs Remaining */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Spent / Remaining</span>
            <div className={`w-2.5 h-2.5 rounded-full ${event.remaining_budget >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          </div>
          <div className="text-2xl font-black text-slate-900 mb-1">
            ${event.total_spent.toLocaleString()}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2 overflow-hidden">
            <div
              className={`h-1.5 rounded-full ${event.remaining_budget >= 0 ? 'bg-brand-600' : 'bg-rose-600'}`}
              style={{ width: `${spentPct}%` }}
              role="progressbar"
              aria-valuenow={spentPct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="text-xs flex justify-between font-medium">
            <span className="text-slate-500">{spentPct}% spent</span>
            <span className={event.remaining_budget >= 0 ? 'text-emerald-700' : 'text-rose-700 font-bold'}>
              ${event.remaining_budget.toLocaleString()} left
            </span>
          </div>
        </div>

        {/* Per-Guest Cost */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Per-Guest Cost</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mb-1">
            ${event.cost_per_guest.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">
            Calculated across {event.guest_count} attendees
          </div>
        </div>

        {/* Task Progress */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Milestone Tasks</span>
            {event.overdue_task_count > 0 ? (
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {event.overdue_task_count} Overdue
              </span>
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <div className="text-2xl font-black text-slate-900 mb-1">
            {event.completed_task_count} / {event.total_task_count}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full"
              style={{ width: `${taskProgressPct}%` }}
              role="progressbar"
              aria-valuenow={taskProgressPct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="text-xs text-slate-500 flex justify-between">
            <span>{taskProgressPct}% completed</span>
            <span>{event.total_task_count - event.completed_task_count} remaining</span>
          </div>
        </div>
      </div>
    </section>
  );
};
