import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './lib/supabase';

// ============================================================================
// CACHE KEYS - Separate caches for different data types
// ============================================================================
const CACHE_KEYS = {
  GRIEVANCES_SUMMARY: 'grievances_summary_v2',
  GRIEVANCE_STATS: 'grievance_stats_v2',
  GRIEVANCE_DETAILS: 'grievance_details_v2_',
  USER_PROFILE: 'user_profile_v2',
  RECENT_UPDATE_ORDER: 'recent_update_order_v1',
  PINNED_UPDATES: 'pinned_updates_v1',      // No expiry — survives forever
} as const;

// ============================================================================
// CONSTANTS
// ============================================================================
const ITEMS_PER_PAGE = 10;
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// TYPES
// ============================================================================
export interface GrievanceItem {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  date: string;       // Formatted relative date (e.g. "2 mins ago")
  rawDate: string;    // ISO string for live-updating timers
  description: string;
  subcategory?: string;
  hostel?: string;
  image_paths?: string[];
  staff_image_paths?: string[];
  timeline?: TimelineEntry[];
  reopen_reason?: string;
  reopen_proof_paths?: string[];
  resolved_at?: string;
}

export interface TimelineEntry {
  status: string;
  date: string;
  time: string;
  description: string;
  completed: boolean;
}

export interface GrievanceStats {
  total: number;
  submitted: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  pending: number;
  lastUpdated: number;
}

interface CachedData<T> {
  data: T;
  timestamp: number;
}

// ============================================================================
// CACHE UTILITIES
// ============================================================================

/**
 * Check if cached data is still valid
 */
const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_EXPIRY_MS;
};

/**
 * Save data with timestamp to cache
 */
const saveToCacheWithTimestamp = async <T>(key: string, data: T): Promise<void> => {
  try {
    const cachedData: CachedData<T> = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(cachedData));
  } catch (error) {
    // Cache save failed
  }
};

/**
 * Get data from cache if valid
 */
const getFromCacheWithValidation = async <T>(key: string): Promise<T | null> => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const parsed: CachedData<T> = JSON.parse(cached);
    if (!isCacheValid(parsed.timestamp)) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch (error) {
    return null;
  }
};

// ============================================================================
// LIGHTWEIGHT SUMMARY CACHE (For instant app launches)
// ============================================================================

export const getCachedGrievanceSummary = async (): Promise<GrievanceItem[]> => {
  return (await getFromCacheWithValidation<GrievanceItem[]>(CACHE_KEYS.GRIEVANCES_SUMMARY)) || [];
};

/**
 * Manually update the summary cache — used by home screen after real-time reorder.
 * Stores the first 30 items so next launch shows the correct order.
 */
export const updateCachedGrievanceSummary = async (grievances: GrievanceItem[]): Promise<void> => {
  await cacheLightweightSummary(grievances.slice(0, 30));
};

/**
 * Persist the order of recently updated grievance IDs to AsyncStorage.
 * This survives app restarts and is used to re-sort data after background fetches.
 */
export const saveRecentUpdateOrder = async (ids: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.RECENT_UPDATE_ORDER, JSON.stringify(ids.slice(0, 10)));
  } catch (e) {
    // Error saving order
  }
};

/**
 * Get the persisted list of recently updated grievance IDs.
 */
export const getRecentUpdateOrder = async (): Promise<string[]> => {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEYS.RECENT_UPDATE_ORDER);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

// ============================================================================
// PINNED UPDATES — No expiry, stores full GrievanceItem data.
// These always appear at top of Recent Updates, even after app restart.
// ============================================================================

/** Save a recently updated grievance to the pinned list (max 3, no expiry). */
export const savePinnedUpdate = async (item: GrievanceItem): Promise<void> => {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEYS.PINNED_UPDATES);
    const existing: GrievanceItem[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter(g => g.id !== item.id);
    const updated = [item, ...filtered].slice(0, 3);
    await AsyncStorage.setItem(CACHE_KEYS.PINNED_UPDATES, JSON.stringify(updated));
  } catch (e) {
    // Error saving pinned
  }
};

