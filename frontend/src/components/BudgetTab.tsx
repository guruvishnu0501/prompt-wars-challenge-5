import React, { useState } from 'react';
import {
  DollarSign, Plus, Edit2, Trash2, Check, X,
  PieChart, Table as TableIcon
} from 'lucide-react';
import { EventPlan, BudgetItem } from '../types';

interface BudgetTabProps {
  event: EventPlan;
  onAddBudgetItem: (item: Omit<BudgetItem, 'id' | 'event_id' | 'percentage' | 'created_at' | 'is_user_edited'>) => Promise<void>;
  onUpdateBudgetItem: (id: number, data: Partial<BudgetItem>) => Promise<void>;
  onDeleteBudgetItem: (id: number) => Promise<void>;
  onOpenBudgetModal: () => void;
}

const PALETTE = [
  '#6366f1', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b',
  '#06b6d4', '#f97316', '#14b8a6', '#64748b'
];

export const BudgetTab: React.FC<BudgetTabProps> = ({
  event,
  onAddBudgetItem,
  onUpdateBudgetItem,
  onDeleteBudgetItem,
  onOpenBudgetModal
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAllocated, setEditAllocated] = useState<number>(0);
  const [editSpent, setEditSpent] = useState<number>(0);
  const [showAddForm, setShowAddForm] = useState(false);

  // New item form state
  const [newCategory, setNewCategory] = useState('');
  const [newAllocated, setNewAllocated] = useState('');
  const [newSpent, setNewSpent] = useState('0');
  const [newIsVariable, setNewIsVariable] = useState(false);
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startEdit = (item: BudgetItem) => {
    setEditingId(item.id);
    setEditAllocated(item.allocated_amount);
    setEditSpent(item.spent_amount);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (item: BudgetItem) => {
    await onUpdateBudgetItem(item.id, {
      allocated_amount: Number(editAllocated),
      spent_amount: Number(editSpent)
    });
    setEditingId(null);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim() || Number(newAllocated) <= 0) return;

    setIsSubmitting(true);
    try {
      await onAddBudgetItem({
        category: newCategory.trim(),
        allocated_amount: Number(newAllocated),
        spent_amount: Number(newSpent) || 0,
        is_variable_guest: newIsVariable,
        notes: newNotes.trim()
      });
      setNewCategory('');
      setNewAllocated('');
      setNewSpent('0');
      setNewIsVariable(false);
      setNewNotes('');
      setShowAddForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // SVG Donut calculation
  const totalAllocated = event.total_allocated || event.total_budget || 1;
  let accumulatedAngle = 0;
  const slices = event.budget_items.map((item, idx) => {
    const fraction = item.allocated_amount / totalAllocated;
    const strokeDasharray = `${fraction * 100} 100`;
    const strokeDashoffset = -accumulatedAngle;
    accumulatedAngle += fraction * 100;
    return {
      ...item,
      color: PALETTE[idx % PALETTE.length],
      strokeDasharray,
      strokeDashoffset
    };
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Deterministic Budget Allocation & Expense Tracking
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Allocations sum precisely to 100% of the total budget. Discretionary categories scale automatically during budget cuts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-colors focus:ring-2 focus:ring-brand-500"
            aria-expanded={showAddForm}
          >
            <Plus className="w-4 h-4" />
            Add Expense Category
          </button>
          <button
            onClick={onOpenBudgetModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors focus:ring-2 focus:ring-brand-500"
          >
            Adjust Total Budget
          </button>
        </div>
      </div>

      {/* Add Custom Category Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          className="bg-brand-50/50 border border-brand-200 rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-brand-900">Add New Budget Item</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
              aria-label="Close add expense form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label htmlFor="new-category" className="block text-xs font-semibold text-slate-700 mb-1">
                Category Name *
              </label>
              <input
                id="new-category"
                type="text"
                required
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. Vintage Photobooth"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label htmlFor="new-allocated" className="block text-xs font-semibold text-slate-700 mb-1">
                Allocated Amount ($) *
              </label>
              <input
                id="new-allocated"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={newAllocated}
                onChange={(e) => setNewAllocated(e.target.value)}
                placeholder="1000.00"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label htmlFor="new-spent" className="block text-xs font-semibold text-slate-700 mb-1">
                Already Spent ($)
              </label>
              <input
                id="new-spent"
                type="number"
                step="0.01"
                min="0"
                value={newSpent}
                onChange={(e) => setNewSpent(e.target.value)}
                placeholder="0.00"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 mb-2">
                <input
                  type="checkbox"
                  checked={newIsVariable}
                  onChange={(e) => setNewIsVariable(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span>Scales with Guest Count</span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="new-notes" className="block text-xs font-semibold text-slate-700 mb-1">
              Notes / Description (Optional)
            </label>
            <input
              id="new-notes"
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="e.g. Includes props and unlimited prints"
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
            />
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
              {isSubmitting ? 'Saving...' : 'Add Category'}
            </button>
          </div>
        </form>
      )}

      {/* Visual Chart and Legend Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Donut Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
          <h3 className="text-sm font-bold text-slate-800 mb-4 self-start flex items-center gap-2">
            <PieChart className="w-4 h-4 text-brand-600" />
            Allocation Share
          </h3>

          <div className="relative w-48 h-48 my-2">
            <svg
              viewBox="0 0 36 36"
              className="w-full h-full transform -rotate-90"
              aria-label="Budget allocation donut chart"
              role="img"
              aria-describedby="budget-table-desc"
            >
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="transparent"
                stroke="#e2e8f0"
                strokeWidth="3.8"
              />
              {slices.map((slice) => (
                <circle
                  key={slice.id}
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth="3.8"
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                >
                  <title>{`${slice.category}: $${slice.allocated_amount.toLocaleString()} (${slice.percentage}%)`}</title>
                </circle>
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-xs text-slate-400 font-semibold uppercase">Total</span>
              <span className="text-base font-black text-slate-900">${event.total_budget.toLocaleString()}</span>
            </div>
          </div>
          <span id="budget-table-desc" className="sr-only">
            Donut chart representing the breakdown of the {event.total_budget} dollar budget into {event.budget_items.length} categories.
          </span>
        </div>

        {/* Legend / Quick list */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3">Allocation Distribution</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
              {slices.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    <span className="font-semibold text-slate-800 truncate" title={item.category}>
                      {item.category}
                    </span>
                    {item.is_variable_guest && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                        Per-Guest
                      </span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="font-bold text-slate-900">${item.allocated_amount.toLocaleString()}</span>
                    <span className="text-slate-400 ml-1">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Categories Tracked: {event.budget_items.length}</span>
            <span>Allocated Sum: ${event.total_allocated.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Detailed Budget Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-brand-600" />
            Budget Breakdown & Tracking Table
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <caption className="sr-only">Detailed breakdown of event budget items, spent, and remaining balances</caption>
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th scope="col" className="py-3 px-4">Category</th>
                <th scope="col" className="py-3 px-4">Type</th>
                <th scope="col" className="py-3 px-4 text-right">Allocated ($)</th>
                <th scope="col" className="py-3 px-4 text-right">Spent ($)</th>
                <th scope="col" className="py-3 px-4 text-right">Remaining ($)</th>
                <th scope="col" className="py-3 px-4 text-center">Share</th>
                <th scope="col" className="py-3 px-4">Notes</th>
                <th scope="col" className="py-3 px-4 text-right no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {event.budget_items.map((item) => {
                const remaining = Math.round((item.allocated_amount - item.spent_amount) * 100) / 100;
                const isEditing = editingId === item.id;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {item.category}
                      {item.is_user_edited && (
                        <span className="ml-1.5 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                          Custom
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        item.is_variable_guest
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.is_variable_guest ? 'Variable' : 'Fixed'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editAllocated}
                          onChange={(e) => setEditAllocated(Number(e.target.value))}
                          className="w-24 text-right px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-brand-500"
                        />
                      ) : (
                        `$${item.allocated_amount.toLocaleString()}`
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editSpent}
                          onChange={(e) => setEditSpent(Number(e.target.value))}
                          className="w-24 text-right px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-brand-500"
                        />
                      ) : (
                        <span className={item.spent_amount > item.allocated_amount ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                          ${item.spent_amount.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      <span className={remaining < 0 ? 'text-rose-600 font-bold' : 'text-emerald-700'}>
                        ${remaining.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-xs text-slate-500">
                      {item.percentage}%
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate" title={item.notes}>
                      {item.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-right no-print">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => saveEdit(item)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded"
                            title="Edit allocated/spent"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteBudgetItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
