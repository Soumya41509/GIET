export enum NexaModule {
  MAIN = 'MAIN',
  FILING = 'FILING',
  TRACKING = 'TRACKING',
  ESCALATION = 'ESCALATION',
  SUPPORT = 'SUPPORT'
}

export type Intent = 'FILE' | 'TRACK' | 'HELP' | 'CANCEL' | 'NONE';

export interface MessageAction {
  label: string;
  type: 'navigate';
  screen: string;
  params?: Record<string, any>;
}

export interface MessagePayload {
  id: string;
  type: 'user' | 'bot';
  content: string;
  contentType?: 'text' | 'card' | 'options';
  data?: any;
  action?: MessageAction;
  timestamp: Date;
}

export interface StepConfig {
  id: string;
  prompt: string;
  field?: string; // The field in wizardData being populated
  validation?: {
    required?: boolean;
    minWords?: number;
    options?: string[];
  };
  options?: string[];
  next?: string | ((value: any, wizard: any) => string);
}

export interface ConversationContext {
  lastIntent?: Intent;
  lastGrievanceId?: string;
  userName?: string;
  sessionStarted: Date;
}

export interface NexaState {
  currentModule: NexaModule;
  currentStepId: string;
  messages: MessagePayload[];
  wizardData: Record<string, any>;
  context: ConversationContext;
  isTyping: boolean;
  sessionId?: string; // Current cloud session ID
  sessionTitle?: string;
  categories: any[]; // Store dynamic categories for the engine
}

export type NexaAction =
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'ADD_MESSAGE'; payload: MessagePayload }
  | { type: 'SWITCH_MODULE'; payload: { module: NexaModule; stepId: string; resetWizard?: boolean } }
  | { type: 'UPDATE_WIZARD'; payload: Record<string, any> }
  | { type: 'UPDATE_CONTEXT'; payload: Partial<ConversationContext> }
  | { type: 'RESET_FLOW' }
  | { type: 'SET_INITIAL_STATE'; payload: NexaState }
  | { type: 'SWITCH_SESSION'; payload: { sessionId: string; messages: MessagePayload[]; title?: string } }
  | { type: 'START_NEW_SESSION'; payload: { sessionId: string } }
  | { type: 'SET_CATEGORIES'; payload: any[] };
