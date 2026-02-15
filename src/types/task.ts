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
}
