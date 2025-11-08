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
      candidate_reports: {
        Row: {
          candidate_id: string
          created_at: string | null
          detailed_analysis: Json | null
          id: string
          interview_id: string
          organization_id: string | null
          overall_rating: number | null
          recommended_action: string | null
          recruiter_id: string | null
          strengths: string[] | null
          weaknesses: string[] | null
        }
        Insert: {
          candidate_id: string
          created_at?: string | null
          detailed_analysis?: Json | null
          id?: string
          interview_id: string
          organization_id?: string | null
          overall_rating?: number | null
          recommended_action?: string | null
          recruiter_id?: string | null
          strengths?: string[] | null
          weaknesses?: string[] | null
        }
        Update: {
          candidate_id?: string
          created_at?: string | null
          detailed_analysis?: Json | null
          id?: string
          interview_id?: string
          organization_id?: string | null
          overall_rating?: number | null
          recommended_action?: string | null
          recruiter_id?: string | null
          strengths?: string[] | null
          weaknesses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_reports_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "recruiter_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_collections: {
        Row: {
          badge_icon: string
          created_at: string
          description: string
          id: string
          min_avg_score: number
          min_certificates: number
          name: string
          topic_pattern: string
        }
        Insert: {
          badge_icon?: string
          created_at?: string
          description: string
          id?: string
          min_avg_score?: number
          min_certificates?: number
          name: string
          topic_pattern: string
        }
        Update: {
          badge_icon?: string
          created_at?: string
          description?: string
          id?: string
          min_avg_score?: number
          min_certificates?: number
          name?: string
          topic_pattern?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          achievement_type: string
          certificate_data: Json | null
          created_at: string
          id: string
          interview_id: string | null
          issued_date: string
          score: number
          topic: string
          user_id: string
        }
        Insert: {
          achievement_type: string
          certificate_data?: Json | null
          created_at?: string
          id?: string
          interview_id?: string | null
          issued_date?: string
          score: number
          topic: string
          user_id: string
        }
        Update: {
          achievement_type?: string
          certificate_data?: Json | null
          created_at?: string
          id?: string
          interview_id?: string | null
          issued_date?: string
          score?: number
          topic?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_analytics: {
        Row: {
          average_score: number | null
          category: Database["public"]["Enums"]["question_category"] | null
          completed_at: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"] | null
          id: string
          interview_id: string
          session_data: Json | null
          time_spent_seconds: number | null
          total_answers: number | null
          total_questions: number | null
          user_id: string
        }
        Insert: {
          average_score?: number | null
          category?: Database["public"]["Enums"]["question_category"] | null
          completed_at?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          id?: string
          interview_id: string
          session_data?: Json | null
          time_spent_seconds?: number | null
          total_answers?: number | null
          total_questions?: number | null
          user_id: string
        }
        Update: {
          average_score?: number | null
          category?: Database["public"]["Enums"]["question_category"] | null
          completed_at?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          id?: string
          interview_id?: string
          session_data?: Json | null
          time_spent_seconds?: number | null
          total_answers?: number | null
          total_questions?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_analytics_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_answers: {
        Row: {
          ai_feedback: string | null
          answer_text: string
          clarity_score: number | null
          confidence_score: number | null
          created_at: string | null
          grammar_score: number | null
          id: string
          interview_id: string
          overall_score: number | null
          question_id: string | null
          question_text: string
          tone_score: number | null
          transcription: string | null
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          answer_text: string
          clarity_score?: number | null
          confidence_score?: number | null
          created_at?: string | null
          grammar_score?: number | null
          id?: string
          interview_id: string
          overall_score?: number | null
          question_id?: string | null
          question_text: string
          tone_score?: number | null
          transcription?: string | null
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          answer_text?: string
          clarity_score?: number | null
          confidence_score?: number | null
          created_at?: string | null
          grammar_score?: number | null
          id?: string
          interview_id?: string
          overall_score?: number | null
          question_id?: string | null
          question_text?: string
          tone_score?: number | null
          transcription?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_answers_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          interview_id: string
          role: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          interview_id: string
          role: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          interview_id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_messages_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_participants: {
        Row: {
          created_at: string | null
          id: string
          interview_id: string
          joined_at: string | null
          left_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interview_id: string
          joined_at?: string | null
          left_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interview_id?: string
          joined_at?: string | null
          left_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_participants_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_participants_realtime: {
        Row: {
          created_at: string | null
          id: string
          interview_id: string
          is_active: boolean | null
          last_seen: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interview_id: string
          is_active?: boolean | null
          last_seen?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interview_id?: string
          is_active?: boolean | null
          last_seen?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_participants_realtime_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_ratings: {
        Row: {
          ai_performance_score: number | null
          areas_to_improve: string[] | null
          created_at: string | null
          detailed_analysis: string | null
          feedback: string | null
          id: string
          interview_id: string
          key_concepts: string[] | null
          progress_notes: string | null
          rating: number
          strengths: string[] | null
          user_id: string
        }
        Insert: {
          ai_performance_score?: number | null
          areas_to_improve?: string[] | null
          created_at?: string | null
          detailed_analysis?: string | null
          feedback?: string | null
          id?: string
          interview_id: string
          key_concepts?: string[] | null
          progress_notes?: string | null
          rating: number
          strengths?: string[] | null
          user_id: string
        }
        Update: {
          ai_performance_score?: number | null
          areas_to_improve?: string[] | null
          created_at?: string | null
          detailed_analysis?: string | null
          feedback?: string | null
          id?: string
          interview_id?: string
          key_concepts?: string[] | null
          progress_notes?: string | null
          rating?: number
          strengths?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_ratings_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          amount_paid: number | null
          created_at: string | null
          creator_id: string
          current_knowledge: string | null
          duration_minutes: number
          experience_level: string
          id: string
          issue: string | null
          joining_code: string | null
          learning_goals: string | null
          payment_reference: string | null
          payment_status: string | null
          preferred_style: string | null
          room_id: string | null
          scheduled_time: string | null
          specific_challenges: string | null
          status: string
          title: string
          topic: string
          type: string
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string | null
          creator_id: string
          current_knowledge?: string | null
          duration_minutes?: number
          experience_level: string
          id?: string
          issue?: string | null
          joining_code?: string | null
          learning_goals?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          preferred_style?: string | null
          room_id?: string | null
          scheduled_time?: string | null
          specific_challenges?: string | null
          status?: string
          title: string
          topic: string
          type: string
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          created_at?: string | null
          creator_id?: string
          current_knowledge?: string | null
          duration_minutes?: number
          experience_level?: string
          id?: string
          issue?: string | null
          joining_code?: string | null
          learning_goals?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          preferred_style?: string | null
          room_id?: string | null
          scheduled_time?: string | null
          specific_challenges?: string | null
          status?: string
          title?: string
          topic?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      question_bank: {
        Row: {
          category: Database["public"]["Enums"]["question_category"]
          created_at: string | null
          created_by: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          expected_keywords: string[] | null
          id: string
          is_active: boolean | null
          language: Database["public"]["Enums"]["language_code"] | null
          question_text: string
        }
        Insert: {
          category: Database["public"]["Enums"]["question_category"]
          created_at?: string | null
          created_by?: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          expected_keywords?: string[] | null
          id?: string
          is_active?: boolean | null
          language?: Database["public"]["Enums"]["language_code"] | null
          question_text: string
        }
        Update: {
          category?: Database["public"]["Enums"]["question_category"]
          created_at?: string | null
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          expected_keywords?: string[] | null
          id?: string
          is_active?: boolean | null
          language?: Database["public"]["Enums"]["language_code"] | null
          question_text?: string
        }
        Relationships: []
      }
      recruiter_members: {
        Row: {
          id: string
          joined_at: string | null
          organization_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          organization_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          organization_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "recruiter_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiter_organizations: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          website: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          website?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          website?: string | null
        }
        Relationships: []
      }
      user_collection_certificates: {
        Row: {
          avg_score: number
          certificate_ids: string[]
          collection_id: string
          created_at: string
          earned_date: string
          id: string
          user_id: string
        }
        Insert: {
          avg_score: number
          certificate_ids: string[]
          collection_id: string
          created_at?: string
          earned_date?: string
          id?: string
          user_id: string
        }
        Update: {
          avg_score?: number
          certificate_ids?: string[]
          collection_id?: string
          created_at?: string
          earned_date?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_collection_certificates_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "certificate_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          preferred_language:
            | Database["public"]["Enums"]["language_code"]
            | null
          stt_enabled: boolean | null
          theme: string | null
          tts_enabled: boolean | null
          ui_language: Database["public"]["Enums"]["language_code"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          preferred_language?:
            | Database["public"]["Enums"]["language_code"]
            | null
          stt_enabled?: boolean | null
          theme?: string | null
          tts_enabled?: boolean | null
          ui_language?: Database["public"]["Enums"]["language_code"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          preferred_language?:
            | Database["public"]["Enums"]["language_code"]
            | null
          stt_enabled?: boolean | null
          theme?: string | null
          tts_enabled?: boolean | null
          ui_language?: Database["public"]["Enums"]["language_code"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_resumes: {
        Row: {
          ai_analysis: Json | null
          clarity_rating: number | null
          created_at: string | null
          id: string
          improved_text: string | null
          original_text: string
          relevance_rating: number | null
          structure_rating: number | null
          suggested_roles: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          clarity_rating?: number | null
          created_at?: string | null
          id?: string
          improved_text?: string | null
          original_text: string
          relevance_rating?: number | null
          structure_rating?: number | null
          suggested_roles?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          clarity_rating?: number | null
          created_at?: string | null
          id?: string
          improved_text?: string | null
          original_text?: string
          relevance_rating?: number | null
          structure_rating?: number | null
          suggested_roles?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_joining_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_interview_creator: {
        Args: { _interview_id: string; _user_id: string }
        Returns: boolean
      }
      is_interview_participant: {
        Args: { _interview_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      difficulty_level: "beginner" | "intermediate" | "expert"
      language_code: "en" | "fr" | "ar" | "hi" | "es" | "pt" | "de" | "zh"
      question_category:
        | "medical"
        | "law"
        | "finance"
        | "tech"
        | "business"
        | "education"
        | "engineering"
        | "sales"
        | "marketing"
        | "other"
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
      app_role: ["admin", "user"],
      difficulty_level: ["beginner", "intermediate", "expert"],
      language_code: ["en", "fr", "ar", "hi", "es", "pt", "de", "zh"],
      question_category: [
        "medical",
        "law",
        "finance",
        "tech",
        "business",
        "education",
        "engineering",
        "sales",
        "marketing",
        "other",
      ],
    },
  },
} as const
