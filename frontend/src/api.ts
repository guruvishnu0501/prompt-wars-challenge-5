import { EventPlan, HealthInfo, BudgetItem, Task, Vendor, Guest } from './types';

const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || (errJson.errors ? errJson.errors.join(', ') : JSON.stringify(errJson));
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return null as unknown as T;
  }

  return response.json();
}

export const api = {
  getHealth: () => request<HealthInfo>('/health'),

  getEvents: () => request<EventPlan[]>('/events'),

  getEvent: (id: number) => request<EventPlan>(`/events/${id}`),

  createEvent: (data: {
    title: string;
    event_type: string;
    event_date: string;
    guest_count: number;
    total_budget: number;
    currency?: string;
    location?: string;
    force_demo?: boolean;
    custom_notes?: string;
  }) => request<EventPlan>('/events', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  updateEvent: (id: number, data: Partial<{
    title: string;
    event_type: string;
    event_date: string;
    guest_count: number;
    total_budget: number;
    currency: string;
    location: string;
  }>) => request<EventPlan>(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  deleteEvent: (id: number) => request<void>(`/events/${id}`, {
    method: 'DELETE'
  }),

  regeneratePlan: (id: number, options: {
    custom_notes?: string;
    force_demo?: boolean;
    merge_mode: 'merge' | 'replace';
    confirmed_overwrite: boolean;
  }) => request<EventPlan>(`/events/${id}/generate-plan`, {
    method: 'POST',
    body: JSON.stringify(options)
  }),

  recalculateBudget: (id: number, new_total_budget: number) =>
    request<EventPlan>(`/events/${id}/recalculate-budget`, {
      method: 'POST',
      body: JSON.stringify({ new_total_budget })
    }),

  changeGuestCount: (id: number, new_guest_count: number) =>
    request<EventPlan>(`/events/${id}/change-guest-count`, {
      method: 'POST',
      body: JSON.stringify({ new_guest_count })
    }),

  rescheduleDate: (id: number, new_event_date: string) =>
    request<EventPlan>(`/events/${id}/reschedule-date`, {
      method: 'POST',
      body: JSON.stringify({ new_event_date })
    }),

  // Budget
  addBudgetItem: (eventId: number, data: Omit<BudgetItem, 'id' | 'event_id' | 'percentage' | 'created_at' | 'is_user_edited'>) =>
    request<BudgetItem>(`/events/${eventId}/budget`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateBudgetItem: (id: number, data: Partial<BudgetItem>) =>
    request<BudgetItem>(`/budget/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteBudgetItem: (id: number) =>
    request<void>(`/budget/${id}`, {
      method: 'DELETE'
    }),

  // Tasks
  addTask: (eventId: number, data: { title: string; category: string; due_date: string; priority: string; notes?: string }) =>
    request<Task>(`/events/${eventId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateTask: (id: number, data: Partial<Task>) =>
    request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteTask: (id: number) =>
    request<void>(`/tasks/${id}`, {
      method: 'DELETE'
    }),

  // Vendors
  addVendor: (eventId: number, data: { name: string; category: string; contact_info?: string; quote_amount?: number; status: string; notes?: string }) =>
    request<Vendor>(`/events/${eventId}/vendors`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateVendor: (id: number, data: Partial<Vendor>) =>
    request<Vendor>(`/vendors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteVendor: (id: number) =>
    request<void>(`/vendors/${id}`, {
      method: 'DELETE'
    }),

  // Guests
  addGuest: (eventId: number, data: { name: string; email?: string; rsvp_status: string; dietary_notes?: string; plus_one?: boolean }) =>
    request<Guest>(`/events/${eventId}/guests`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateGuest: (id: number, data: Partial<Guest>) =>
    request<Guest>(`/guests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteGuest: (id: number) =>
    request<void>(`/guests/${id}`, {
      method: 'DELETE'
    })
};
