import type { TabularData } from "./dataset";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  data?: TabularData;
  timestamp: Date;
  isLoading?: boolean;
  error?: string;
}