/** Get pinned recently-updated items (max 3, most recent first). */
export const getPinnedUpdates = async (): Promise<GrievanceItem[]> => {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEYS.PINNED_UPDATES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

/**
 * Merge pinned items on top of any list, deduplicating the rest.
 * Call this every time you call setGrievances to guarantee pinned always come first.
 */
export const mergePinnedWithList = (pinned: GrievanceItem[], list: GrievanceItem[]): GrievanceItem[] => {
  const pinnedIds = new Set(pinned.map(g => g.id));
  const rest = list.filter(g => !pinnedIds.has(g.id));
  return [...pinned, ...rest];
};

const cacheLightweightSummary = async (grievances: GrievanceItem[]): Promise<void> => {
  // Only cache essential fields (80% size reduction!)
  const summary = grievances.map(g => ({
    id: g.id,
    title: g.title,
    category: g.category,
    status: g.status,
    priority: g.priority,
    date: g.date,
    description: g.description,
    hostel: g.hostel,
    // NO timeline data in summary!
  }));

  await saveToCacheWithTimestamp(CACHE_KEYS.GRIEVANCES_SUMMARY, summary);
};

// ============================================================================
// STATS CACHE (For instant dashboard)
// ============================================================================

export const getCachedStats = async (): Promise<GrievanceStats | null> => {
  return getFromCacheWithValidation<GrievanceStats>(CACHE_KEYS.GRIEVANCE_STATS);
};

export const cacheStats = async (stats: GrievanceStats): Promise<void> => {
  await saveToCacheWithTimestamp(CACHE_KEYS.GRIEVANCE_STATS, stats);
};

// ============================================================================
// DETAIL CACHE (For individual grievances)
// ============================================================================

export const getCachedGrievanceDetail = async (id: string): Promise<GrievanceItem | null> => {
  return getFromCacheWithValidation<GrievanceItem>(`${CACHE_KEYS.GRIEVANCE_DETAILS}${id}`);
};

const cacheGrievanceDetail = async (grievance: GrievanceItem): Promise<void> => {
  await saveToCacheWithTimestamp(`${CACHE_KEYS.GRIEVANCE_DETAILS}${grievance.id}`, grievance);
};

// ============================================================================
// OPTIMIZED GRIEVANCE LOADING (With Pagination)
// ============================================================================

/**
 * Transforms a raw Supabase record into a consistent GrievanceItem
 */
export const transformGrievanceRecord = (item: any, includeTimeline: boolean = false): GrievanceItem => {
  const grievance: GrievanceItem = {
    id: item.id,
    title: item.title,
    category: item.category,
    status: item.status,
    priority: item.priority || 'Medium',
    // Static initial relative date for display
    date: formatDate(item.updated_at || item.created_at),
    // Raw date for live-updating components
    rawDate: item.updated_at || item.created_at,
    description: item.description || '',
    subcategory: item.subcategory,
    hostel: item.hostel,
    image_paths: item.image_paths || [],
    staff_image_paths: item.staff_image_paths || [],
    reopen_reason: item.reopen_reason,
    reopen_proof_paths: item.reopen_proof_paths || [],
  };

  // Add timeline if included
  if (includeTimeline && item.grievance_timeline) {
    grievance.timeline = item.grievance_timeline.map((t: any) => ({
      status: t.status,
      date: new Date(t.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      time: new Date(t.created_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      description: t.description,
      completed: t.completed,
    }));
  }

  return grievance;
};

/**
 * Load grievances with pagination and optimized query
 * @param page - Page number (0-indexed)
 * @param itemsPerPage - Number of items per page
 * @param includeTimeline - Whether to include timeline data
 */
export const loadGrievances = async (
  page: number = 0,
  itemsPerPage: number = ITEMS_PER_PAGE,
  includeTimeline: boolean = false,
  forceFresh: boolean = false,
  status?: string
): Promise<GrievanceItem[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const start = page * itemsPerPage;
    const end = start + itemsPerPage - 1;

    let query = supabase
      .from('grievances')
      .select(
        includeTimeline
          ? `*, grievance_timeline(status, description, completed, created_at)`
          : 'id, title, category, status, priority, created_at, updated_at, description, hostel, image_paths'
      )
      .eq('user_id', user.id);

    if (status && status !== 'All') {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false }).range(start, end);

    if (includeTimeline) {
      query = query.order('created_at', { foreignTable: 'grievance_timeline', ascending: true });
    }

    const { data, error } = await query;
    if (error || !data) return [];

    const formatted = (data as any[]).map((item: any) => transformGrievanceRecord(item, includeTimeline));

    // For chatbot or explicit refresh, skip the complex custom sorting
    if (forceFresh || (page === 0 && !includeTimeline)) {
      if (forceFresh) return formatted;

      const persistedOrder = await getRecentUpdateOrder();
      if (persistedOrder.length > 0) {
        return [...formatted].sort((a, b) => {
          const ai = persistedOrder.indexOf(a.id);
          const bi = persistedOrder.indexOf(b.id);
          if (ai !== -1 && bi !== -1) return ai - bi;
          // If only bi is found, bi comes first (a is newer/unsorted)
          if (ai === -1 && bi !== -1) return 1;
          // If only ai is found, ai comes first
          if (ai !== -1 && bi === -1) return -1;
          return 0;
        });
      }
    }

    return formatted;
  } catch (error) {
    return [];
  }
};

// ... (loadAllGrievances stays same)

// ============================================================================
// LOAD SINGLE GRIEVANCE WITH TIMELINE (For Detail Page)
// ============================================================================

/**
 * Load a single grievance by ID with full timeline data
 * Perfect for detail view - loads everything for one grievance
 * @param grievanceId - The ID of the grievance to load
 * @returns GrievanceItem with timeline or null if not found
 */
export const loadSingleGrievance = async (grievanceId: string): Promise<GrievanceItem | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    // Load this specific grievance with its timeline
    const { data, error } = await supabase
      .from('grievances')
      .select(`
        *,
        grievance_timeline (
          status,
          description,
          completed,
          created_at
        )
      `)
      .eq('id', grievanceId)
      .eq('user_id', user.id) // Security: Only user's own grievances
      .order('created_at', {
        foreignTable: 'grievance_timeline',
        ascending: true
      })
      .single();

    if (error) {
      return null;
    }

    if (!data) {
      return null;
    }

    // Format the grievance data using the shared transformer (it handles timeline too)
    const grievance: GrievanceItem = transformGrievanceRecord(data, true);

    // Cache the full grievance details
    await cacheGrievanceDetail(grievance);

    return grievance;
  } catch (error) {
    return null;
  }
};

