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
      admin_messages: {
        Row: {
          admin_id: string
          created_at: string | null
          id: string
          message: string
          target_mess_id: string | null
          target_type: string
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          id?: string
          message: string
          target_mess_id?: string | null
          target_type: string
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          id?: string
          message?: string
          target_mess_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_messages_target_mess_id_fkey"
            columns: ["target_mess_id"]
            isOneToOne: false
            referencedRelation: "messes"
            referencedColumns: ["id"]
          },
        ]
      }
      bazars: {
        Row: {
          cost: number
          created_at: string
          date: string
          id: string
          items: string | null
          member_id: string | null
          mess_id: string
          note: string | null
          person_name: string
          updated_at: string
        }
        Insert: {
          cost?: number
          created_at?: string
          date?: string
          id?: string
          items?: string | null
          member_id?: string | null
          mess_id: string
          note?: string | null
          person_name: string
          updated_at?: string
        }
        Update: {
          cost?: number
          created_at?: string
          date?: string
          id?: string
          items?: string | null
          member_id?: string | null
          mess_id?: string
          note?: string | null
          person_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bazars_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bazars_mess_id_fkey"
            columns: ["mess_id"]
            isOneToOne: false
            referencedRelation: "messes"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_message_replies: {
        Row: {
          admin_id: string
          contact_message_id: string
          id: string
          reply_message: string
          sent_at: string
        }
        Insert: {
          admin_id: string
          contact_message_id: string
          id?: string
          reply_message: string
          sent_at?: string
        }
        Update: {
          admin_id?: string
          contact_message_id?: string
          id?: string
          reply_message?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_message_replies_contact_message_id_fkey"
            columns: ["contact_message_id"]
            isOneToOne: false
            referencedRelation: "contact_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expiry_date: string | null
          id: string
          status: string
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          expiry_date?: string | null
          id?: string
          status?: string
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expiry_date?: string | null
          id?: string
          status?: string
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: []
      }
      deposits: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          member_id: string
          mess_id: string
          note: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          id?: string
          member_id: string
          mess_id: string
          note?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          member_id?: string
          mess_id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deposits_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_mess_id_fkey"
            columns: ["mess_id"]
            isOneToOne: false
            referencedRelation: "messes"
            referencedColumns: ["id"]
          },
        ]
      }
      email_otps: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          otp_code: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          otp_code: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          verified?: boolean
        }
        Relationships: []
      }
      help_desk_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          sender_id?: string
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_desk_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "help_desk_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      help_desk_tickets: {
        Row: {
          created_at: string
          id: string
          mess_id: string
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mess_id: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mess_id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_desk_tickets_mess_id_fkey"
            columns: ["mess_id"]
            isOneToOne: false
            referencedRelation: "messes"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          breakfast: number
          created_at: string
          date: string
          dinner: number
          id: string
          lunch: number
          member_id: string
          mess_id: string
          updated_at: string
        }
        Insert: {
          breakfast?: number
          created_at?: string
          date?: string
          dinner?: number
          id?: string
          lunch?: number
          member_id: string
          mess_id: string
          updated_at?: string
        }
        Update: {
          breakfast?: number
          created_at?: string
          date?: string
          dinner?: number
          id?: string
          lunch?: number
          member_id?: string
          mess_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meals_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meals_mess_id_fkey"
            columns: ["mess_id"]
            isOneToOne: false
            referencedRelation: "messes"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          mess_id: string
          name: string
          password: string
          phone: string | null
          room_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          mess_id: string
          name: string
          password: string
          phone?: string | null
          room_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          mess_id?: string
          name?: string
          password?: string
          phone?: string | null
          room_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_mess_id_fkey"
            columns: ["mess_id"]
            isOneToOne: false
            referencedRelation: "messes"
            referencedColumns: ["id"]
          },
        ]
      }
      messes: {
        Row: {
          created_at: string
          current_month: string
          id: string
          manager_id: string
          mess_id: string
          mess_password: string | null
          name: string | null
          status: Database["public"]["Enums"]["mess_status"]
          suspend_reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_month?: string
          id?: string
          manager_id: string
          mess_id: string
          mess_password?: string | null
          name?: string | null
          status?: Database["public"]["Enums"]["mess_status"]
          suspend_reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_month?: string
          id?: string
          manager_id?: string
          mess_id?: string
          mess_password?: string | null
          name?: string | null
          status?: Database["public"]["Enums"]["mess_status"]
          suspend_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      monthly_archives: {
        Row: {
          created_at: string
          id: string
          meal_rate: number
          members_data: Json
          mess_id: string
          month: string
          total_bazar: number
          total_meals: number
        }
        Insert: {
          created_at?: string
          id?: string
          meal_rate?: number
          members_data?: Json
          mess_id: string
          month: string
          total_bazar?: number
          total_meals?: number
        }
        Update: {
          created_at?: string
          id?: string
          meal_rate?: number
          members_data?: Json
          mess_id?: string
          month?: string
          total_bazar?: number
          total_meals?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_archives_mess_id_fkey"
            columns: ["mess_id"]
            isOneToOne: false
            referencedRelation: "messes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          from_user_id: string | null
          id: string
          is_read: boolean
          mess_id: string
          message: string
          to_all: boolean
          to_member_id: string | null
        }
        Insert: {
          created_at?: string
          from_user_id?: string | null
          id?: string
          is_read?: boolean
          mess_id: string
          message: string
          to_all?: boolean
          to_member_id?: string | null
        }
        Update: {
          created_at?: string
          from_user_id?: string | null
          id?: string
          is_read?: boolean
          mess_id?: string
          message?: string
          to_all?: boolean
          to_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_mess_id_fkey"
            columns: ["mess_id"]
            isOneToOne: false
            referencedRelation: "messes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_to_member_id_fkey"
            columns: ["to_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          bkash_number: string | null
          coupon_code: string | null
          created_at: string
          discount_amount: number | null
          id: string
          mess_id: string
          payment_method: string
          plan_type: Database["public"]["Enums"]["subscription_type"]
          reject_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["payment_status"]
          transaction_id: string | null
        }
        Insert: {
          amount: number
          bkash_number?: string | null
          coupon_code?: string | null
          created_at?: string
          discount_amount?: number | null
          id?: string
          mess_id: string
          payment_method: string
          plan_type?: Database["public"]["Enums"]["subscription_type"]
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          bkash_number?: string | null
          coupon_code?: string | null
          created_at?: string
          discount_amount?: number | null
          id?: string
          mess_id?: string
          payment_method?: string
          plan_type?: Database["public"]["Enums"]["subscription_type"]
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_mess_id_fkey"
            columns: ["mess_id"]
            isOneToOne: false
            referencedRelation: "messes"
            referencedColumns: ["id"]
          },
        ]
      }
      pin_access_logs: {
        Row: {
          accessed_by: string | null
          created_at: string
          id: string
          ip_address: string | null
          member_id: string
          success: boolean
        }
        Insert: {
          accessed_by?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          member_id: string
          success: boolean
        }
        Update: {
          accessed_by?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          member_id?: string
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "pin_access_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_settings: {
        Row: {
          id: string
          monthly_price: number
          updated_at: string
          updated_by: string | null
          yearly_price: number
        }
        Insert: {
          id?: string
          monthly_price?: number
          updated_at?: string
          updated_by?: string | null
          yearly_price?: number
        }
        Update: {
          id?: string
          monthly_price?: number
          updated_at?: string
          updated_by?: string | null
          yearly_price?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          coupon_code: string | null
          created_at: string
          cta_text_bn: string
          cta_text_en: string
          id: string
          is_active: boolean
          offer_name_bn: string
          offer_name_en: string
          updated_at: string
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          cta_text_bn?: string
          cta_text_en?: string
          id?: string
          is_active?: boolean
          offer_name_bn: string
          offer_name_en: string
          updated_at?: string
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          cta_text_bn?: string
          cta_text_en?: string
          id?: string
          is_active?: boolean
          offer_name_bn?: string
          offer_name_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          coupon_code: string | null
          created_at: string
          end_date: string
          id: string
          mess_id: string
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          type: Database["public"]["Enums"]["subscription_type"]
          updated_at: string
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          end_date: string
          id?: string
          mess_id: string
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          type?: Database["public"]["Enums"]["subscription_type"]
          updated_at?: string
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          end_date?: string
          id?: string
          mess_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          type?: Database["public"]["Enums"]["subscription_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_mess_id_fkey"
            columns: ["mess_id"]
            isOneToOne: true
            referencedRelation: "messes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_otps: { Args: never; Returns: undefined }
      finalize_mess_setup: {
        Args: { p_mess_name: string; p_mess_uuid: string }
        Returns: string
      }
      generate_mess_id: { Args: never; Returns: string }
      generate_temp_mess_id: { Args: never; Returns: string }
      get_user_emails_for_admin: {
        Args: { user_ids: string[] }
        Returns: {
          email: string
          user_id: string
        }[]
      }
      get_user_mess_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_mess_manager: {
        Args: { _mess_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      mess_status: "active" | "inactive" | "suspended"
      payment_status: "pending" | "approved" | "rejected"
      subscription_status: "active" | "expired" | "cancelled"
      subscription_type: "monthly" | "yearly"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
      user_role: "manager" | "member" | "admin"
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
      mess_status: ["active", "inactive", "suspended"],
      payment_status: ["pending", "approved", "rejected"],
      subscription_status: ["active", "expired", "cancelled"],
      subscription_type: ["monthly", "yearly"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
      user_role: ["manager", "member", "admin"],
    },
  },
} as const
