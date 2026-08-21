// Kiểu dữ liệu DB tối giản cho Supabase (2 bảng chat), viết tay thay cho
// `supabase gen types`. Nếu sau này thêm bảng, có thể generate lại bằng:
//   npx supabase gen types typescript --project-id <ref> > lib/database.types.ts
export type Database = {
  public: {
    Tables: {
      conversations: {
        Row: { id: string; channel: string; started_at: string };
        Insert: { id?: string; channel?: string; started_at?: string };
        Update: { id?: string; channel?: string; started_at?: string };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          from: "bot" | "user";
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          from: "bot" | "user";
          text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          from?: "bot" | "user";
          text?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
