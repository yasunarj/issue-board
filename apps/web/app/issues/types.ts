export type ProfileRef = {
  id: string;
  role: "admin" | "member" | "viewer";
};

export type Issue = {
  id: string;
  title: string;
  description: string;
  status: "open" | "resolved";
  due_date: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  resolved_by: string | null;
  created_by_profile: ProfileRef | null;
  resolved_by_profile: ProfileRef | null;
};

export type IssueComment = {
  id: string;
  issue_id: string;
  user_id: string;
  body: string;
  created_at: string;
  user_profile: ProfileRef | null;
};