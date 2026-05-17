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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      aircraft_state: {
        Row: {
          altitude: number | null
          flight: string | null
          ground_speed: number | null
          hex: string | null
          last_checked: string
          last_seen: string | null
          lat: number | null
          lon: number | null
          on_ground: boolean | null
          raw: Json | null
          registration: string
        }
        Insert: {
          altitude?: number | null
          flight?: string | null
          ground_speed?: number | null
          hex?: string | null
          last_checked?: string
          last_seen?: string | null
          lat?: number | null
          lon?: number | null
          on_ground?: boolean | null
          raw?: Json | null
          registration: string
        }
        Update: {
          altitude?: number | null
          flight?: string | null
          ground_speed?: number | null
          hex?: string | null
          last_checked?: string
          last_seen?: string | null
          lat?: number | null
          lon?: number | null
          on_ground?: boolean | null
          raw?: Json | null
          registration?: string
        }
        Relationships: []
      }
      alert_log: {
        Row: {
          created_at: string
          id: string
          kind: string
          message: string
          registration: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          message: string
          registration: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          message?: string
          registration?: string
        }
        Relationships: []
      }
      alert_recipients: {
        Row: {
          created_at: string
          id: string
          kind: string
          label: string | null
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          label?: string | null
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          label?: string | null
          value?: string
        }
        Relationships: []
      }
      email_clicks: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id?: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      flight_sessions: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: string
          ip: string | null
          last_seen: string
          region: string | null
          revoked_at: string | null
          token: string
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          last_seen?: string
          region?: string | null
          revoked_at?: string | null
          token: string
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          last_seen?: string
          region?: string | null
          revoked_at?: string | null
          token?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      flight_site_settings: {
        Row: {
          id: number
          password_hash: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          password_hash?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          password_hash?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      gallery_project_images: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          project_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          project_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "gallery_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_projects: {
        Row: {
          aspect_ratio: number | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          main_image_url: string
          title: string | null
          updated_at: string
        }
        Insert: {
          aspect_ratio?: number | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          main_image_url: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          aspect_ratio?: number | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          main_image_url?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          checked: boolean
          created_at: string
          id: number
          target_date: string | null
          updated_at: string
        }
        Insert: {
          checked?: boolean
          created_at?: string
          id: number
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          checked?: boolean
          created_at?: string
          id?: number
          target_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      music_artworks: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          thumbnail_url: string
          title: string
          updated_at: string
          youtube_url: string
          youtube_video_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          thumbnail_url: string
          title: string
          updated_at?: string
          youtube_url: string
          youtube_video_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          thumbnail_url?: string
          title?: string
          updated_at?: string
          youtube_url?: string
          youtube_video_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string
          id: number
          updated_at: string
        }
        Insert: {
          content?: string
          id?: number
          updated_at?: string
        }
        Update: {
          content?: string
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      page_visits: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: string
          page_path: string
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          page_path: string
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          page_path?: string
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tracked_flights: {
        Row: {
          created_at: string
          id: string
          label: string | null
          registration: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          registration: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          registration?: string
        }
        Relationships: []
      }
      websites: {
        Row: {
          created_at: string
          custom_thumbnail_url: string | null
          display_order: number | null
          id: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          custom_thumbnail_url?: string | null
          display_order?: number | null
          id?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          custom_thumbnail_url?: string | null
          display_order?: number | null
          id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
