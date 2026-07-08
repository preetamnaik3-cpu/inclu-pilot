export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          designation: string | null;
          role: "client" | "manager" | "team" | "admin" | "unassigned";
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          designation?: string | null;
          role?: "client" | "manager" | "team" | "admin" | "unassigned";
          created_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string;
          designation?: string | null;
          role?: "client" | "manager" | "team" | "admin" | "unassigned";
        };
        Relationships: [];
      };
      platform_config: {
        Row: {
          key: string;
          value: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: string;
          updated_at?: string;
        };
        Update: {
          value?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_team_members: {
        Row: {
          project_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          project_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          project_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          name: string;
          client_id: string;
          manager_id: string;
          status: "active" | "paused" | "completed";
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          client_id: string;
          manager_id: string;
          status?: "active" | "paused" | "completed";
        };
        Update: {
          name?: string;
          status?: "active" | "paused" | "completed";
        };
        Relationships: [];
      };
      work_items: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          outcome_description: string | null;
          status: "planned" | "in_progress" | "in_review" | "done";
          preview_url: string | null;
          due_label: string | null;
          sort_order: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          outcome_description?: string | null;
          status?: "planned" | "in_progress" | "in_review" | "done";
          preview_url?: string | null;
          due_label?: string | null;
          sort_order?: number;
          created_by?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          outcome_description?: string | null;
          status?: "planned" | "in_progress" | "in_review" | "done";
          preview_url?: string | null;
          due_label?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      work_item_assignments: {
        Row: {
          work_item_id: string;
          user_id: string;
          visible_to_client: boolean;
        };
        Insert: {
          work_item_id: string;
          user_id: string;
          visible_to_client?: boolean;
        };
        Update: {
          visible_to_client?: boolean;
        };
        Relationships: [];
      };
      work_item_comments: {
        Row: {
          id: string;
          work_item_id: string;
          author_id: string;
          body: string;
          is_manager_reply: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          work_item_id: string;
          author_id: string;
          body: string;
          is_manager_reply?: boolean;
        };
        Update: {
          body?: string;
        };
        Relationships: [];
      };
      activity_updates: {
        Row: {
          id: string;
          project_id: string;
          icon: string | null;
          title: string;
          subtitle: string | null;
          visible_to_client: boolean;
          work_item_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          icon?: string | null;
          title: string;
          subtitle?: string | null;
          visible_to_client?: boolean;
          work_item_id?: string | null;
        };
        Update: {
          title?: string;
          subtitle?: string | null;
          visible_to_client?: boolean;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          project_id: string;
          type: "client_manager" | "internal_team";
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          type: "client_manager" | "internal_team";
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          body: string;
        };
        Update: {
          body?: string;
        };
        Relationships: [];
      };
    };
    Enums: {
      user_role: "client" | "manager" | "team" | "admin" | "unassigned";
      work_status: "planned" | "in_progress" | "in_review" | "done";
      project_status: "active" | "paused" | "completed";
      conversation_type: "client_manager" | "internal_team";
    };
  };
};
