export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          logo: string | null
          contact_email: string
          contact_phone: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          logo?: string | null
          contact_email: string
          contact_phone?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo?: string | null
          contact_email?: string
          contact_phone?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'AGENT'
          company_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'AGENT'
          company_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'AGENT'
          company_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string | null
          content: string | null
          category: 'HUMAN_RIGHTS' | 'HUMANITARIAN_LAW' | 'TRANSITIONAL_JUSTICE' | 'PSYCHOLOGICAL_SUPPORT' | 'COMPUTER_SCIENCE' | 'ENGLISH'
          duration: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          content?: string | null
          category: 'HUMAN_RIGHTS' | 'HUMANITARIAN_LAW' | 'TRANSITIONAL_JUSTICE' | 'PSYCHOLOGICAL_SUPPORT' | 'COMPUTER_SCIENCE' | 'ENGLISH'
          duration: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          content?: string | null
          category?: 'HUMAN_RIGHTS' | 'HUMANITARIAN_LAW' | 'TRANSITIONAL_JUSTICE' | 'PSYCHOLOGICAL_SUPPORT' | 'COMPUTER_SCIENCE' | 'ENGLISH'
          duration?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          progress: number
          status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
          started_at: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          progress?: number
          status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
          started_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          progress?: number
          status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
          started_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          time_limit: number
          passing_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          time_limit: number
          passing_score: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          time_limit?: number
          passing_score?: number
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          quiz_id: string
          text: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          text: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          text?: string
          created_at?: string
          updated_at?: string
        }
      }
      options: {
        Row: {
          id: string
          question_id: string
          text: string
          is_correct: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question_id: string
          text: string
          is_correct: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          text?: string
          is_correct?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      certificates: {
        Row: {
          id: string
          user_id: string
          course_id: string
          quiz_id: string
          issue_date: string
          certificate_number: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          quiz_id: string
          issue_date?: string
          certificate_number: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          quiz_id?: string
          issue_date?: string
          certificate_number?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'AGENT'
      course_category: 'HUMAN_RIGHTS' | 'HUMANITARIAN_LAW' | 'TRANSITIONAL_JUSTICE' | 'PSYCHOLOGICAL_SUPPORT' | 'COMPUTER_SCIENCE' | 'ENGLISH'
      enrollment_status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
    }
  }
}