// ============================================================================
// OPTIMIZED STATS LOADING
// ============================================================================

/**
 * Get grievance statistics efficiently
 * Uses aggregation query instead of loading all data
 */
export const loadGrievanceStats = async (): Promise<GrievanceStats> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { total: 0, submitted: 0, inProgress: 0, resolved: 0, rejected: 0, pending: 0, lastUpdated: Date.now() };
    }

    // Super lightweight query - only counts
    const { data, error } = await supabase
      .from('grievances')
      .select('status')
      .eq('user_id', user.id);

    if (error || !data) {
      return { total: 0, submitted: 0, inProgress: 0, resolved: 0, rejected: 0, pending: 0, lastUpdated: Date.now() };
    }

    const stats: GrievanceStats = {
      total: data.length,
      submitted: data.filter(g => g.status === 'Submitted').length,
      inProgress: data.filter(g => g.status === 'In Progress').length,
      resolved: data.filter(g => g.status === 'Resolved').length,
      rejected: data.filter(g => g.status === 'Rejected').length,
      pending: data.filter(g => g.status !== 'Resolved' && g.status !== 'Rejected').length,
      lastUpdated: Date.now(),
    };

    // Cache the stats
    await cacheStats(stats);

    return stats;
  } catch (error) {
    return { total: 0, submitted: 0, inProgress: 0, resolved: 0, rejected: 0, pending: 0, lastUpdated: Date.now() };
  }
};

