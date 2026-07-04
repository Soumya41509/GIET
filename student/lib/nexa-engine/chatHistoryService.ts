import { supabase } from '../supabase';
import { MessagePayload } from './types';

export interface ChatSession {
  id: string;
  title: string;
  last_message: string;
  updated_at: string;
  created_at: string;
}

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const fetchChatSessions = async (userId: string): Promise<ChatSession[]> => {
  try {
    const { data, error } = await supabase
      .from('nexa_chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('NEXA Persistence: Failed to fetch sessions', err);
    return [];
  }
};

export const createChatSession = async (userId: string, title: string = 'New Conversation'): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('nexa_chat_sessions')
      .insert({ id: generateUUID(), user_id: userId, title })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (err) {
    console.error('NEXA Persistence: Failed to create session', err);
    return null;
  }
};

export const updateSessionMetadata = async (sessionId: string, title?: string, lastMessage?: string) => {
  try {
    const update: any = { updated_at: new Date().toISOString() };
    if (title) update.title = title;
    if (lastMessage) update.last_message = lastMessage;

    const { error } = await supabase
      .from('nexa_chat_sessions')
      .update(update)
      .eq('id', sessionId);

    if (error) throw error;
  } catch (err) {
    console.warn('NEXA Persistence: Soft failure updating session metadata', err);
  }
};

export const saveChatMessage = async (
  message: MessagePayload,
  userId: string,
  sessionId?: string
) => {
  try {
    // 1. Save the message
    const { error } = await supabase
      .from('nexa_chat_messages')
      .upsert({
        id: message.id,
        user_id: userId,
        session_id: sessionId,
        content: message.content,
        type: message.type,
        data: {
          contentType: message.contentType,
          data: message.data,
          action: message.action
        },
        created_at: message.timestamp.toISOString()
      });

    if (error) throw error;

    // 2. Update session last_message and timestamp
    if (sessionId) {
      await updateSessionMetadata(sessionId, undefined, message.content);
    }
  } catch (err) {
    console.error('NEXA Persistence: Failed to save message', err);
    throw err; // Rethrow so caller knows we failed
  }
};

export const fetchChatMessagesForSession = async (sessionId: string): Promise<MessagePayload[]> => {
  try {
    const { data, error } = await supabase
      .from('nexa_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    return data.map(row => ({
      id: row.id,
      type: row.type as 'user' | 'bot',
      content: row.content,
      contentType: row.data?.contentType || 'text',
      data: row.data?.data,
      action: row.data?.action,
      timestamp: new Date(row.created_at)
    }));
  } catch (err) {
    console.error('NEXA Persistence: Failed to fetch session messages', err);
    return [];
  }
};

/** @deprecated Use fetchChatMessagesForSession */
export const fetchChatHistory = async (userId: string, limit: number = 50): Promise<MessagePayload[]> => {
  try {
    const { data, error } = await supabase
      .from('nexa_chat_messages')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!data) return [];

    return data.reverse().map(row => ({
      id: row.id,
      type: row.type as 'user' | 'bot',
      content: row.content,
      contentType: row.data?.contentType || 'text',
      data: row.data?.data,
      action: row.data?.action,
      timestamp: new Date(row.created_at)
    }));
  } catch (err) {
    console.error('NEXA Persistence: Failed to fetch history', err);
    return [];
  }
};
export const deleteChatSession = async (sessionId: string) => {
  try {
    const { error } = await supabase
      .from('nexa_chat_sessions')
      .update({ is_archived: true })
      .eq('id', sessionId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('NEXA Persistence: Failed to delete session', err);
    return false;
  }
};
