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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cu_lookup: {
        Row: {
          code: string
          description: string | null
          id: string
          review_id: string
        }
        Insert: {
          code: string
          description?: string | null
          id: string
          review_id: string
        }
        Update: {
          code?: string
          description?: string | null
          id?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cu_lookup_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      kmz_placemarks: {
        Row: {
          id: string
          placemark_data: Json
          review_id: string
        }
        Insert: {
          id: string
          placemark_data: Json
          review_id: string
        }
        Update: {
          id?: string
          placemark_data?: Json
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kmz_placemarks_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_annotations: {
        Row: {
          annotation_data: Json
          id: string
          page_number: number
          review_id: string
        }
        Insert: {
          annotation_data: Json
          id: string
          page_number: number
          review_id: string
        }
        Update: {
          annotation_data?: Json
          id?: string
          page_number?: number
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_annotations_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_files: {
        Row: {
          created_at: string | null
          file_data: string
          file_name: string
          file_size: number | null
          id: string
          mime_type: string | null
          review_id: string
        }
        Insert: {
          created_at?: string | null
          file_data: string
          file_name: string
          file_size?: number | null
          id: string
          mime_type?: string | null
          review_id: string
        }
        Update: {
          created_at?: string | null
          file_data?: string
          file_name?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_files_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_mappings: {
        Row: {
          edited_spec_number: string | null
          id: string
          page_number: number
          review_id: string
          spec_number: string | null
          station: string
        }
        Insert: {
          edited_spec_number?: string | null
          id: string
          page_number: number
          review_id: string
          spec_number?: string | null
          station: string
        }
        Update: {
          edited_spec_number?: string | null
          id?: string
          page_number?: number
          review_id?: string
          spec_number?: string | null
          station?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_mappings_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_rows: {
        Row: {
          created_at: string | null
          cu_check: number | null
          description: string | null
          designer_cu: string | null
          designer_qty: number | null
          designer_wf: string | null
          id: string
          issue_type: string
          map_notes: string | null
          qa_comments: string | null
          qa_cu: string | null
          qa_qty: number | null
          qa_wf: string | null
          qty_check: number | null
          review_id: string
          row_order: number | null
          station: string
          updated_at: string | null
          wf_check: number | null
          work_set: string | null
        }
        Insert: {
          created_at?: string | null
          cu_check?: number | null
          description?: string | null
          designer_cu?: string | null
          designer_qty?: number | null
          designer_wf?: string | null
          id: string
          issue_type: string
          map_notes?: string | null
          qa_comments?: string | null
          qa_cu?: string | null
          qa_qty?: number | null
          qa_wf?: string | null
          qty_check?: number | null
          review_id: string
          row_order?: number | null
          station: string
          updated_at?: string | null
          wf_check?: number | null
          work_set?: string | null
        }
        Update: {
          created_at?: string | null
          cu_check?: number | null
          description?: string | null
          designer_cu?: string | null
          designer_qty?: number | null
          designer_wf?: string | null
          id?: string
          issue_type?: string
          map_notes?: string | null
          qa_comments?: string | null
          qa_cu?: string | null
          qa_qty?: number | null
          qa_wf?: string | null
          qty_check?: number | null
          review_id?: string
          row_order?: number | null
          station?: string
          updated_at?: string | null
          wf_check?: number | null
          work_set?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_rows_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          file_name: string | null
          id: string
          kmz_file_name: string | null
          pdf_file_name: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          file_name?: string | null
          id: string
          kmz_file_name?: string | null
          pdf_file_name?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          file_name?: string | null
          id?: string
          kmz_file_name?: string | null
          pdf_file_name?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          password_hash: string
          role: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          password_hash: string
          role?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          password_hash?: string
          role?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      work_point_notes: {
        Row: {
          id: string
          notes: string | null
          review_id: string
          work_point: string
        }
        Insert: {
          id: string
          notes?: string | null
          review_id: string
          work_point: string
        }
        Update: {
          id?: string
          notes?: string | null
          review_id?: string
          work_point?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_point_notes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
