import React, { useState } from 'react';
import { Store, Plus, Phone, DollarSign, Trash2, X, CheckCircle2 } from 'lucide-react';
import { EventPlan, Vendor } from '../types';

interface VendorsTabProps {
  event: EventPlan;
  onAddVendor: (data: { name: string; category: string; contact_info?: string; quote_amount?: number; status: string; notes?: string }) => Promise<void>;
  onUpdateVendor: (id: number, data: Partial<Vendor>) => Promise<void>;
  onDeleteVendor: (id: number) => Promise<void>;
}

export const VendorsTab: React.FC<VendorsTabProps> = ({
  event,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // New vendor form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Catering');
  const [contactInfo, setContactInfo] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [status, setStatus] = useState<'researching' | 'contacted' | 'booked' | 'paid'>('researching');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddVendor({
        name: name.trim(),
        category: category.trim(),
        contact_info: contactInfo.trim(),
        quote_amount: Number(quoteAmount) || 0,
        status,
        notes: notes.trim()
      });
      setName('');
      setContactInfo('');
      setQuoteAmount('');
      setNotes('');
      setShowAddForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredVendors = event.vendors.filter((v) => {
    if (filter === 'all') return true;
    return v.status === filter;
  });

  const statusBadge = (s: string) => {
    switch (s) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'booked':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'contacted':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-brand-600" />
            Vendor Directory & Quotes
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track contracted suppliers, quotes, contact details, and booking status across event categories.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-colors focus:ring-2 focus:ring-brand-500"
          aria-expanded={showAddForm}
        >
          <Plus className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1" role="group" aria-label="Vendor status filters">
        {['all', 'researching', 'contacted', 'booked', 'paid'].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              filter === st
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {st} ({st === 'all' ? event.vendors.length : event.vendors.filter((v) => v.status === st).length})
          </button>
        ))}
      </div>

      {/* Add Vendor Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          className="bg-brand-50/50 border border-brand-200 rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-brand-900">Add New Supplier or Vendor</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
              aria-label="Close add vendor form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label htmlFor="vendor-name" className="block text-xs font-semibold text-slate-700 mb-1">
                Vendor / Business Name *
              </label>
              <input
                id="vendor-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apex Sound & Light"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label htmlFor="vendor-category" className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <input
                id="vendor-category"
                type="text"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Venue, Catering, Media..."
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label htmlFor="vendor-quote" className="block text-xs font-semibold text-slate-700 mb-1">
                Quote Amount ($)
              </label>
              <input
                id="vendor-quote"
                type="number"
                step="0.01"
                min="0"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
                placeholder="2500.00"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label htmlFor="vendor-status" className="block text-xs font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                id="vendor-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="researching">Researching</option>
                <option value="contacted">Contacted</option>
                <option value="booked">Booked</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="vendor-contact" className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Info / Website
              </label>
              <input
                id="vendor-contact"
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="contact@company.com / +1-555-0192"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="vendor-notes" className="block text-xs font-semibold text-slate-700 mb-1">
                Notes / Contract Details
              </label>
              <input
                id="vendor-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Includes setup, strike, and sound engineer"
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
              {isSubmitting ? 'Saving...' : 'Add Vendor'}
            </button>
          </div>
        </form>
      )}

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-semibold text-sm">No vendors found in this category</p>
          </div>
        ) : (
          filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{vendor.name}</h3>
                    <span className="text-xs text-brand-700 font-semibold">{vendor.category}</span>
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={vendor.status}
                    onChange={(e) => onUpdateVendor(vendor.id, { status: e.target.value as any })}
                    className={`text-xs font-bold px-2 py-1 rounded-md border capitalize cursor-pointer focus:ring-2 focus:ring-brand-500 ${statusBadge(
                      vendor.status
                    )}`}
                    aria-label={`Change status for vendor ${vendor.name}`}
                  >
                    <option value="researching">Researching</option>
                    <option value="contacted">Contacted</option>
                    <option value="booked">Booked</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                {vendor.contact_info && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{vendor.contact_info}</span>
                  </div>
                )}

                {vendor.notes && (
                  <p className="text-xs text-slate-500 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {vendor.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  {vendor.quote_amount > 0 ? `$${vendor.quote_amount.toLocaleString()}` : 'Quote Pending'}
                </span>

                <button
                  onClick={() => onDeleteVendor(vendor.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors no-print"
                  aria-label={`Delete vendor ${vendor.name}`}
                  title="Delete vendor"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
