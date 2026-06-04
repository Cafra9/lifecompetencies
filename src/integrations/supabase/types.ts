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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assessments: {
        Row: {
          created_at: string
          created_by: string
          data: string
          evidence_url: string | null
          id: string
          nivel: Database["public"]["Enums"]["assessment_level"]
          observacao: string | null
          skill_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          data?: string
          evidence_url?: string | null
          id?: string
          nivel: Database["public"]["Enums"]["assessment_level"]
          observacao?: string | null
          skill_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          data?: string
          evidence_url?: string | null
          id?: string
          nivel?: Database["public"]["Enums"]["assessment_level"]
          observacao?: string | null
          skill_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: string
          titulo: string
        }
        Insert: {
          created_at?: string
          data_fim: string
          data_inicio: string
          descricao?: string | null
          id?: string
          titulo: string
        }
        Update: {
          created_at?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          titulo?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          created_at: string
          id: string
          nome: string
          professor_id: string
          segmento: Database["public"]["Enums"]["school_segment"]
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          professor_id: string
          segmento: Database["public"]["Enums"]["school_segment"]
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          professor_id?: string
          segmento?: Database["public"]["Enums"]["school_segment"]
        }
        Relationships: []
      }
      competencies: {
        Row: {
          cor: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          ordem: number
          slug: string
        }
        Insert: {
          cor: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
          slug: string
        }
        Update: {
          cor?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
          slug?: string
        }
        Relationships: []
      }
      course_modules: {
        Row: {
          conteudo: string | null
          course_id: string
          created_at: string
          id: string
          ordem: number
          titulo: string
        }
        Insert: {
          conteudo?: string | null
          course_id: string
          created_at?: string
          id?: string
          ordem?: number
          titulo: string
        }
        Update: {
          conteudo?: string | null
          course_id?: string
          created_at?: string
          id?: string
          ordem?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_progress: {
        Row: {
          concluido: boolean
          concluido_em: string | null
          id: string
          module_id: string
          user_id: string
        }
        Insert: {
          concluido?: boolean
          concluido_em?: string | null
          id?: string
          module_id: string
          user_id: string
        }
        Update: {
          concluido?: boolean
          concluido_em?: string | null
          id?: string
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          competency_id: string
          created_at: string
          descricao: string | null
          id: string
          titulo: string
        }
        Insert: {
          competency_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          titulo: string
        }
        Update: {
          competency_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plan_comments: {
        Row: {
          comentario: string
          created_at: string
          id: string
          lesson_plan_id: string
          user_id: string
        }
        Insert: {
          comentario: string
          created_at?: string
          id?: string
          lesson_plan_id: string
          user_id: string
        }
        Update: {
          comentario?: string
          created_at?: string
          id?: string
          lesson_plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plan_comments_lesson_plan_id_fkey"
            columns: ["lesson_plan_id"]
            isOneToOne: false
            referencedRelation: "lesson_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plan_favorites: {
        Row: {
          created_at: string
          lesson_plan_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          lesson_plan_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          lesson_plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plan_favorites_lesson_plan_id_fkey"
            columns: ["lesson_plan_id"]
            isOneToOne: false
            referencedRelation: "lesson_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plans: {
        Row: {
          arquivo_url: string | null
          author_id: string
          competency_id: string | null
          created_at: string
          descricao: string | null
          disciplina: string | null
          evidencias: string | null
          id: string
          materiais: string | null
          objetivos: string | null
          publicado: boolean
          serie: string | null
          skill_id: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          arquivo_url?: string | null
          author_id: string
          competency_id?: string | null
          created_at?: string
          descricao?: string | null
          disciplina?: string | null
          evidencias?: string | null
          id?: string
          materiais?: string | null
          objetivos?: string | null
          publicado?: boolean
          serie?: string | null
          skill_id?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          arquivo_url?: string | null
          author_id?: string
          competency_id?: string | null
          created_at?: string
          descricao?: string | null
          disciplina?: string | null
          evidencias?: string | null
          id?: string
          materiais?: string | null
          objetivos?: string | null
          publicado?: boolean
          serie?: string | null
          skill_id?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plans_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          disciplina: string | null
          email: string
          id: string
          nome: string
          segmento: Database["public"]["Enums"]["school_segment"] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          disciplina?: string | null
          email: string
          id: string
          nome: string
          segmento?: Database["public"]["Enums"]["school_segment"] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          disciplina?: string | null
          email?: string
          id?: string
          nome?: string
          segmento?: Database["public"]["Enums"]["school_segment"] | null
          updated_at?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          arquivo_url: string | null
          competency_id: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          disciplina: string | null
          id: string
          link_externo: string | null
          segmento: Database["public"]["Enums"]["school_segment"] | null
          skill_id: string | null
          tipo: Database["public"]["Enums"]["resource_type"]
          titulo: string
        }
        Insert: {
          arquivo_url?: string | null
          competency_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          disciplina?: string | null
          id?: string
          link_externo?: string | null
          segmento?: Database["public"]["Enums"]["school_segment"] | null
          skill_id?: string | null
          tipo: Database["public"]["Enums"]["resource_type"]
          titulo: string
        }
        Update: {
          arquivo_url?: string | null
          competency_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          disciplina?: string | null
          id?: string
          link_externo?: string | null
          segmento?: Database["public"]["Enums"]["school_segment"] | null
          skill_id?: string | null
          tipo?: Database["public"]["Enums"]["resource_type"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          competency_id: string
          created_at: string
          descricao: string | null
          id: string
          indicadores: Json
          nome: string
          ordem: number
        }
        Insert: {
          competency_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          indicadores?: Json
          nome: string
          ordem?: number
        }
        Update: {
          competency_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          indicadores?: Json
          nome?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "skills_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
        ]
      }
      student_assessment_meta: {
        Row: {
          aluno_id: string
          created_at: string
          fechado: boolean
          fechado_em: string | null
          id: string
          observacao: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          fechado?: boolean
          fechado_em?: string | null
          id?: string
          observacao?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          fechado?: boolean
          fechado_em?: string | null
          id?: string
          observacao?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_assessments: {
        Row: {
          aluno_id: string
          competencia: string
          created_at: string
          habilidade: string
          id: string
          nivel: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aluno_id: string
          competencia: string
          created_at?: string
          habilidade: string
          id?: string
          nivel: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aluno_id?: string
          competencia?: string
          created_at?: string
          habilidade?: string
          id?: string
          nivel?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          class_id: string
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "professor" | "coordenador" | "admin" | "diretora"
      assessment_level:
        | "inicial"
        | "em_desenvolvimento"
        | "proficiente"
        | "avancado"
      resource_type:
        | "artigo"
        | "video"
        | "podcast"
        | "infografico"
        | "guia"
        | "externo"
      school_segment: "infantil" | "fundamental_1" | "fundamental_2" | "medio"
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
      app_role: ["professor", "coordenador", "admin", "diretora"],
      assessment_level: [
        "inicial",
        "em_desenvolvimento",
        "proficiente",
        "avancado",
      ],
      resource_type: [
        "artigo",
        "video",
        "podcast",
        "infografico",
        "guia",
        "externo",
      ],
      school_segment: ["infantil", "fundamental_1", "fundamental_2", "medio"],
    },
  },
} as const
