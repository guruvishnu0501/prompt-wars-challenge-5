import React, { useState, useEffect } from 'react';
import {
  X, CalendarClock, RefreshCw,
  AlertTriangle, ShieldCheck, Users
} from 'lucide-react';
import { EventPlan } from '../types';

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 id="modal-title" className="text-base font-bold text-slate-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 focus:ring-2 focus:ring-brand-500"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// 1. Create New Event Modal
interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    event_type: string;
    event_date: string;
    guest_count: number;
    total_budget: number;
    location?: string;
    custom_notes?: string;
    force_demo?: boolean;
  }) => Promise<void>;
}

export const NewEventModal: React.FC<NewEventModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('wedding');
  const [eventDate, setEventDate] = useState('');
  const [guestCount, setGuestCount] = useState('100');
  const [totalBudget, setTotalBudget] = useState('15000');
  const [location, setLocation] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [forceDemo, setForceDemo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Event title is required.');
      return;
    }
    if (!eventDate) {
      setErrorMsg('Event date is required (YYYY-MM-DD).');
      return;
    }
    if (Number(guestCount) <= 0) {
      setErrorMsg('Guest count must be at least 1.');
      return;
    }
    if (Number(totalBudget) <= 0) {
      setErrorMsg('Total budget must be a positive number.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        event_type: eventType,
        event_date: eventDate,
        guest_count: Number(guestCount),
        total_budget: Number(totalBudget),
        location: location.trim(),
        custom_notes: customNotes.trim(),
        force_demo: forceDemo
      });
      setTitle('');
      setEventDate('');
      setLocation('');
      setCustomNotes('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Create New Event Plan">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
            {errorMsg}
          </div>
        )}

        <div>
          <label htmlFor="ev-title" className="block text-xs font-semibold text-slate-700 mb-1">
            Event Title *
          </label>
          <input
            id="ev-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Maya & Leo's Wedding Celebration"
            className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ev-type" className="block text-xs font-semibold text-slate-700 mb-1">
              Event Category *
            </label>
            <select
              id="ev-type"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="wedding">Wedding</option>
              <option value="corporate">Corporate Summit</option>
              <option value="birthday">Birthday Party</option>
              <option value="gala">Charity Gala</option>
              <option value="conference">Tech Conference</option>
              <option value="anniversary">Anniversary</option>
            </select>
          </div>

          <div>
            <label htmlFor="ev-date" className="block text-xs font-semibold text-slate-700 mb-1">
              Event Date (YYYY-MM-DD) *
            </label>
            <input
              id="ev-date"
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ev-budget" className="block text-xs font-semibold text-slate-700 mb-1">
              Total Budget ($ USD) *
            </label>
            <input
              id="ev-budget"
              type="number"
              step="any"
              min="1"
              required
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label htmlFor="ev-guests" className="block text-xs font-semibold text-slate-700 mb-1">
              Expected Guests *
            </label>
            <input
              id="ev-guests"
              type="number"
              min="1"
              required
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="ev-location" className="block text-xs font-semibold text-slate-700 mb-1">
            Venue / City Location
          </label>
          <input
            id="ev-location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Seattle, WA or Grand Conservatory"
            className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label htmlFor="ev-notes" className="block text-xs font-semibold text-slate-700 mb-1">
            Style Notes & Preferences
          </label>
          <textarea
            id="ev-notes"
            rows={2}
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            placeholder="e.g. Modern botanical aesthetic, outdoor cocktail hour, acoustic music"
            className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
            <input
              type="checkbox"
              checked={forceDemo}
              onChange={(e) => setForceDemo(e.target.checked)}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span>Force Demo Mode (Use pre-curated template without calling Groq API)</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm flex items-center gap-2"
          >
            {isSubmitting ? 'Generating AI Blueprint...' : 'Create & Plan Event'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

// 2. Adjust Budget Modal (Deterministic Reduction / Expansion)
interface AdjustBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventPlan;
  onSubmit: (newBudget: number) => Promise<void>;
}

