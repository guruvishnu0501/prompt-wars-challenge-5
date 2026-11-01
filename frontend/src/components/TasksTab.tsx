import React, { useState } from 'react';
import {
  CheckSquare, Plus, AlertCircle, Calendar,
  Trash2, Search, CheckCircle2, X
} from 'lucide-react';
import { EventPlan, Task } from '../types';

interface TasksTabProps {
  event: EventPlan;
  onAddTask: (data: { title: string; category: string; due_date: string; priority: string; notes?: string }) => Promise<void>;
  onUpdateTask: (id: number, data: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: number) => Promise<void>;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  event,
  onAddTask,
  onUpdateTask,
  onDeleteTask
}) => {
  const [filter, setFilter] = useState<'all' | 'overdue' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // New task state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Coordination');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleStatus = async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    await onUpdateTask(task.id, { status: nextStatus });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate) return;

    setIsSubmitting(true);
    try {
      await onAddTask({
        title: newTitle.trim(),
        category: newCategory.trim() || 'General',
        due_date: newDueDate,
        priority: newPriority,
        notes: newNotes.trim()
      });
      setNewTitle('');
      setNewDueDate('');
      setNewNotes('');
      setShowAddForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter tasks
  const filteredTasks = event.tasks.filter((t) => {
    // Search
    if (searchQuery.trim()) {
      const match = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.category.toLowerCase().includes(searchQuery.toLowerCase());
      if (!match) return false;
    }

    if (filter === 'overdue') return t.is_overdue;
    if (filter === 'pending') return t.status === 'pending';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-brand-600" />
              Event Milestone & Timeline Tasks
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Task target dates automatically shift if the event date is rescheduled. Overdue items are dynamically highlighted.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-colors focus:ring-2 focus:ring-brand-500"
            aria-expanded={showAddForm}
          >
            <Plus className="w-4 h-4" />
            Add Milestone Task
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0" role="group" aria-label="Task status filters">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All ({event.tasks.length})
            </button>
            <button
              onClick={() => setFilter('overdue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                filter === 'overdue'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Overdue ({event.overdue_task_count})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === 'pending'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Pending ({event.total_task_count - event.completed_task_count})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              Completed ({event.completed_task_count})
            </button>
          </div>

          {/* Search box */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500"
              aria-label="Filter tasks by title or category"
            />
          </div>
        </div>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          className="bg-brand-50/50 border border-brand-200 rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-brand-900">Create New Milestone Task</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
              aria-label="Close add task form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label htmlFor="task-title" className="block text-xs font-semibold text-slate-700 mb-1">
                Task Title *
              </label>
              <input
                id="task-title"
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Confirm floral centerpiece design"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label htmlFor="task-category" className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <input
                id="task-category"
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Decor, Catering, Venue..."
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label htmlFor="task-priority" className="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                id="task-priority"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            <div>
              <label htmlFor="task-duedate" className="block text-xs font-semibold text-slate-700 mb-1">
                Target Due Date (YYYY-MM-DD) *
              </label>
              <input
                id="task-duedate"
                type="date"
                required
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="md:col-span-3">
              <label htmlFor="task-notes" className="block text-xs font-semibold text-slate-700 mb-1">
                Notes & Checklist Instructions (Optional)
              </label>
              <input
                id="task-notes"
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="e.g. Requires approval from banquet manager"
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
              {isSubmitting ? 'Saving...' : 'Add Task'}
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-semibold text-sm">No tasks found matching your criteria</p>
            <p className="text-slate-400 text-xs mt-1">Try resetting the filter or adding a new milestone task.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-xl border transition-all duration-150 flex items-start gap-4 ${
                task.status === 'completed'
                  ? 'bg-slate-50/80 border-slate-200 opacity-75'
                  : task.is_overdue
                  ? 'bg-rose-50/40 border-rose-300 shadow-xs'
                  : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => handleToggleStatus(task)}
                className={`mt-1 w-5 h-5 rounded-md flex items-center justify-center border transition-colors focus:ring-2 focus:ring-brand-500 ${
                  task.status === 'completed'
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-slate-300 hover:border-brand-500 bg-white'
                }`}
                role="checkbox"
                aria-checked={task.status === 'completed'}
                aria-label={`Mark "${task.title}" as ${task.status === 'completed' ? 'pending' : 'completed'}`}
              >
                {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
              </button>

              {/* Task Details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3
                    className={`text-sm font-bold tracking-tight ${
                      task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'
                    }`}
                  >
                    {task.title}
                  </h3>

                  {/* Priority Badge */}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      task.priority === 'high'
                        ? 'bg-rose-100 text-rose-800'
                        : task.priority === 'medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {task.priority}
                  </span>

                  {/* Category Pill */}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {task.category}
                  </span>

                  {/* Custom tag */}
                  {task.is_user_edited && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                      Custom
                    </span>
                  )}
                </div>

                {task.notes && (
                  <p className="text-xs text-slate-500 mb-2">
                    {task.notes}
                  </p>
                )}

                {/* Due Date & Overdue Tag */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 font-medium text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Due: {task.due_date}
                  </span>

                  {task.days_before_event > 0 && (
                    <span className="text-slate-400">
                      ({task.days_before_event} days prior to event)
                    </span>
                  )}

                  {task.is_overdue && (
                    <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-full text-[11px]">
                      <AlertCircle className="w-3 h-3" />
                      Overdue ({Math.abs(task.days_until_due)} days late)
                    </span>
                  )}

                  {!task.is_overdue && task.status !== 'completed' && task.days_until_due >= 0 && (
                    <span className="text-slate-500 text-[11px]">
                      (Due in {task.days_until_due} days)
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 no-print">
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus:ring-2 focus:ring-rose-500"
                  aria-label={`Delete task ${task.title}`}
                  title="Delete task"
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
