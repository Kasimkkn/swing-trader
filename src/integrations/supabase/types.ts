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
      companies: {
        Row: {
          company_name: string
          created_at: string
          exchange: string | null
          id: string
          market_cap: number | null
          sector: string | null
          symbol: string
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          exchange?: string | null
          id?: string
          market_cap?: number | null
          sector?: string | null
          symbol: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          exchange?: string | null
          id?: string
          market_cap?: number | null
          sector?: string | null
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      stock_analysis: {
        Row: {
          analysis_date: string
          confidence: number
          created_at: string
          current_price: number
          entry_price: number | null
          expires_at: string
          id: string
          reasons: string[]
          risk_reward: string | null
          signal: string
          stop_loss: number | null
          symbol: string
          target_price: number | null
          updated_at: string
        }
        Insert: {
          analysis_date?: string
          confidence: number
          created_at?: string
          current_price: number
          entry_price?: number | null
          expires_at?: string
          id?: string
          reasons?: string[]
          risk_reward?: string | null
          signal: string
          stop_loss?: number | null
          symbol: string
          target_price?: number | null
          updated_at?: string
        }
        Update: {
          analysis_date?: string
          confidence?: number
          created_at?: string
          current_price?: number
          entry_price?: number | null
          expires_at?: string
          id?: string
          reasons?: string[]
          risk_reward?: string | null
          signal?: string
          stop_loss?: number | null
          symbol?: string
          target_price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      stock_prices: {
        Row: {
          adjusted_close: number | null
          close_price: number
          created_at: string
          date: string
          high_price: number
          id: string
          low_price: number
          open_price: number
          symbol: string
          volume: number
        }
        Insert: {
          adjusted_close?: number | null
          close_price: number
          created_at?: string
          date: string
          high_price: number
          id?: string
          low_price: number
          open_price: number
          symbol: string
          volume: number
        }
        Update: {
          adjusted_close?: number | null
          close_price?: number
          created_at?: string
          date?: string
          high_price?: number
          id?: string
          low_price?: number
          open_price?: number
          symbol?: string
          volume?: number
        }
        Relationships: []
      }
      technical_indicators: {
        Row: {
          atr_14: number | null
          bollinger_lower: number | null
          bollinger_middle: number | null
          bollinger_upper: number | null
          created_at: string
          date: string
          id: string
          ma_200: number | null
          ma_50: number | null
          macd_histogram: number | null
          macd_line: number | null
          macd_signal: number | null
          rsi_14: number | null
          symbol: string
          volume_sma_20: number | null
        }
        Insert: {
          atr_14?: number | null
          bollinger_lower?: number | null
          bollinger_middle?: number | null
          bollinger_upper?: number | null
          created_at?: string
          date: string
          id?: string
          ma_200?: number | null
          ma_50?: number | null
          macd_histogram?: number | null
          macd_line?: number | null
          macd_signal?: number | null
          rsi_14?: number | null
          symbol: string
          volume_sma_20?: number | null
        }
        Update: {
          atr_14?: number | null
          bollinger_lower?: number | null
          bollinger_middle?: number | null
          bollinger_upper?: number | null
          created_at?: string
          date?: string
          id?: string
          ma_200?: number | null
          ma_50?: number | null
          macd_histogram?: number | null
          macd_line?: number | null
          macd_signal?: number | null
          rsi_14?: number | null
          symbol?: string
          volume_sma_20?: number | null
        }
        Relationships: []
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
