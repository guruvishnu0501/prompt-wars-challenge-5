export interface BudgetItem {
  id: number;
  event_id: number;
  category: string;
  allocated_amount: number;
  spent_amount: number;
  is_variable_guest: boolean;
  percentage: number;
  notes?: string;
  is_user_edited: boolean;
  created_at?: string;
}

export interface Task {
  id: number;
  event_id: number;
  title: string;
  category: string;
  due_date: string;
  days_before_event: number;
  status: 'pending' | 'completed';
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  is_user_edited: boolean;
  is_overdue: boolean;
  days_until_due: number;
  created_at?: string;
}

export interface Vendor {
  id: number;
  event_id: number;
  name: string;
  category: string;
  contact_info?: string;
  quote_amount: number;
  status: 'researching' | 'contacted' | 'booked' | 'paid';
  notes?: string;
  created_at?: string;
}

export interface Guest {
  id: number;
  event_id: number;
  name: string;
  email?: string;
  rsvp_status: 'attending' | 'declined' | 'pending';
  dietary_notes?: string;
  plus_one: boolean;
  created_at?: string;
}

export interface ScheduleItem {
  time: string;
  activity: string;
  description: string;
}

export interface EventPlan {
  id: number;
  title: string;
  event_type: string;
  event_date: string;
  guest_count: number;
  total_budget: number;
  currency: string;
  location: string;
  theme_concept: string;
  color_palette: string;
  dress_code: string;
  mood_description: string;
  schedule_json: string;
  is_demo: boolean;
  ai_provider: string;
  created_at?: string;
  updated_at?: string;
  
  total_spent: number;
  total_allocated: number;
  remaining_budget: number;
  cost_per_guest: number;
  overdue_task_count: number;
  total_task_count: number;
  completed_task_count: number;

  budget_items: BudgetItem[];
  tasks: Task[];
  vendors: Vendor[];
  guests: Guest[];
}

export interface HealthInfo {
  status: string;
  service: string;
  version: string;
  groq_configured: boolean;
  groq_model?: string;
  mode: string;
  timestamp: string;
}
