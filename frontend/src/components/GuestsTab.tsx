import React, { useState } from 'react';
import { Users, Plus, Mail, Utensils, Trash2, X, UserCheck, UserX, Clock } from 'lucide-react';
import { EventPlan, Guest } from '../types';

interface GuestsTabProps {
  event: EventPlan;
  onAddGuest: (data: { name: string; email?: string; rsvp_status: string; dietary_notes?: string; plus_one?: boolean }) => Promise<void>;
  onUpdateGuest: (id: number, data: Partial<Guest>) => Promise<void>;
  onDeleteGuest: (id: number) => Promise<void>;
}

export const GuestsTab: React.FC<GuestsTabProps> = ({
  event,
  onAddGuest,
  onUpdateGuest,
  onDeleteGuest
}) => {
  const [filter, setFilter] = useState<'all' | 'attending' | 'declined' | 'pending'>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // New guest state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<'attending' | 'declined' | 'pending'>('pending');
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [plusOne, setPlusOne] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddGuest({
        name: name.trim(),
        email: email.trim(),
        rsvp_status: rsvpStatus,
        dietary_notes: dietaryNotes.trim(),
        plus_one: plusOne
      });
      setName('');
      setEmail('');
      setDietaryNotes('');
      setPlusOne(false);
      setShowAddForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const attendingCount = event.guests.filter((g) => g.rsvp_status === 'attending').length;
  const declinedCount = event.guests.filter((g) => g.rsvp_status === 'declined').length;
  const pendingCount = event.guests.filter((g) => g.rsvp_status === 'pending').length;

  const filteredGuests = event.guests.filter((g) => {
    if (filter === 'all') return true;
    return g.rsvp_status === filter;
  });

  return (
    <div className="space-y-6">
      {/* RSVP Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filter === 'all' ? 'border-brand-500 ring-2 ring-brand-500 bg-white' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-xs text-slate-500 font-semibold uppercase block mb-1">All Guests</span>
          <span className="text-xl font-bold text-slate-900">{event.guests.length} / {event.guest_count}</span>
        </button>
        <button
          onClick={() => setFilter('attending')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filter === 'attending' ? 'border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50/40' : 'bg-white border-emerald-200 hover:bg-emerald-50/20'
          }`}
        >
          <span className="text-xs text-emerald-700 font-semibold uppercase block mb-1 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" /> Attending
          </span>
          <span className="text-xl font-bold text-emerald-700">{attendingCount}</span>
        </button>
        <button
          onClick={() => setFilter('declined')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filter === 'declined' ? 'border-rose-500 ring-2 ring-rose-500 bg-rose-50/40' : 'bg-white border-rose-200 hover:bg-rose-50/20'
          }`}
        >
          <span className="text-xs text-rose-700 font-semibold uppercase block mb-1 flex items-center gap-1">
            <UserX className="w-3.5 h-3.5" /> Declined
          </span>
          <span className="text-xl font-bold text-rose-700">{declinedCount}</span>
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filter === 'pending' ? 'border-amber-500 ring-2 ring-amber-500 bg-amber-50/40' : 'bg-white border-amber-200 hover:bg-amber-50/20'
          }`}
        >
          <span className="text-xs text-amber-700 font-semibold uppercase block mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Pending RSVP
          </span>
          <span className="text-xl font-bold text-amber-700">{pendingCount}</span>
        </button>
      </div>

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-600" />
            Guest List & Dietary Requirements
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage individual RSVP responses, plus-ones, and dietary restrictions for catering headcounts.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-colors focus:ring-2 focus:ring-brand-500"
          aria-expanded={showAddForm}
        >
          <Plus className="w-4 h-4" />
          Add Guest
        </button>
      </div>

      {/* Add Guest Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          className="bg-brand-50/50 border border-brand-200 rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-brand-900">Add Guest to List</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
              aria-label="Close add guest form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label htmlFor="guest-name" className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                id="guest-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label htmlFor="guest-email" className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                id="guest-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@example.com"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label htmlFor="guest-rsvp" className="block text-xs font-semibold text-slate-700 mb-1">
                RSVP Status
              </label>
              <select
                id="guest-rsvp"
                value={rsvpStatus}
                onChange={(e) => setRsvpStatus(e.target.value as any)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="pending">Pending</option>
                <option value="attending">Attending</option>
                <option value="declined">Declined</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 mb-2">
                <input
                  type="checkbox"
                  checked={plusOne}
                  onChange={(e) => setPlusOne(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span>Plus One (+1) Included</span>
              </label>
            </div>

            <div className="md:col-span-4">
              <label htmlFor="guest-diet" className="block text-xs font-semibold text-slate-700 mb-1">
                Dietary Requirements & Allergies
              </label>
              <input
                id="guest-diet"
                type="text"
                value={dietaryNotes}
                onChange={(e) => setDietaryNotes(e.target.value)}
                placeholder="e.g. Vegan, peanut allergy, kosher"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-xs"
            >
              {isSubmitting ? 'Saving...' : 'Add Guest'}
            </button>
          </div>
        </form>
      )}

      {/* Guest Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <caption className="sr-only">Guest list with attendance status and dietary preferences</caption>
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th scope="col" className="py-3 px-4">Guest Name</th>
                <th scope="col" className="py-3 px-4">Contact</th>
                <th scope="col" className="py-3 px-4">RSVP Status</th>
                <th scope="col" className="py-3 px-4">Plus-One</th>
                <th scope="col" className="py-3 px-4">Dietary Notes</th>
                <th scope="col" className="py-3 px-4 text-right no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 text-xs italic">
                    No guests added yet. Add your guest list above.
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {guest.name}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {guest.email ? (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {guest.email}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <select
                        value={guest.rsvp_status}
                        onChange={(e) => onUpdateGuest(guest.id, { rsvp_status: e.target.value as any })}
                        className={`text-xs font-bold px-2 py-1 rounded-md border capitalize cursor-pointer focus:ring-2 focus:ring-brand-500 ${
                          guest.rsvp_status === 'attending'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : guest.rsvp_status === 'declined'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                        aria-label={`Update RSVP for ${guest.name}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="attending">Attending</option>
                        <option value="declined">Declined</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {guest.plus_one ? (
                        <span className="px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700">
                          +1 Yes
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {guest.dietary_notes ? (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                          <Utensils className="w-3 h-3 text-amber-600" />
                          {guest.dietary_notes}
                        </span>
                      ) : (
                        <span className="text-slate-400">No restrictions</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right no-print">
                      <button
                        onClick={() => onDeleteGuest(guest.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        aria-label={`Delete guest ${guest.name}`}
                        title="Delete guest"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
