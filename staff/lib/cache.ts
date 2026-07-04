// Global memory cache for SWR implementation
export const globalCache = {
    grievanceList: null as any[] | null,
    grievances: {} as Record<string, any>, // Detail cache by ID
    isWarmedUp: false,
};
