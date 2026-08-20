export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          created_at: string
          diff: Json | null
          entity_id: string | null
          entity_type: string
          id: number
          organization_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: number
          organization_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: number
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_invoices: {
        Row: {
          amount_cents: number
          concept: string
          created_at: string
          currency: string
          due_at: string | null
          event_id: string | null
          id: string
          issued_at: string
          marked_by: string | null
          notes: string | null
          organization_id: string
          paid_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string | null
        }
        Insert: {
          amount_cents: number
          concept: string
          created_at?: string
          currency?: string
          due_at?: string | null
          event_id?: string | null
          id?: string
          issued_at?: string
          marked_by?: string | null
          notes?: string | null
          organization_id: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number
          concept?: string
          created_at?: string
          currency?: string
          due_at?: string | null
          event_id?: string | null
          id?: string
          issued_at?: string
          marked_by?: string | null
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_stats"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_timeline"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_invoices_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_members: {
        Row: {
          created_at: string
          event_id: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["event_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          organization_id: string
          role: Database["public"]["Enums"]["event_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["event_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_members_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_stats"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_members_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_timeline"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_members_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          organization_id: string
          registered_at: string
          source: string | null
          status: Database["public"]["Enums"]["registration_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          organization_id: string
          registered_at?: string
          source?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          organization_id?: string
          registered_at?: string
          source?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_stats"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_timeline"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_schedules: {
        Row: {
          created_at: string
          ends_at: string
          event_id: string
          id: string
          label: string | null
          organization_id: string
          starts_at: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          ends_at: string
          event_id: string
          id?: string
          label?: string | null
          organization_id: string
          starts_at: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          ends_at?: string
          event_id?: string
          id?: string
          label?: string | null
          organization_id?: string
          starts_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_schedules_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_stats"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_schedules_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_timeline"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_schedules_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_series: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_series_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_series_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_spot_exhibitors: {
        Row: {
          can_edit: boolean
          created_at: string
          event_spot_id: string
          id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          can_edit?: boolean
          created_at?: string
          event_spot_id: string
          id?: string
          organization_id: string
          user_id: string
        }
        Update: {
          can_edit?: boolean
          created_at?: string
          event_spot_id?: string
          id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_spot_exhibitors_event_spot_id_fkey"
            columns: ["event_spot_id"]
            isOneToOne: false
            referencedRelation: "event_spots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_spot_exhibitors_event_spot_id_fkey"
            columns: ["event_spot_id"]
            isOneToOne: false
            referencedRelation: "event_spots_resolved"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_spot_exhibitors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_spot_exhibitors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_spot_exhibitors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_spots: {
        Row: {
          avatar_path_override: string | null
          booth: string | null
          code: string
          created_at: string
          deleted_at: string | null
          description_override: string | null
          event_id: string
          id: string
          name_override: string | null
          organization_id: string
          points: number
          snapshot: Json | null
          sort_order: number
          spot_id: string
          status: Database["public"]["Enums"]["event_spot_status"]
          updated_at: string | null
        }
        Insert: {
          avatar_path_override?: string | null
          booth?: string | null
          code: string
          created_at?: string
          deleted_at?: string | null
          description_override?: string | null
          event_id: string
          id?: string
          name_override?: string | null
          organization_id: string
          points?: number
          snapshot?: Json | null
          sort_order?: number
          spot_id: string
          status?: Database["public"]["Enums"]["event_spot_status"]
          updated_at?: string | null
        }
        Update: {
          avatar_path_override?: string | null
          booth?: string | null
          code?: string
          created_at?: string
          deleted_at?: string | null
          description_override?: string | null
          event_id?: string
          id?: string
          name_override?: string | null
          organization_id?: string
          points?: number
          snapshot?: Json | null
          sort_order?: number
          spot_id?: string
          status?: Database["public"]["Enums"]["event_spot_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_spots_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_stats"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_spots_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_timeline"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_spots_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_spots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_spots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_spots_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "spots"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          cover_path: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          edition_label: string | null
          edition_number: number | null
          id: string
          organization_id: string
          published_at: string | null
          series_id: string | null
          settings: Json
          slug: string
          status: Database["public"]["Enums"]["event_status"]
          summary: string | null
          timezone: string
          title: string
          updated_at: string | null
          venue_id: string | null
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          cover_path?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          edition_label?: string | null
          edition_number?: number | null
          id?: string
          organization_id: string
          published_at?: string | null
          series_id?: string | null
          settings?: Json
          slug: string
          status?: Database["public"]["Enums"]["event_status"]
          summary?: string | null
          timezone?: string
          title: string
          updated_at?: string | null
          venue_id?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          cover_path?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          edition_label?: string | null
          edition_number?: number | null
          id?: string
          organization_id?: string
          published_at?: string | null
          series_id?: string | null
          settings?: Json
          slug?: string
          status?: Database["public"]["Enums"]["event_status"]
          summary?: string | null
          timezone?: string
          title?: string
          updated_at?: string | null
          venue_id?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "event_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_domains: {
        Row: {
          created_at: string
          hostname: string
          id: string
          is_primary: boolean
          organization_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          hostname: string
          id?: string
          is_primary?: boolean
          organization_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          hostname?: string
          id?: string
          is_primary?: boolean
          organization_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_domains_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_domains_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          joined_at: string | null
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          brand: Json
          created_at: string
          default_timezone: string
          deleted_at: string | null
          id: string
          legal_name: string | null
          logo_path: string | null
          name: string
          slug: string
          status: Database["public"]["Enums"]["organization_status"]
          updated_at: string | null
        }
        Insert: {
          brand?: Json
          created_at?: string
          default_timezone?: string
          deleted_at?: string | null
          id?: string
          legal_name?: string | null
          logo_path?: string | null
          name: string
          slug: string
          status?: Database["public"]["Enums"]["organization_status"]
          updated_at?: string | null
        }
        Update: {
          brand?: Json
          created_at?: string
          default_timezone?: string
          deleted_at?: string | null
          id?: string
          legal_name?: string | null
          logo_path?: string | null
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["organization_status"]
          updated_at?: string | null
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string
          granted_by: string | null
          level: Database["public"]["Enums"]["platform_role"]
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          level?: Database["public"]["Enums"]["platform_role"]
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          level?: Database["public"]["Enums"]["platform_role"]
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_admins_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          full_name: string
          id: string
          locale: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          full_name?: string
          id: string
          locale?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          full_name?: string
          id?: string
          locale?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      raffle_draws: {
        Row: {
          claims_count: number
          drawn_at: string
          drawn_by: string
          event_id: string
          id: string
          organization_id: string
          prize_label: string | null
          raffle_id: string
          user_id: string
          void_reason: string | null
          voided_at: string | null
        }
        Insert: {
          claims_count?: number
          drawn_at?: string
          drawn_by: string
          event_id: string
          id?: string
          organization_id: string
          prize_label?: string | null
          raffle_id: string
          user_id: string
          void_reason?: string | null
          voided_at?: string | null
        }
        Update: {
          claims_count?: number
          drawn_at?: string
          drawn_by?: string
          event_id?: string
          id?: string
          organization_id?: string
          prize_label?: string | null
          raffle_id?: string
          user_id?: string
          void_reason?: string | null
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raffle_draws_drawn_by_fkey"
            columns: ["drawn_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raffle_draws_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_stats"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "raffle_draws_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_timeline"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "raffle_draws_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raffle_draws_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raffle_draws_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raffle_draws_raffle_id_fkey"
            columns: ["raffle_id"]
            isOneToOne: false
            referencedRelation: "raffles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raffle_draws_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      raffles: {
        Row: {
          created_at: string
          created_by: string | null
          event_id: string
          exclude_staff: boolean
          id: string
          min_claims: number
          name: string
          organization_id: string
          status: Database["public"]["Enums"]["raffle_status"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_id: string
          exclude_staff?: boolean
          id?: string
          min_claims?: number
          name?: string
          organization_id: string
          status?: Database["public"]["Enums"]["raffle_status"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_id?: string
          exclude_staff?: boolean
          id?: string
          min_claims?: number
          name?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["raffle_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raffles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raffles_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_stats"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "raffles_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_timeline"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "raffles_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raffles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raffles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      spot_claims: {
        Row: {
          claimed_at: string
          event_id: string
          event_spot_id: string
          id: string
          organization_id: string
          points_awarded: number
          source: Database["public"]["Enums"]["claim_source"]
          user_id: string
        }
        Insert: {
          claimed_at?: string
          event_id: string
          event_spot_id: string
          id?: string
          organization_id: string
          points_awarded?: number
          source?: Database["public"]["Enums"]["claim_source"]
          user_id: string
        }
        Update: {
          claimed_at?: string
          event_id?: string
          event_spot_id?: string
          id?: string
          organization_id?: string
          points_awarded?: number
          source?: Database["public"]["Enums"]["claim_source"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spot_claims_event_id_user_id_fkey"
            columns: ["event_id", "user_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["event_id", "user_id"]
          },
          {
            foreignKeyName: "spot_claims_event_id_user_id_fkey"
            columns: ["event_id", "user_id"]
            isOneToOne: false
            referencedRelation: "event_visitor_cohorts"
            referencedColumns: ["event_id", "user_id"]
          },
          {
            foreignKeyName: "spot_claims_event_spot_id_fkey"
            columns: ["event_spot_id"]
            isOneToOne: false
            referencedRelation: "event_spots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spot_claims_event_spot_id_fkey"
            columns: ["event_spot_id"]
            isOneToOne: false
            referencedRelation: "event_spots_resolved"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spot_claims_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spot_claims_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      spots: {
        Row: {
          archived_at: string | null
          avatar_path: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json
          name: string
          organization_id: string
          slug: string
          type: Database["public"]["Enums"]["spot_type"]
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          avatar_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          name: string
          organization_id: string
          slug: string
          type?: Database["public"]["Enums"]["spot_type"]
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          avatar_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          name?: string
          organization_id?: string
          slug?: string
          type?: Database["public"]["Enums"]["spot_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address_line: string | null
          city: string | null
          country: string | null
          created_at: string
          deleted_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          organization_id: string
          postal_code: string | null
          state: string | null
          timezone: string
          updated_at: string | null
        }
        Insert: {
          address_line?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          organization_id: string
          postal_code?: string | null
          state?: string | null
          timezone?: string
          updated_at?: string | null
        }
        Update: {
          address_line?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          organization_id?: string
          postal_code?: string | null
          state?: string | null
          timezone?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venues_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venues_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      event_spots_resolved: {
        Row: {
          avatar_path: string | null
          booth: string | null
          code: string | null
          deleted_at: string | null
          description: string | null
          event_id: string | null
          id: string | null
          name: string | null
          organization_id: string | null
          points: number | null
          sort_order: number | null
          spot_id: string | null
          status: Database["public"]["Enums"]["event_spot_status"] | null
          type: Database["public"]["Enums"]["spot_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "event_spots_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_stats"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_spots_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_timeline"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_spots_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_spots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_spots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_spots_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "spots"
            referencedColumns: ["id"]
          },
        ]
      }
      event_stats: {
        Row: {
          active_spots: number | null
          claims: number | null
          event_id: string | null
          organization_id: string | null
          participants: number | null
          registrations: number | null
        }
        Insert: {
          active_spots?: never
          claims?: never
          event_id?: string | null
          organization_id?: string | null
          participants?: never
          registrations?: never
        }
        Update: {
          active_spots?: never
          claims?: never
          event_id?: string | null
          organization_id?: string | null
          participants?: never
          registrations?: never
        }
        Relationships: [
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_timeline: {
        Row: {
          ends_at: string | null
          event_id: string | null
          organization_id: string | null
          phase: Database["public"]["Enums"]["event_phase"] | null
          starts_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_visitor_cohorts: {
        Row: {
          event_id: string | null
          id: string | null
          is_first_org_visit: boolean | null
          organization_id: string | null
          previous_org_events: number | null
          registered_at: string | null
          source: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_stats"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_timeline"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_visitor_stats: {
        Row: {
          event_id: string | null
          new_visitors: number | null
          organization_id: string | null
          registrations: number | null
          returning_visitors: number | null
          via_landing: number | null
          via_qr: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_stats"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_timeline"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      public_organizations: {
        Row: {
          brand: Json | null
          default_timezone: string | null
          id: string | null
          logo_path: string | null
          name: string | null
          slug: string | null
        }
        Insert: {
          brand?: Json | null
          default_timezone?: string | null
          id?: string | null
          logo_path?: string | null
          name?: string | null
          slug?: string | null
        }
        Update: {
          brand?: Json | null
          default_timezone?: string | null
          id?: string | null
          logo_path?: string | null
          name?: string | null
          slug?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      claim_spot: {
        Args: { p_event_spot_id: string }
        Returns: {
          claimed: boolean
          registered: boolean
          total_claims: number
        }[]
      }
      draw_raffle: {
        Args: { p_prize_label?: string; p_raffle_id: string }
        Returns: string
      }
      duplicate_event: {
        Args: {
          p_copy_members?: boolean
          p_copy_spots?: boolean
          p_edition_label?: string
          p_edition_number?: number
          p_slug: string
          p_source_event_id: string
        }
        Returns: string
      }
      platform_visitor_stats: {
        Args: { p_event_id: string }
        Returns: {
          new_to_platform: number
          registrations: number
          seen_before: number
        }[]
      }
      publish_event: { Args: { p_event_id: string }; Returns: undefined }
      raffle_eligible: {
        Args: { p_raffle_id: string }
        Returns: {
          claims_count: number
          user_id: string
        }[]
      }
      resolve_active_event: {
        Args: { p_organization_id: string }
        Returns: string
      }
      resolve_organization: { Args: { p_hostname: string }; Returns: string }
      void_draw: {
        Args: { p_draw_id: string; p_reason: string }
        Returns: undefined
      }
    }
    Enums: {
      claim_source: "qr" | "manual" | "import"
      event_phase: "upcoming" | "live" | "finished"
      event_role: "manager" | "staff" | "exhibitor"
      event_spot_status: "active" | "inactive"
      event_status: "draft" | "published" | "archived" | "cancelled"
      event_visibility: "public" | "unlisted"
      invoice_status: "draft" | "pending" | "paid" | "void"
      membership_status: "invited" | "active" | "revoked"
      organization_role: "owner" | "staff"
      organization_status: "active" | "suspended"
      platform_role: "developer" | "support"
      raffle_status: "draft" | "open" | "closed"
      registration_status: "active" | "blocked"
      spot_type: "stand" | "attraction" | "sponsor" | "activity"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      claim_source: ["qr", "manual", "import"],
      event_phase: ["upcoming", "live", "finished"],
      event_role: ["manager", "staff", "exhibitor"],
      event_spot_status: ["active", "inactive"],
      event_status: ["draft", "published", "archived", "cancelled"],
      event_visibility: ["public", "unlisted"],
      invoice_status: ["draft", "pending", "paid", "void"],
      membership_status: ["invited", "active", "revoked"],
      organization_role: ["owner", "staff"],
      organization_status: ["active", "suspended"],
      platform_role: ["developer", "support"],
      raffle_status: ["draft", "open", "closed"],
      registration_status: ["active", "blocked"],
      spot_type: ["stand", "attraction", "sponsor", "activity"],
    },
  },
} as const
