import React from 'react';
import { Plus, Sparkles, Printer, Download, Bot } from 'lucide-react';
import { EventPlan, HealthInfo } from '../types';

interface NavbarProps {
  events: EventPlan[];
  currentEvent: EventPlan | null;
  onSelectEvent: (event: EventPlan) => void;
  onOpenNewEventModal: () => void;
  health: HealthInfo | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  events,
  currentEvent,
  onSelectEvent,
  onOpenNewEventModal,
  health
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    if (!currentEvent) return;
    const blob = new Blob([JSON.stringify(currentEvent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentEvent.title.toLowerCase().replace(/\s+/g, '_')}_plan.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-slate-900 tracking-tight">EventWise</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-brand-100 text-brand-700">AI</span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Intelligent Celebration Planner</p>
            </div>
          </div>

          {/* Center: Event Selector */}
          <div className="flex items-center gap-2">
            {events.length > 0 && (
              <div className="relative">
                <label htmlFor="event-selector" className="sr-only">Select Active Event</label>
                <select
                  id="event-selector"
                  value={currentEvent?.id || ''}
                  onChange={(e) => {
                    const selected = events.find((ev) => ev.id === Number(e.target.value));
                    if (selected) onSelectEvent(selected);
                  }}
                  className="bg-slate-100 border border-slate-200 text-slate-800 text-sm font-medium rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-brand-500 focus:bg-white cursor-pointer"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.event_date})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={onOpenNewEventModal}
              className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              aria-label="Create a new event"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Event</span>
            </button>
          </div>

          {/* Right Actions & Health Pill */}
          <div className="flex items-center gap-3">
            {/* Live AI / Demo pill */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                health?.groq_configured
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
              title={health?.mode || 'Demo Mode'}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>{health?.groq_configured ? `Live Groq (${health.groq_model || 'LLaMA'})` : 'Demo Engine Active'}</span>
            </div>

            {/* Print & Export */}
            {currentEvent && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrint}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:ring-2 focus:ring-brand-500"
                  title="Print / Save as PDF"
                  aria-label="Print or export to PDF"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={handleExportJson}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:ring-2 focus:ring-brand-500"
                  title="Export Plan to JSON"
                  aria-label="Export Event Plan as JSON"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