export const AdjustBudgetModal: React.FC<AdjustBudgetModalProps> = ({
  isOpen,
  onClose,
  event,
  onSubmit
}) => {
  const [amount, setAmount] = useState<number>(event.total_budget);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setAmount(event.total_budget);
  }, [event.total_budget, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(amount);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReduction = amount < event.total_budget;
  const isDeficit = amount < event.total_spent;
  const deficitAmount = Math.max(0, Math.round((event.total_spent - amount) * 100) / 100);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Adjust Total Event Budget">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="budget-slider" className="block text-xs font-semibold text-slate-700 mb-1">
            New Total Budget ($)
          </label>
          <div className="flex items-center gap-3">
            <input
              id="budget-slider"
              type="range"
              min={Math.max(1000, Math.round(event.total_spent))}
              max={Math.max(50000, event.total_budget * 2)}
              step="100"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="flex-1 accent-brand-600"
            />
            <input
              type="number"
              min="1"
              step="any"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-32 text-sm font-bold px-3 py-2 border border-slate-300 rounded-lg text-right focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Live Simulation Preview */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
          <div className="flex justify-between font-medium text-slate-600">
            <span>Current Budget:</span>
            <span className="font-bold text-slate-800">${event.total_budget.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-medium text-slate-600">
            <span>Already Committed / Spent:</span>
            <span className="font-bold text-slate-800">${event.total_spent.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-medium text-slate-600 pt-1 border-t border-slate-200">
            <span>Remaining After Adjustment:</span>
            <span className={`font-bold ${isDeficit ? 'text-rose-600' : 'text-emerald-700'}`}>
              ${(amount - event.total_spent).toLocaleString()}
            </span>
          </div>
        </div>

        {isDeficit && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-xs text-rose-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Deficit Warning:</strong> New budget is below already spent amount by ${deficitAmount.toLocaleString()}.
              All unspent categories will be set to 0.
            </div>
          </div>
        )}

        {isReduction && !isDeficit && (
          <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg text-xs text-brand-800 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Deterministic Scaling:</strong> Discretionary unspent funds will be scaled proportionally.
              Categories with already spent funds will never be reduced below spent.
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || amount <= 0}
            className="px-5 py-2 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm"
          >
            {isSubmitting ? 'Recalculating...' : 'Apply New Budget'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

// 3. Adjust Guest Count Modal
interface AdjustGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventPlan;
  onSubmit: (newGuests: number) => Promise<void>;
}

export const AdjustGuestModal: React.FC<AdjustGuestModalProps> = ({
  isOpen,
  onClose,
  event,
  onSubmit
}) => {
  const [guests, setGuests] = useState<number>(event.guest_count);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setGuests(event.guest_count);
  }, [event.guest_count, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guests <= 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(guests);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const newCostPerGuest = Math.round((event.total_budget / (guests || 1)) * 100) / 100;

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Update Guest Headcount">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="guest-input" className="block text-xs font-semibold text-slate-700 mb-1">
            New Guest Count
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="10"
              max="500"
              step="5"
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="flex-1 accent-brand-600"
            />
            <input
              id="guest-input"
              type="number"
              min="1"
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-24 text-sm font-bold px-3 py-2 border border-slate-300 rounded-lg text-right focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
          <div className="flex justify-between text-slate-600">
            <span>Previous Headcount:</span>
            <span className="font-bold text-slate-800">{event.guest_count} guests (${event.cost_per_guest}/guest)</span>
          </div>
          <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
            <span>Updated Cost Per Guest:</span>
            <span className="font-bold text-brand-700">${newCostPerGuest}/guest</span>
          </div>
        </div>

        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 flex items-start gap-2">
          <Users className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
          <span>
            Variable per-guest budget items (such as Catering, Bar, and Favors) will be scaled proportionally to accommodate this headcount.
          </span>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || guests <= 0}
            className="px-5 py-2 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm"
          >
            {isSubmitting ? 'Scaling...' : 'Update Headcount'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

// 4. Reschedule Event Date Modal
interface RescheduleDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventPlan;
  onSubmit: (newDate: string) => Promise<void>;
}

export const RescheduleDateModal: React.FC<RescheduleDateModalProps> = ({
  isOpen,
  onClose,
  event,
  onSubmit
}) => {
  const [date, setDate] = useState<string>(event.event_date);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setDate(event.event_date);
  }, [event.event_date, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    setIsSubmitting(true);
    try {
      await onSubmit(date);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Reschedule Event Date">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="resched-date" className="block text-xs font-semibold text-slate-700 mb-1">
            New Event Date (YYYY-MM-DD) *
          </label>
          <input
            id="resched-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
          <CalendarClock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Deterministic Milestone Rescheduling:</strong> All milestone task target deadlines will shift relative to the new event date, preserving your planning schedule. Tasks falling before today will automatically be flagged as overdue.
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !date}
            className="px-5 py-2 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm"
          >
            {isSubmitting ? 'Rescheduling...' : 'Confirm New Date'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

// 5. Regenerate AI Plan Modal with Data Loss Protection
interface RegeneratePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventPlan;
  onSubmit: (options: {
    custom_notes?: string;
    force_demo?: boolean;
    merge_mode: 'merge' | 'replace';
    confirmed_overwrite: boolean;
  }) => Promise<void>;
}

export const RegeneratePlanModal: React.FC<RegeneratePlanModalProps> = ({
  isOpen,
  onClose,
  event,
  onSubmit
}) => {
  const [mergeMode, setMergeMode] = useState<'merge' | 'replace'>('merge');
  const [confirmedOverwrite, setConfirmedOverwrite] = useState(false);
  const [notes, setNotes] = useState('');
  const [forceDemo, setForceDemo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mergeMode === 'replace' && !confirmedOverwrite) {
      setErrorMsg('You must check the confirmation box to proceed with a full overwrite.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        custom_notes: notes.trim(),
        force_demo: forceDemo,
        merge_mode: mergeMode,
        confirmed_overwrite: confirmedOverwrite
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to regenerate plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={`Regenerate AI Plan (${event.title})`}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMsg && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
            {errorMsg}
          </div>
        )}

        <div>
          <label htmlFor="regen-notes" className="block text-xs font-semibold text-slate-700 mb-1">
            Additional Directives or Theme Adjustments
          </label>
          <textarea
            id="regen-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Focus on eco-friendly decor, organic local food, acoustic quartet"
            className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Merge vs Overwrite Choice */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Plan Update Strategy
          </legend>

          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-brand-200 bg-brand-50/40 cursor-pointer hover:bg-brand-50/70 transition-colors">
            <input
              type="radio"
              name="strategy"
              value="merge"
              checked={mergeMode === 'merge'}
              onChange={() => setMergeMode('merge')}
              className="mt-0.5 text-brand-600 focus:ring-brand-500"
            />
            <div className="text-xs">
              <span className="font-bold text-brand-900 block">
                Merge with Existing Edits (Recommended)
              </span>
              <span className="text-slate-600">
                Preserves all your customized tasks, custom expense items, and vendor quotes while adding new AI recommendations.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="radio"
              name="strategy"
              value="replace"
              checked={mergeMode === 'replace'}
              onChange={() => setMergeMode('replace')}
              className="mt-0.5 text-rose-600 focus:ring-rose-500"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900 block">
                Full Plan Reset & Overwrite
              </span>
              <span className="text-slate-500">
                Wipes existing task progress and custom expenses, replacing them entirely with a fresh AI-generated draft.
              </span>
            </div>
          </label>
        </fieldset>

        {/* Require explicit confirmation when replacing */}
        {mergeMode === 'replace' && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl space-y-2 text-xs text-rose-900 animate-fade-in">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Confirmation Required
            </div>
            <label className="flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={confirmedOverwrite}
                onChange={(e) => setConfirmedOverwrite(e.target.checked)}
                className="rounded border-rose-300 text-rose-600 focus:ring-rose-500"
              />
              <span>I understand this will overwrite my customized budget and milestone tasks.</span>
            </label>
          </div>
        )}

        <div>
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
            <input
              type="checkbox"
              checked={forceDemo}
              onChange={(e) => setForceDemo(e.target.checked)}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span>Force Demo Mode</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (mergeMode === 'replace' && !confirmedOverwrite)}
            className="px-5 py-2 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
            {isSubmitting ? 'Regenerating...' : 'Generate New Plan'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};
