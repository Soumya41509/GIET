import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useCallback, useRef } from 'react';
import { NexaState, MessagePayload } from './types';
import { fetchChatSessions, fetchChatMessagesForSession, saveChatMessage, createChatSession } from './chatHistoryService';

const STORAGE_KEY = '@nexa_chat_state';
const LAST_SYNCED_ID_KEY = '@nexa_last_synced_id_v2';

export const useNexaPersistence = (state: NexaState, dispatch: any, userId?: string, forceNewSession?: boolean) => {
  const lastSyncedId = useRef<string | null>(null);
  const isInitialLoad = useRef(true);
  const forceNewTriggered = useRef(false);

  // 1. Initial Load (Fetch Most Recent Session or Force New)
  useEffect(() => {
    if (!userId || !isInitialLoad.current) return;

    const initSession = async () => {
      try {
        if (forceNewSession && !forceNewTriggered.current) {
          const newId = await createChatSession(userId, `New Chat ${new Date().toLocaleDateString()}`);
          if (newId) {
            dispatch({
              type: 'SET_INITIAL_STATE',
              payload: {
                ...state,
                sessionId: newId,
                messages: [],
                wizardData: {},
                context: { sessionStarted: new Date() }
              }
            });
            forceNewTriggered.current = true;
          }
          isInitialLoad.current = false;
          return;
        }

        // Standard Load logic...
        const sessions = await fetchChatSessions(userId);

        if (sessions.length > 0) {
          // B. Get Most Recent Session
          const latest = sessions[0];
          const cloudMessages = await fetchChatMessagesForSession(latest.id);

          dispatch({
            type: 'SET_INITIAL_STATE',
            payload: {
              ...state,
              sessionId: latest.id,
              sessionTitle: latest.title,
              messages: cloudMessages,
              isTyping: false,
              wizardData: {}, // Always clear wizard on fresh load for safety
              context: { sessionStarted: new Date() }
            }
          });

          if (cloudMessages.length > 0) {
            lastSyncedId.current = cloudMessages[cloudMessages.length - 1].id;
          }
        } else {
          // C. Create First Session if none exists
          const newId = await createChatSession(userId, 'Welcome Chat');
          if (newId) {
            dispatch({ type: 'UPDATE_CONTEXT', payload: { sessionStarted: new Date() } });
            // We'll update the state with the new session ID in the next sync cycle or set it now
            dispatch({ type: 'SET_INITIAL_STATE', payload: { ...state, sessionId: newId, messages: [] } });
          }
        }

        isInitialLoad.current = false;
      } catch (err) {
        console.error('NEXA Persistence: Load error', err);
        isInitialLoad.current = false;
      }
    };

    initSession();
  }, [userId, forceNewSession]);

  const prevSessionId = useRef<string | null>(null);

  // 2. Synchronize to Cloud
  useEffect(() => {
    if (!userId || isInitialLoad.current || !state.sessionId) return;

    // Reset sync pointer if session ID changed
    if (prevSessionId.current !== state.sessionId) {
      if (state.messages.length > 0) {
        lastSyncedId.current = state.messages[state.messages.length - 1].id;
      } else {
        lastSyncedId.current = null;
      }
      prevSessionId.current = state.sessionId;
    }

    const syncState = async () => {
      try {
        // A. Cloud Sync (Incremental per session)
        const unsyncedMessages = [];
        let foundLastSynced = !lastSyncedId.current;

        for (const msg of state.messages) {
          if (foundLastSynced) {
            unsyncedMessages.push(msg);
          } else if (msg.id === lastSyncedId.current) {
            foundLastSynced = true;
          }
        }

        if (unsyncedMessages.length > 0) {
          for (const msg of unsyncedMessages) {
            try {
              await saveChatMessage(msg, userId, state.sessionId);
              lastSyncedId.current = msg.id;
              await AsyncStorage.setItem(LAST_SYNCED_ID_KEY, lastSyncedId.current!);
            } catch (err) {
              // Stop syncing if one fails (keep it for retry on next trigger)
              console.warn('NEXA Persistence: Sync paused due to error, will retry...', err);
              break;
            }
          }
        }

        // B. Update local backup for transient data
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (err) {
        console.error('NEXA Persistence: Sync error', err);
      }
    };

    syncState();
  }, [state.messages, state.sessionId, userId]);

  const clearPersistence = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(LAST_SYNCED_ID_KEY);
      lastSyncedId.current = null;
    } catch (err) {
      console.error('NEXA Persistence: Clear error', err);
    }
  }, []);

  return { clearPersistence };
};
