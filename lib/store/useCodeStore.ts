import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface GeneratedFile {
  path: string;
  content: string;
}

interface CodeStore {
  codes: Record<string, GeneratedFile[]>;
  setCode: (projectId: string, files: GeneratedFile[]) => void;
  getCode: (projectId: string) => GeneratedFile[] | null;
  clearCode: (projectId: string) => void;
}

export const useCodeStore = create<CodeStore>()(
  persist(
    (set, get) => ({
      codes: {},
      setCode: (projectId, files) =>
        set((state) => ({
          codes: {
            ...state.codes,
            [projectId]: files,
          },
        })),
      getCode: (projectId) => {
        const state = get();
        return state.codes[projectId] || null;
      },
      clearCode: (projectId) =>
        set((state) => {
          const newCodes = { ...state.codes };
          delete newCodes[projectId];
          return { codes: newCodes };
        }),
    }),
    {
      name: 'buildflow-code-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
