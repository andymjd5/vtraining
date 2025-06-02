import { create } from 'zustand';
import { analyticsService } from '../services/analyticsService'; // adapte le chemin si besoin

interface AnalyticsState {
  companyStats: Record<string, any>;
  courseAnalytics: Record<string, any>;
  recentActivity: any[];
  isLoading: boolean;
  error: string | null;
  fetchCompanyStats: (companyId?: string) => Promise<void>;
  fetchCourseAnalytics: (courseId: string) => Promise<void>;
  fetchRecentActivity: (companyId?: string) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  companyStats: {},
  courseAnalytics: {},
  recentActivity: [],
  isLoading: false,
  error: null,

  fetchCompanyStats: async (companyId?: string) => {
    try {
      set({ isLoading: true, error: null });
      const stats = await analyticsService.getCompanyStats(companyId);
      set({ companyStats: stats, isLoading: false });
    } catch (error: any) {
      console.error('Erreur fetchCompanyStats:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  fetchCourseAnalytics: async (courseId: string) => {
    try {
      set({ isLoading: true, error: null });
      const analytics = await analyticsService.getCourseAnalytics(courseId);
      set({ courseAnalytics: analytics, isLoading: false });
    } catch (error: any) {
      console.error('Erreur fetchCourseAnalytics:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  fetchRecentActivity: async (companyId?: string) => {
    try {
      set({ isLoading: true, error: null });
      const logs = await analyticsService.getActivityLogs(companyId);
      set({ recentActivity: logs, isLoading: false });
    } catch (error: any) {
      console.error('Erreur fetchRecentActivity:', error);
      set({ error: error.message, isLoading: false });
    }
  }
}));
