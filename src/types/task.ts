export type TaskStatus = "pending" | "completed" | "expired";

export interface Task {
  id: string;
  player_id: string;
  created_by: string;
  title: string;
  description: string | null;
  deadline: string | null;
  status: TaskStatus;
  difficulty: 1 | 2 | 3;
  is_permanent: boolean;
  repeat_interval_days: number | null;
  repeat_anchor: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  deadline?: string;
  difficulty: 1 | 2 | 3;
  is_permanent: boolean;
  repeat_interval_days?: number;
  repeat_anchor?: string;
}
