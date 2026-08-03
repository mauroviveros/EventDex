export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4";
  };
  public: {
    Tables: {
      event_locations: {
        Row: {
          address: string;
          city: string;
          country: string;
          created_at: string;
          event_id: string;
          latitude: number | null;
          longitude: number | null;
          name: string;
          state: string;
          updated_at: string | null;
        };
        Insert: {
          address: string;
          city: string;
          country: string;
          created_at?: string;
          event_id: string;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          state: string;
          updated_at?: string | null;
        };
        Update: {
          address?: string;
          city?: string;
          country?: string;
          created_at?: string;
          event_id?: string;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          state?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_locations_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: true;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      event_schedules: {
        Row: {
          created_at: string;
          end_datetime: string;
          event_id: string;
          id: number;
          start_datetime: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          end_datetime: string;
          event_id: string;
          id?: number;
          start_datetime: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          end_datetime?: string;
          event_id?: string;
          id?: number;
          start_datetime?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_sessions_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      event_spots: {
        Row: {
          avatar_path: string;
          created_at: string;
          deleted_at: string | null;
          description: string;
          event_id: string;
          id: string;
          location: string;
          name: string;
          status: Database["public"]["Enums"]["SPOT_STATUS"];
          type: Database["public"]["Enums"]["SPOT_TYPE"] | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_path: string;
          created_at?: string;
          deleted_at?: string | null;
          description: string;
          event_id: string;
          id?: string;
          location: string;
          name: string;
          status?: Database["public"]["Enums"]["SPOT_STATUS"];
          type?: Database["public"]["Enums"]["SPOT_TYPE"] | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_path?: string;
          created_at?: string;
          deleted_at?: string | null;
          description?: string;
          event_id?: string;
          id?: string;
          location?: string;
          name?: string;
          status?: Database["public"]["Enums"]["SPOT_STATUS"];
          type?: Database["public"]["Enums"]["SPOT_TYPE"] | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_spots_event_id_fkey1";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          config: Json;
          created_at: string;
          deleted_at: string | null;
          description: string;
          edition: string | null;
          id: string;
          organization_id: string;
          status: Database["public"]["Enums"]["event_status"] | null;
          timezone: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          config: Json;
          created_at?: string;
          deleted_at?: string | null;
          description: string;
          edition?: string | null;
          id?: string;
          organization_id: string;
          status?: Database["public"]["Enums"]["event_status"] | null;
          timezone?: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          config?: Json;
          created_at?: string;
          deleted_at?: string | null;
          description?: string;
          edition?: string | null;
          id?: string;
          organization_id?: string;
          status?: Database["public"]["Enums"]["event_status"] | null;
          timezone?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_members: {
        Row: {
          created_at: string;
          event_id: string | null;
          id: number;
          organization_id: string;
          role: Database["public"]["Enums"]["ORGANIZATION_MEMBER_ROLE"];
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_id?: string | null;
          id?: number;
          organization_id: string;
          role: Database["public"]["Enums"]["ORGANIZATION_MEMBER_ROLE"];
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_id?: string | null;
          id?: number;
          organization_id?: string;
          role?: Database["public"]["Enums"]["ORGANIZATION_MEMBER_ROLE"];
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string;
          domain: string | null;
          id: string;
          name: string;
          slug: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          domain?: string | null;
          id?: string;
          name?: string;
          slug?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          domain?: string | null;
          id?: string;
          name?: string;
          slug?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          fullname: string;
          id: string;
          initials: string;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          fullname: string;
          id: string;
          initials: string;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          fullname?: string;
          id?: string;
          initials?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      raffle_winners: {
        Row: {
          drawn_at: string;
          drawn_by: string;
          event_id: string;
          id: string;
          spot_count: number;
          user_id: string;
        };
        Insert: {
          drawn_at?: string;
          drawn_by: string;
          event_id: string;
          id?: string;
          spot_count?: number;
          user_id: string;
        };
        Update: {
          drawn_at?: string;
          drawn_by?: string;
          event_id?: string;
          id?: string;
          spot_count?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "raffle_winners_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      user_spot_history: {
        Row: {
          collected_at: string;
          id: number;
          spot_id: string;
          user_id: string;
        };
        Insert: {
          collected_at?: string;
          id?: number;
          spot_id: string;
          user_id?: string;
        };
        Update: {
          collected_at?: string;
          id?: number;
          spot_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_history_spot_id_fkey";
            columns: ["spot_id"];
            isOneToOne: false;
            referencedRelation: "event_spots";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      event_status: "ACTIVE" | "INACTIVE";
      ORGANIZATION_MEMBER_ROLE: "ADMIN" | "STAFF" | "SPOT_OWNER";
      SPOT_STATUS: "ACTIVE" | "INACTIVE";
      SPOT_TYPE: "LOCAL" | "ATTRACTION";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      event_status: ["ACTIVE", "INACTIVE"],
      ORGANIZATION_MEMBER_ROLE: ["ADMIN", "STAFF", "SPOT_OWNER"],
      SPOT_STATUS: ["ACTIVE", "INACTIVE"],
      SPOT_TYPE: ["LOCAL", "ATTRACTION"],
    },
  },
} as const;