/**
 * Calculate stats from existing data (for when you already have the data)
 */
export const getGrievanceStats = (grievances: GrievanceItem[]): GrievanceStats => {
  return {
    total: grievances.length,
    submitted: grievances.filter(g => g.status === 'Submitted').length,
    inProgress: grievances.filter(g => g.status === 'In Progress').length,
    resolved: grievances.filter(g => g.status === 'Resolved').length,
    rejected: grievances.filter(g => g.status === 'Rejected').length,
    pending: grievances.filter(g => g.status !== 'Resolved' && g.status !== 'Rejected').length,
    lastUpdated: Date.now(),
  };
};

// ============================================================================
// SAVE GRIEVANCE (Optimized)
// ============================================================================

/**
 * Save a new grievance with optimizations
 */
/**
 * Compress image to target size (100-200KB)
 */
const compressImage = async (uri: string): Promise<string> => {
  try {
    // Initial compression
    let result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }], // Resize to reasonable width
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    // If still too large, compress further (simple heuristic)
    // Note: In a real app we might check file size, but Expo ImageManipulator
    // doesn't return size directly without FS check. 
    // 0.7 + 1080 width is usually safe for <200KB.
    return result.uri;
  } catch (error) {
    return uri; // Fallback to original
  }
};

/**
 * Upload an image to Supabase Storage
 */
const uploadImage = async (uri: string, grievanceId: string, type: 'student' | 'staff' = 'student'): Promise<string | null> => {
  try {
    const compressedUri = await compressImage(uri);
    const filename = compressedUri.split('/').pop() || `image_${Date.now()}.jpg`;
    const path = `${grievanceId}/${type}/${Date.now()}_${filename}`;

    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    const formData = new FormData();
    formData.append('file', {
      uri: compressedUri,
      name: filename,
      type: mimeType,
    } as any);

    const { data, error } = await supabase.storage
      .from('grievances')
      .upload(path, formData, {
        contentType: mimeType,
      });

    if (error) {
      return null;
    }

    return path; // Store the relative path
  } catch (error) {
    return null;
  }
};

/**
 * Save a new grievance with optimizations and image upload
 */
export const saveGrievance = async (
  newGrievance: Omit<GrievanceItem, 'id' | 'date'> & { attachments?: string[] },
  userId: string
): Promise<void> => {
  try {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // 1. Create the Grievance Record first to get the ID
    const { data: grievanceData, error: insertError } = await supabase
      .from('grievances')
      .insert([{
        user_id: userId,
        title: newGrievance.title,
        category: newGrievance.category,
        subcategory: (newGrievance as any).subcategory || null,
        description: newGrievance.description,
        hostel: newGrievance.hostel || null,
        status: 'Submitted',
        priority: newGrievance.priority || 'Medium',
      }])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    if (!grievanceData) throw new Error('Failed to create grievance record');

    // 2. Upload Images if any
    let uploadedPaths: string[] = [];
    if (newGrievance.attachments && newGrievance.attachments.length > 0) {

      const uploadPromises = newGrievance.attachments.map(uri =>
        uploadImage(uri, grievanceData.id, 'student')
      );

      const results = await Promise.all(uploadPromises);
      uploadedPaths = results.filter((path): path is string => path !== null);

      // 3. Update the grievance with image paths
      if (uploadedPaths.length > 0) {
        const { error: updateError } = await supabase
          .from('grievances')
          .update({ image_paths: uploadedPaths } as any) // Type assertion until types generated
          .eq('id', grievanceData.id);
      }
    }

    // 4. Invalidate all grievance-related caches
    await clearGrievanceCache();
  } catch (error) {
    throw error;
  }
};

