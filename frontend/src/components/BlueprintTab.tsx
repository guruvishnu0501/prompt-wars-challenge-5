import React from 'react';
import { Palette, Sparkles, Clock, Shirt } from 'lucide-react';
import { EventPlan, ScheduleItem } from '../types';

interface BlueprintTabProps {
  event: EventPlan;
}

export const BlueprintTab: React.FC<BlueprintTabProps> = ({ event }) => {
  let schedule: ScheduleItem[] = [];
  try {
    schedule = JSON.parse(event.schedule_json || '[]');
  } catch {
    schedule = [];
  }

  // Parse color palette into items
  const colors = event.color_palette
    ? event.color_palette.split(',').map((c) => c.trim())
    : ['#4f46e5', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-6">
      {/* Concept & Mood Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Theme Concept */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2.5 text-brand-700 font-bold text-sm uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4" />
            <span>Theme & Core Concept</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {event.theme_concept || 'Custom Celebration Concept'}
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            {event.mood_description || 'Intelligently tailored to match your guest count, budget parameters, and celebration type.'}
          </p>
        </div>

        {/* Style & Palette */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2.5 text-brand-700 font-bold text-sm uppercase tracking-wider mb-3">
            <Palette className="w-4 h-4" />
            <span>Aesthetics & Dress Code</span>
          </div>

          <div className="mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase block mb-2">
              Color Palette Harmony
            </span>
            <div className="flex flex-wrap gap-2">
              {colors.map((colorName, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-xs font-semibold shadow-xs"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
                    style={{
                      backgroundColor: colorName.toLowerCase().includes('gold')
                        ? '#d97706'
                        : colorName.toLowerCase().includes('rose')
                        ? '#fb7185'
                        : colorName.toLowerCase().includes('navy')
                        ? '#1e3a8a'
                        : colorName.toLowerCase().includes('sage')
                        ? '#84cc16'
                        : colorName.toLowerCase().includes('teal')
                        ? '#0d9488'
                        : colorName.toLowerCase().includes('violet') || colorName.toLowerCase().includes('magenta')
                        ? '#a855f7'
                        : '#6366f1'
                    }}
                    aria-hidden="true"
                  />
                  {colorName}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">
              Recommended Dress Code
            </span>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Shirt className="w-4 h-4 text-brand-600" aria-hidden="true" />
              <span>{event.dress_code || 'Formal / Festive Smart'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Day-of Run of Show / Schedule */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2.5 text-brand-700 font-bold text-sm uppercase tracking-wider mb-4">
          <Clock className="w-4 h-4" />
          <span>Day-of Run of Show & Schedule</span>
        </div>

        {schedule.length > 0 ? (
          <div className="relative pl-6 border-l-2 border-brand-100 space-y-6">
            {schedule.map((item, index) => (
              <div key={index} className="relative group">
                {/* Timeline Dot */}
                <div
                  className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-brand-600 border-2 border-white shadow-xs"
                  aria-hidden="true"
                />
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 mb-1">
                  <span className="font-mono text-sm font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 inline-block w-fit">
                    {item.time}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {item.activity}
                  </h3>
                </div>
                <p className="text-sm text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">
            No schedule items currently generated. Click "Regenerate Plan" to create a fresh itinerary.
          </p>
        )}
      </div>
    </div>
  );
};
