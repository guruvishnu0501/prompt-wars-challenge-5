import React, { useState, useEffect } from 'react';
import {
  Sparkles, DollarSign, CheckSquare, Store, Users,
  RefreshCw
} from 'lucide-react';
import { EventPlan, HealthInfo, BudgetItem, Task, Vendor, Guest } from './types';
import { api } from './api';
import { Navbar } from './components/Navbar';
import { Banner } from './components/Banner';
import { EventOverview } from './components/EventOverview';
import { BlueprintTab } from './components/BlueprintTab';
import { BudgetTab } from './components/BudgetTab';
import { TasksTab } from './components/TasksTab';
import { VendorsTab } from './components/VendorsTab';
import { GuestsTab } from './components/GuestsTab';
import {
  NewEventModal,
  AdjustBudgetModal,
  AdjustGuestModal,
  RescheduleDateModal,
  RegeneratePlanModal
} from './components/Modals';
import { Toast, ToastMessage } from './components/Toast';

export const App: React.FC = () => {
  const [events, setEvents] = useState<EventPlan[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'blueprint' | 'budget' | 'tasks' | 'vendors' | 'guests'>('blueprint');
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal visibility states
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', text: string) => {
    const id = Date.now().toString() + Math.random().toString().substring(2, 5);
    setToasts((prev) => [...prev, { id, type, text }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial load
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [healthData, eventsData] = await Promise.all([
        api.getHealth().catch(() => null),
        api.getEvents().catch(() => [])
      ]);
      setHealth(healthData);
      setEvents(eventsData);

      if (eventsData.length > 0) {
        setCurrentEvent(eventsData[0]);
      } else {
        // Automatically create a default demo event if none exist
        const defaultEvent = await api.createEvent({
          title: "Elena & Marcus's Botanical Wedding",
          event_type: "wedding",
          event_date: "2027-06-25",
          guest_count: 120,
          total_budget: 25000,
          currency: "USD",
          location: "Cascadia Botanical Gardens",
          custom_notes: "Classic elegance with lush greenery and live acoustic strings",
          force_demo: false
        });
        setEvents([defaultEvent]);
        setCurrentEvent(defaultEvent);
      }
    } catch (err: any) {
      addToast('error', `Failed to initialize app: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Refresh single event
  const refreshCurrentEvent = async (id: number) => {
    try {
      const refreshed = await api.getEvent(id);
      setCurrentEvent(refreshed);
      setEvents((prev) => prev.map((e) => (e.id === id ? refreshed : e)));
    } catch (err: any) {
      addToast('error', `Failed to reload event: ${err.message}`);
    }
  };

  // Action Handlers
  const handleCreateEvent = async (data: any) => {
    try {
      const created = await api.createEvent(data);
      setEvents((prev) => [created, ...prev]);
      setCurrentEvent(created);
      addToast('success', `Created "${created.title}" successfully!`);
    } catch (err: any) {
      addToast('error', `Error creating event: ${err.message}`);
      throw err;
    }
  };

  const handleAdjustBudget = async (newBudget: number) => {
    if (!currentEvent) return;
    try {
      const updated = await api.recalculateBudget(currentEvent.id, newBudget);
      setCurrentEvent(updated);
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      addToast('success', `Budget adjusted to $${newBudget.toLocaleString()}. Discretionary allocations updated.`);
    } catch (err: any) {
      addToast('error', `Error adjusting budget: ${err.message}`);
    }
  };

  const handleAdjustGuests = async (newGuests: number) => {
    if (!currentEvent) return;
    try {
      const updated = await api.changeGuestCount(currentEvent.id, newGuests);
      setCurrentEvent(updated);
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      addToast('success', `Guest count updated to ${newGuests}. Variable items scaled.`);
    } catch (err: any) {
      addToast('error', `Error updating guest count: ${err.message}`);
    }
  };

  const handleRescheduleDate = async (newDate: string) => {
    if (!currentEvent) return;
    try {
      const updated = await api.rescheduleDate(currentEvent.id, newDate);
      setCurrentEvent(updated);
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      addToast('success', `Event rescheduled to ${newDate}. All milestones updated.`);
    } catch (err: any) {
      addToast('error', `Error rescheduling: ${err.message}`);
    }
  };

  const handleRegeneratePlan = async (options: any) => {
    if (!currentEvent) return;
    try {
      const updated = await api.regeneratePlan(currentEvent.id, options);
      setCurrentEvent(updated);
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      addToast('success', `AI Blueprint regenerated (${options.merge_mode === 'merge' ? 'Merged with custom data' : 'Plan replaced'}).`);
    } catch (err: any) {
      addToast('error', `Regeneration error: ${err.message}`);
      throw err;
    }
  };

  const handleDeleteEvent = async (id: number) => {
    try {
      await api.deleteEvent(id);
      const remaining = events.filter((e) => e.id !== id);
      setEvents(remaining);
      setCurrentEvent(remaining.length > 0 ? remaining[0] : null);
      addToast('info', 'Event deleted successfully.');
    } catch (err: any) {
      addToast('error', `Error deleting event: ${err.message}`);
    }
  };

  // Budget Items
  const handleAddBudgetItem = async (itemData: any) => {
    if (!currentEvent) return;
    try {
      await api.addBudgetItem(currentEvent.id, itemData);
      await refreshCurrentEvent(currentEvent.id);
      addToast('success', `Added "${itemData.category}" to budget.`);
    } catch (err: any) {
      addToast('error', `Failed to add budget item: ${err.message}`);
    }
  };

  const handleUpdateBudgetItem = async (id: number, data: Partial<BudgetItem>) => {
    if (!currentEvent) return;
    try {
      await api.updateBudgetItem(id, data);
      await refreshCurrentEvent(currentEvent.id);
      addToast('success', 'Budget item updated.');
    } catch (err: any) {
      addToast('error', `Failed to update budget item: ${err.message}`);
    }
  };

  const handleDeleteBudgetItem = async (id: number) => {
    if (!currentEvent) return;
    try {
      await api.deleteBudgetItem(id);
      await refreshCurrentEvent(currentEvent.id);
      addToast('info', 'Budget item removed.');
    } catch (err: any) {
      addToast('error', `Failed to delete item: ${err.message}`);
    }
  };

  // Tasks
  const handleAddTask = async (taskData: any) => {
    if (!currentEvent) return;
    try {
      await api.addTask(currentEvent.id, taskData);
      await refreshCurrentEvent(currentEvent.id);
      addToast('success', `Added milestone task: "${taskData.title}".`);
    } catch (err: any) {
      addToast('error', `Failed to add task: ${err.message}`);
    }
  };

  const handleUpdateTask = async (id: number, data: Partial<Task>) => {
    if (!currentEvent) return;
    try {
      await api.updateTask(id, data);
      await refreshCurrentEvent(currentEvent.id);
      if (data.status) {
        addToast('success', `Task marked as ${data.status}.`);
      }
    } catch (err: any) {
      addToast('error', `Failed to update task: ${err.message}`);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!currentEvent) return;
    try {
      await api.deleteTask(id);
      await refreshCurrentEvent(currentEvent.id);
      addToast('info', 'Milestone task deleted.');
    } catch (err: any) {
      addToast('error', `Failed to delete task: ${err.message}`);
    }
  };

  // Vendors
  const handleAddVendor = async (vendorData: any) => {
    if (!currentEvent) return;
    try {
      await api.addVendor(currentEvent.id, vendorData);
      await refreshCurrentEvent(currentEvent.id);
      addToast('success', `Added vendor "${vendorData.name}".`);
    } catch (err: any) {
      addToast('error', `Failed to add vendor: ${err.message}`);
    }
  };

  const handleUpdateVendor = async (id: number, data: Partial<Vendor>) => {
    if (!currentEvent) return;
    try {
      await api.updateVendor(id, data);
      await refreshCurrentEvent(currentEvent.id);
      addToast('success', 'Vendor updated.');
    } catch (err: any) {
      addToast('error', `Failed to update vendor: ${err.message}`);
    }
  };

  const handleDeleteVendor = async (id: number) => {
    if (!currentEvent) return;
    try {
      await api.deleteVendor(id);
      await refreshCurrentEvent(currentEvent.id);
      addToast('info', 'Vendor deleted.');
    } catch (err: any) {
      addToast('error', `Failed to delete vendor: ${err.message}`);
    }
  };

  // Guests
  const handleAddGuest = async (guestData: any) => {
    if (!currentEvent) return;
    try {
      await api.addGuest(currentEvent.id, guestData);
      await refreshCurrentEvent(currentEvent.id);
      addToast('success', `Added guest "${guestData.name}".`);
    } catch (err: any) {
      addToast('error', `Failed to add guest: ${err.message}`);
    }
  };

  const handleUpdateGuest = async (id: number, data: Partial<Guest>) => {
    if (!currentEvent) return;
    try {
      await api.updateGuest(id, data);
      await refreshCurrentEvent(currentEvent.id);
      addToast('success', 'Guest RSVP updated.');
    } catch (err: any) {
      addToast('error', `Failed to update guest: ${err.message}`);
    }
  };

  const handleDeleteGuest = async (id: number) => {
    if (!currentEvent) return;
    try {
      await api.deleteGuest(id);
      await refreshCurrentEvent(currentEvent.id);
      addToast('info', 'Guest removed.');
    } catch (err: any) {
      addToast('error', `Failed to delete guest: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Toast System */}
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Navbar */}
      <Navbar
        events={events}
        currentEvent={currentEvent}
        onSelectEvent={(ev) => setCurrentEvent(ev)}
        onOpenNewEventModal={() => setIsNewEventModalOpen(true)}
        health={health}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-brand-600 mb-3" />
            <p className="text-sm font-medium">Loading event intelligence...</p>
          </div>
        ) : !currentEvent ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <Sparkles className="w-12 h-12 text-brand-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to EventWise AI</h2>
            <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
              Plan unforgettable celebrations with AI-generated blueprints, deterministic budget tracking, and automated milestone management.
            </p>
            <button
              onClick={() => setIsNewEventModalOpen(true)}
              className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md transition-colors"
            >
              Create Your First Event
            </button>
          </div>
        ) : (
          <div>
            {/* Alerts & Demo Mode Banner */}
            <Banner event={currentEvent} />

            {/* Event Dashboard Overview */}
            <EventOverview
              event={currentEvent}
              onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
              onOpenGuestModal={() => setIsGuestModalOpen(true)}
              onOpenDateModal={() => setIsDateModalOpen(true)}
              onOpenRegenerateModal={() => setIsRegenerateModalOpen(true)}
              onDeleteEvent={handleDeleteEvent}
            />

            {/* Navigation Tabs */}
            <div className="border-b border-slate-200 mb-6 no-print">
              <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto pb-1" aria-label="Event planning tabs">
                {[
                  { id: 'blueprint', label: 'AI Blueprint', icon: Sparkles },
                  { id: 'budget', label: 'Smart Budget', icon: DollarSign },
                  { id: 'tasks', label: 'Timeline & Tasks', icon: CheckSquare, badge: currentEvent.overdue_task_count > 0 ? `${currentEvent.overdue_task_count}` : undefined },
                  { id: 'vendors', label: 'Vendors & Quotes', icon: Store, count: currentEvent.vendors.length },
                  { id: 'guests', label: 'Guest List', icon: Users, count: currentEvent.guests.length }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`inline-flex items-center gap-2 py-3 px-3 sm:px-1 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-colors focus:ring-2 focus:ring-brand-500 rounded-t-md ${
                        isActive
                          ? 'border-brand-600 text-brand-700'
                          : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                          {tab.badge}
                        </span>
                      )}
                      {tab.count !== undefined && (
                        <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.2 rounded-full font-medium">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Active Tab Panel */}
            <div role="tabpanel">
              {activeTab === 'blueprint' && <BlueprintTab event={currentEvent} />}
              {activeTab === 'budget' && (
                <BudgetTab
                  event={currentEvent}
                  onAddBudgetItem={handleAddBudgetItem}
                  onUpdateBudgetItem={handleUpdateBudgetItem}
                  onDeleteBudgetItem={handleDeleteBudgetItem}
                  onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
                />
              )}
              {activeTab === 'tasks' && (
                <TasksTab
                  event={currentEvent}
                  onAddTask={handleAddTask}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                />
              )}
              {activeTab === 'vendors' && (
                <VendorsTab
                  event={currentEvent}
                  onAddVendor={handleAddVendor}
                  onUpdateVendor={handleUpdateVendor}
                  onDeleteVendor={handleDeleteVendor}
                />
              )}
              {activeTab === 'guests' && (
                <GuestsTab
                  event={currentEvent}
                  onAddGuest={handleAddGuest}
                  onUpdateGuest={handleUpdateGuest}
                  onDeleteGuest={handleDeleteGuest}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <NewEventModal
        isOpen={isNewEventModalOpen}
        onClose={() => setIsNewEventModalOpen(false)}
        onSubmit={handleCreateEvent}
      />

      {currentEvent && (
        <>
          <AdjustBudgetModal
            isOpen={isBudgetModalOpen}
            onClose={() => setIsBudgetModalOpen(false)}
            event={currentEvent}
            onSubmit={handleAdjustBudget}
          />
          <AdjustGuestModal
            isOpen={isGuestModalOpen}
            onClose={() => setIsGuestModalOpen(false)}
            event={currentEvent}
            onSubmit={handleAdjustGuests}
          />
          <RescheduleDateModal
            isOpen={isDateModalOpen}
            onClose={() => setIsDateModalOpen(false)}
            event={currentEvent}
            onSubmit={handleRescheduleDate}
          />
          <RegeneratePlanModal
            isOpen={isRegenerateModalOpen}
            onClose={() => setIsRegenerateModalOpen(false)}
            event={currentEvent}
            onSubmit={handleRegeneratePlan}
          />
        </>
      )}
    </div>
  );
};