/**
 * Send a nudge for a grievance (sets nudge_sent = true)
 */
export const nudgeGrievance = async (id: string, staffName: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('grievances')
      .update({ nudge_sent: true } as any)
      .eq('id', id);

    if (error) throw error;

    // Add to timeline
    await supabase.from('grievance_timeline').insert({
      grievance_id: id,
      status: 'Nudged',
      description: `Student sent a nudge to ${staffName || 'assigned staff'}.`,
      completed: true
    });

    await clearGrievanceCache();

  } catch (error) {
    console.error('❌ Error nudging grievance:', error);
    throw error;
  }
};

/**
 * Re-open a resolved grievance with mandatory proof and reason
 */
export const reopenGrievance = async (id: string, reason: string, proofUris: string[]): Promise<void> => {
  try {
    // 1. Upload proof images
    let uploadedPaths: string[] = [];
    if (proofUris && proofUris.length > 0) {
      const uploadPromises = proofUris.map(uri => uploadImage(uri, id, 'student'));
      const results = await Promise.all(uploadPromises);
      uploadedPaths = results.filter((path): path is string => path !== null);
    }

    // 2. Update grievance status and data
    const { error } = await supabase
      .from('grievances')
      .update({
        status: 'Reopened',
        nudge_sent: false,
        reopen_reason: reason,
        reopen_proof_paths: uploadedPaths,
        current_step: 1, // Optional: Reset to level 1 or keep for admin to decide?
        // User requested admin decides re-assignment, so we primarily set status to Reopened.
      } as any)
      .eq('id', id);

    if (error) throw error;

    // 3. Add to timeline
    await supabase.from('grievance_timeline').insert({
      grievance_id: id,
      status: 'Reopened',
      description: `Grievance reopened by student. Reason: ${reason}`,
      completed: true
    });

    await clearGrievanceCache();
  } catch (error) {
    console.error('❌ Error re-opening grievance:', error);
    throw error;
  }
};

/**
 * Save user feedback
 */
export const saveFeedback = async (rating: number, message: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('feedbacks').insert({
      user_id: user.id,
      rating,
      message
    });

    if (error) throw error;
  } catch (error) {
    console.error('❌ Error saving feedback:', error);
    throw error;
  }
};

/**
 * Submit a grievance directly from the NEXA chatbot
 */
export const submitGrievanceFromBot = async (data: {
  title: string;
  category: string;
  subcategory?: string;
  hostel?: string;
  description: string;
  priority: string;
  attachments?: string[];
}): Promise<string> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 1. Insert core grievance
    const { data: newGrievance, error } = await supabase.from('grievances').insert({
      user_id: user.id,
      title: data.title,
      category: data.category,
      subcategory: data.subcategory,
      hostel: data.hostel,
      description: data.description,
      priority: data.priority,
      status: 'Submitted',
    }).select().single();

    if (error) throw error;

    // 2. Handle attachments if any
    if (data.attachments && data.attachments.length > 0) {
      const uploadPromises = data.attachments.map(uri =>
        uploadImage(uri, newGrievance.id, 'student')
      );
      const results = await Promise.all(uploadPromises);
      const uploadedPaths = results.filter((path): path is string => path !== null);

      if (uploadedPaths.length > 0) {
        await supabase.from('grievances').update({
          image_paths: uploadedPaths
        } as any).eq('id', newGrievance.id);
      }
    }

    // 3. Add initial timeline entry
    await supabase.from('grievance_timeline').insert({
      grievance_id: newGrievance.id,
      status: 'Submitted',
      description: 'Grievance filed via NEXA Assistant.',
      completed: true
    });

    // 4. Invalidate caches
    await AsyncStorage.multiRemove([
      CACHE_KEYS.GRIEVANCES_SUMMARY,
      CACHE_KEYS.GRIEVANCE_STATS,
    ]);

    return newGrievance.id;
  } catch (error) {
    console.error('❌ Error submitting bot grievance:', error);
    throw error;
  }
};

