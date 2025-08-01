import { create } from 'zustand';

interface EditorState {
  // Course data
  courseData: any;
  originalData: any;
  
  // UI state
  activeTab: 'general' | 'chapters' | 'settings';
  selectedChapterId: string | null;
  selectedLessonId: string | null;
  
  // Edit state
  isDirty: boolean;
  isLoading: boolean;
  
  // Actions
  setCourseData: (data: any) => void;
  updateCourseData: (updates: any) => void;
  setActiveTab: (tab: 'general' | 'chapters' | 'settings') => void;
  selectChapter: (chapterId: string | null) => void;
  selectLesson: (lessonId: string | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  courseData: null,
  originalData: null,
  activeTab: 'general' as const,
  selectedChapterId: null,
  selectedLessonId: null,
  isDirty: false,
  isLoading: false,
};

export const useEditorStore = create<EditorState>((set, get) => ({
  ...initialState,
  
  setCourseData: (data) => set({
    courseData: data,
    originalData: JSON.parse(JSON.stringify(data)), // Deep clone
    isDirty: false,
  }),
  
  updateCourseData: (updates) => {
    const currentData = get().courseData;
    const newData = { ...currentData, ...updates };
    const originalData = get().originalData;
    
    const isDirtyCheck = JSON.stringify(newData) !== JSON.stringify(originalData);
    
    set({
      courseData: newData,
      isDirty: isDirtyCheck,
    });
  },
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  selectChapter: (chapterId) => set({ 
    selectedChapterId: chapterId,
    selectedLessonId: null, // Clear lesson selection when changing chapter
  }),
  
  selectLesson: (lessonId) => set({ selectedLessonId: lessonId }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  reset: () => set(initialState),
}));