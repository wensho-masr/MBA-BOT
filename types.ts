
export interface Message {
  role: 'user' | 'model';
  parts: MessagePart[];
  groundingMetadata?: any;
}

export type MessagePart = 
  | { text: string }
  | { inlineData: { data: string; mimeType: string } };

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

export interface UIState {
  isLoading: boolean;
  isThinking: boolean;
  useSearch: boolean;
  useMaps: boolean;
  selectedModel: string;
  expertRole: string;
}