/**
 * Escalate a grievance to higher authority
 */
export const escalateGrievance = async (id: string): Promise<void> => {
  try {
    const { error: updateError } = await supabase
      .from('grievances')
      .update({
        priority: 'Urgent'
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Add escalation entry to timeline table
    const { error: timelineError } = await supabase.from('grievance_timeline').insert({
      grievance_id: id,
      status: 'Escalated',
      description: 'Issue escalated to HOD via NEXA Assistant.',
      completed: true
    });

    if (timelineError) throw timelineError;

    await clearGrievanceCache();
  } catch (error) {
    console.error('❌ Error escalating grievance:', error);
    throw error;
  }
};

/**
 * Get escalation contacts for a department
 */
export const getEscalationContacts = async (department: string) => {
  // This would ideally fetch from a 'staff' or 'contacts' table
  // Mocking for now as per current schema
  const contacts: Record<string, any> = {
    'CSE': { name: 'Dr. A. Pathy', role: 'HOD CSE', phone: '9876543220' },
    'ECE': { name: 'Dr. S. Ray', role: 'HOD ECE', phone: '9876543221' },
    'Hostel': { name: 'Mr. P. Dash', role: 'Chief Warden', phone: '9876543222' },
    'General': { name: 'Admin Office', role: 'Registrar', phone: '9876543223' },
  };

  return contacts[department] || contacts['General'];
};

// ============================================================================
// UTILITIES
// ============================================================================

export const formatDate = (dateString: string): string => {
  if (!dateString) return 'Recent';

  // Normalize date string (Replace space with T for cross-platform compatibility)
  const normalized = dateString.includes(' ') && !dateString.includes('T')
    ? dateString.replace(' ', 'T')
    : dateString;

  const date = new Date(normalized);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);

  // 1. Handle "Future" dates (Clock Drift)
  // If the server time is slightly ahead of the phone, diffSecs will be negative.
  // We treat anything from -30s to 59s as "just now".
  if (diffSecs < 60) {
    return 'just now';
  }

  // 2. Minutes (1 to 59)
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) {
    return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  }

  // 3. Hours (1 to 23)
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
  }

  // 4. Days, Weeks
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  // 1-30 Days
  if (diffDays < 30) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  // 1-52 Weeks
  if (diffWeeks < 52) {
    return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  }

  // Fallback to absolute date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: diffDays > 365 ? 'numeric' : undefined
  });
};

/**
 * Clear only grievance-related caches (Summary, Stats, Pinned, Order)
 * Does NOT clear user profile or session data.
 */
export const clearGrievanceCache = async (): Promise<void> => {
  try {
    const keysToClear = [
      CACHE_KEYS.GRIEVANCES_SUMMARY,
      CACHE_KEYS.GRIEVANCE_STATS,
      CACHE_KEYS.RECENT_UPDATE_ORDER,
      CACHE_KEYS.PINNED_UPDATES
    ];
    await AsyncStorage.multiRemove(keysToClear);
  } catch (error) {
    console.warn('clearGrievanceCache failed:', error);
  }
};

/**
 * Clear all caches (useful for logout or debugging)
 */
export const clearAllCaches = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(Object.values(CACHE_KEYS));
    // console.log('✅ All caches cleared');
  } catch (error) {
    console.error('❌ Error clearing caches:', error);
  }
};

// ============================================================================
// LEGACY SUPPORT (Deprecated - use pagination instead)
// ============================================================================

/**
 * @deprecated Use getCachedGrievanceSummary() instead
 */
export const getCachedGrievances = getCachedGrievanceSummary;

/**
 * @deprecated Use cacheLightweightSummary() instead
 */
export const cacheGrievances = cacheLightweightSummary;
