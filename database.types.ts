export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      articles: {
        Row: {
          asset_tag: number | null
          company_id: number
          created_at: string
          created_by: string | null
          default_location: number | null
          files: Json | null
          id: number
          metadata: Json | null
          name: string
        }
        Insert: {
          asset_tag?: number | null
          company_id: number
          created_at?: string
          created_by?: string | null
          default_location?: number | null
          files?: Json | null
          id?: number
          metadata?: Json | null
          name?: string
        }
        Update: {
          asset_tag?: number | null
          company_id?: number
          created_at?: string
          created_by?: string | null
          default_location?: number | null
          files?: Json | null
          id?: number
          metadata?: Json | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_asset_tag_fkey"
            columns: ["asset_tag"]
            isOneToOne: false
            referencedRelation: "asset_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_default_location_fkey"
            columns: ["default_location"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_tag_templates: {
        Row: {
          company_id: number | null
          created_at: string
          created_by: string | null
          id: number
          template: Json | null
        }
        Insert: {
          company_id?: number | null
          created_at?: string
          created_by?: string | null
          id?: number
          template?: Json | null
        }
        Update: {
          company_id?: number | null
          created_at?: string
          created_by?: string | null
          id?: number
          template?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_tag_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_tag_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_tags: {
        Row: {
          company_id: number | null
          created_at: string
          created_by: string | null
          id: number
          nfc_tag_id: number | null
          printed_applied: boolean
          printed_code: string | null
          printed_template: number | null
        }
        Insert: {
          company_id?: number | null
          created_at?: string
          created_by?: string | null
          id?: number
          nfc_tag_id?: number | null
          printed_applied?: boolean
          printed_code?: string | null
          printed_template?: number | null
        }
        Update: {
          company_id?: number | null
          created_at?: string
          created_by?: string | null
          id?: number
          nfc_tag_id?: number | null
          printed_applied?: boolean
          printed_code?: string | null
          printed_template?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_tags_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_tags_nfc_tag_id_fkey"
            columns: ["nfc_tag_id"]
            isOneToOne: false
            referencedRelation: "nfc_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_tags_printed_template_fkey"
            columns: ["printed_template"]
            isOneToOne: false
            referencedRelation: "asset_tag_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          articles: Json[] | null
          asset_tag: number | null
          case_equipment: number | null
          company_id: number | null
          created_at: string
          created_by: string | null
          description: string | null
          equipments: number[] | null
          files: Json | null
          id: number
          name: string | null
        }
        Insert: {
          articles?: Json[] | null
          asset_tag?: number | null
          case_equipment?: number | null
          company_id?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          equipments?: number[] | null
          files?: Json | null
          id?: number
          name?: string | null
        }
        Update: {
          articles?: Json[] | null
          asset_tag?: number | null
          case_equipment?: number | null
          company_id?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          equipments?: number[] | null
          files?: Json | null
          id?: number
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cases_asset_tag_fkey"
            columns: ["asset_tag"]
            isOneToOne: false
            referencedRelation: "asset_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_case_equipment_fkey"
            columns: ["case_equipment"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          description: string | null
          files: Json | null
          id: number
          metadata: Json | null
          name: string
          owner_user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          files?: Json | null
          id?: number
          metadata?: Json | null
          name: string
          owner_user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          files?: Json | null
          id?: number
          metadata?: Json | null
          name?: string
          owner_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          company_id: number
          company_name: string | null
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          files: Json | null
          forename: string | null
          id: number
          metadata: Json | null
          postal_code: string | null
          surname: string | null
          type: string | null
        }
        Insert: {
          address?: string | null
          company_id: number
          company_name?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          files?: Json | null
          forename?: string | null
          id?: number
          metadata?: Json | null
          postal_code?: string | null
          surname?: string | null
          type?: string | null
        }
        Update: {
          address?: string | null
          company_id?: number
          company_name?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          files?: Json | null
          forename?: string | null
          id?: number
          metadata?: Json | null
          postal_code?: string | null
          surname?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipments: {
        Row: {
          added_to_inventory_at: string | null
          article_id: number | null
          asset_tag: number | null
          company_id: number
          created_at: string
          created_by: string
          current_location: number | null
          files: Json | null
          id: number
          metadata: Json | null
        }
        Insert: {
          added_to_inventory_at?: string | null
          article_id?: number | null
          asset_tag?: number | null
          company_id: number
          created_at?: string
          created_by?: string
          current_location?: number | null
          files?: Json | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          added_to_inventory_at?: string | null
          article_id?: number | null
          asset_tag?: number | null
          company_id?: number
          created_at?: string
          created_by?: string
          current_location?: number | null
          files?: Json | null
          id?: number
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "equipments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipments_asset_tag_fkey"
            columns: ["asset_tag"]
            isOneToOne: false
            referencedRelation: "asset_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipments_current_location_fkey"
            columns: ["current_location"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      history: {
        Row: {
          change_made_by: string | null
          company_id: number | null
          created_at: string
          data_id: number
          id: number
          old_data: Json
          table_name: string
        }
        Insert: {
          change_made_by?: string | null
          company_id?: number | null
          created_at?: string
          data_id: number
          id?: number
          old_data: Json
          table_name: string
        }
        Update: {
          change_made_by?: string | null
          company_id?: number | null
          created_at?: string
          data_id?: number
          id?: number
          old_data?: Json
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "history_change_made_by_fkey"
            columns: ["change_made_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      job_assets_on_job: {
        Row: {
          case_id: number | null
          company_id: number
          created_at: string
          created_by: string | null
          equipment_id: number | null
          id: number
          job_id: number
        }
        Insert: {
          case_id?: number | null
          company_id: number
          created_at?: string
          created_by?: string | null
          equipment_id?: number | null
          id?: number
          job_id: number
        }
        Update: {
          case_id?: number | null
          company_id?: number
          created_at?: string
          created_by?: string | null
          equipment_id?: number | null
          id?: number
          job_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_assets_on_job_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_assets_on_job_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_assets_on_job_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_assets_on_job_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_assets_on_job_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_booked_assets: {
        Row: {
          case_id: number | null
          company_id: number
          created_at: string
          created_by: string | null
          equipment_id: number | null
          id: number
          job_id: number
        }
        Insert: {
          case_id?: number | null
          company_id: number
          created_at?: string
          created_by?: string | null
          equipment_id?: number | null
          id?: number
          job_id: number
        }
        Update: {
          case_id?: number | null
          company_id?: number
          created_at?: string
          created_by?: string | null
          equipment_id?: number | null
          id?: number
          job_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_booked_assets_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_booked_assets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_booked_assets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_booked_assets_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_booked_assets_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          company_id: number
          created_at: string
          created_by: string | null
          customer_id: number | null
          enddate: string | null
          files: Json | null
          id: number
          job_location: string | null
          meta: Json | null
          name: string | null
          startdate: string | null
          type: string | null
        }
        Insert: {
          company_id: number
          created_at?: string
          created_by?: string | null
          customer_id?: number | null
          enddate?: string | null
          files?: Json | null
          id?: number
          job_location?: string | null
          meta?: Json | null
          name?: string | null
          startdate?: string | null
          type?: string | null
        }
        Update: {
          company_id?: number
          created_at?: string
          created_by?: string | null
          customer_id?: number | null
          enddate?: string | null
          files?: Json | null
          id?: number
          job_location?: string | null
          meta?: Json | null
          name?: string | null
          startdate?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          asset_tag: number | null
          company_id: number
          created_at: string
          created_by: string
          description: string | null
          files: Json | null
          id: number
          name: string
        }
        Insert: {
          asset_tag?: number | null
          company_id: number
          created_at?: string
          created_by?: string
          description?: string | null
          files?: Json | null
          id?: number
          name: string
        }
        Update: {
          asset_tag?: number | null
          company_id?: number
          created_at?: string
          created_by?: string
          description?: string | null
          files?: Json | null
          id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_asset_tag_fkey"
            columns: ["asset_tag"]
            isOneToOne: false
            referencedRelation: "asset_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nfc_tags: {
        Row: {
          company_id: number
          created_at: string
          created_by: string | null
          id: number
          tag_id: string
        }
        Insert: {
          company_id: number
          created_at?: string
          created_by?: string | null
          id?: number
          tag_id: string
        }
        Update: {
          company_id?: number
          created_at?: string
          created_by?: string | null
          id?: number
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nfc_tags_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfc_tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
        }
        Insert: {
          avatar_url?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
        }
        Update: {
          avatar_url?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      users_companies: {
        Row: {
          company_id: number
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          company_id: number
          created_at?: string
          id?: number
          user_id: string
        }
        Update: {
          company_id?: number
          created_at?: string
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_companies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_company_member: {
        Args: { p_company_id: number }
        Returns: boolean
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

