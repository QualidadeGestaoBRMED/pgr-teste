import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type StepStatus = 'unvisited' | 'incomplete' | 'complete';

interface StepState {
  status: StepStatus;
  visited: boolean;
}

// Este é o estado para UM ÚNICO workflow de PGR
interface PGRWorkflowState {
  currentStep: number;
  stepStates: StepState[];
}

// Este é o estado inicial padrão para qualquer NOVO PGR
const initialWorkflowState: PGRWorkflowState = {
  currentStep: 0,
  stepStates: [
    { status: 'complete', visited: true },   // 0 - Início
    { status: 'unvisited', visited: false },  // 1 - Histórico
    { status: 'unvisited', visited: false },  // 2 - Dados
    { status: 'unvisited', visited: false },  // 3 - GHE
    { status: 'unvisited', visited: false },  // 4 - Caracterização
    { status: 'unvisited', visited: false },  // 5 - Medidas
    { status: 'unvisited', visited: false },  // 6 - Plano
    { status: 'unvisited', visited: false },  // 7 - Inclusão de Anexos 
    { status: 'complete', visited: true },  // 8 - Revisão
  ],
};

// O store principal agora armazena:
// 1. O ID do PGR que está ativo
// 2. Um objeto (Record) com os estados de todos os PGRs
interface PGRState {
  activePgrId: string | null;
  pgrStates: Record<string, PGRWorkflowState>;
}

interface PGRActions {
  // Ação para carregar um PGR (ou criar se não existir)
  loadPgr: (pgrId: string) => void;
  
  // Ações que agora operam no PGR *ativo*
  setCurrentStep: (index: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  visitStep: (index: number) => void;
  markStepAsComplete: (index: number) => void;
  
  // Ação para resetar um PGR específico
  resetPgrState: (pgrId: string) => void;
}

// Estado inicial do Store global
const initialState: PGRState = {
  activePgrId: null,
  pgrStates: {},
};

export const usePGRStore = create(
  persist<PGRState & PGRActions>(
    (set, get) => ({
      ...initialState,
      
      // Nova ação: define o PGR ativo e o inicializa se for novo
      loadPgr: (pgrId) => {
        const { pgrStates } = get();
        if (!pgrStates[pgrId]) {
          // Se este PGR não existe no estado, cria ele
          set((state) => ({
            activePgrId: pgrId,
            pgrStates: {
              ...state.pgrStates,
              [pgrId]: JSON.parse(JSON.stringify(initialWorkflowState)) // Cópia profunda
            }
          }));
        } else {
          // Se ele já existe, apenas define como ativo
          set({ activePgrId: pgrId });
        }
      },

      // Ação para resetar
      resetPgrState: (pgrId) => {
        set((state) => {
          const newPgrStates = { ...state.pgrStates };
          newPgrStates[pgrId] = JSON.parse(JSON.stringify(initialWorkflowState));
          return { pgrStates: newPgrStates };
        });
      },

      // --- Ações antigas, agora modificadas para usar o 'activePgrId' ---
      
      setCurrentStep: (index) => {
        const { activePgrId } = get();
        if (!activePgrId) return;

        set((state) => {
          const activeState = state.pgrStates[activePgrId];
          return {
            pgrStates: {
              ...state.pgrStates,
              [activePgrId]: { ...activeState, currentStep: index }
            }
          };
        });
      },

      nextStep: () => {
        const { activePgrId, pgrStates } = get();
        if (!activePgrId) return;
        
        const { currentStep, stepStates } = pgrStates[activePgrId];
        if (currentStep < stepStates.length - 1) {
          get().setCurrentStep(currentStep + 1); // Reutiliza a ação
        }
      },

      previousStep: () => {
        const { activePgrId, pgrStates } = get();
        if (!activePgrId) return;

        const { currentStep } = pgrStates[activePgrId];
        if (currentStep > 0) {
          get().setCurrentStep(currentStep - 1); // Reutiliza a ação
        }
      },

      visitStep: (index) => {
        const { activePgrId } = get();
        if (!activePgrId) return;

        set((state) => {
          const activeState = state.pgrStates[activePgrId];
          const oldStepState = activeState.stepStates[index];

          if (!oldStepState || oldStepState.status === 'complete' || oldStepState.visited) {
            return state; // Não faz nada se já completo ou visitado
          }

          const newStepStates = [...activeState.stepStates];
          newStepStates[index] = { ...newStepStates[index], visited: true, status: 'incomplete' };
          
          return {
            pgrStates: {
              ...state.pgrStates,
              [activePgrId]: { ...activeState, stepStates: newStepStates }
            }
          };
        });
      },

      markStepAsComplete: (index) => {
        const { activePgrId } = get();
        if (!activePgrId) return;
        
        set((state) => {
          const activeState = state.pgrStates[activePgrId];
          const newStepStates = [...activeState.stepStates];
          newStepStates[index] = { ...newStepStates[index], status: 'complete', visited: true };
          
          return {
            pgrStates: {
              ...state.pgrStates,
              [activePgrId]: { ...activeState, stepStates: newStepStates }
            }
          };
        });
      },
    }),
    {
      name: 'pgr-workflow-storage', // O nome da chave principal
      storage: createJSONStorage(() => localStorage), 
    }
  )
);

// --- Seletor customizado para facilitar a vida no componente ---
// Ele retorna o estado do PGR ativo ou o estado inicial se não houver
export const useActivePgrState = () => {
  const state = usePGRStore((s) => {
    if (s.activePgrId && s.pgrStates[s.activePgrId]) {
      return s.pgrStates[s.activePgrId];
    }
    return initialWorkflowState; // Retorna o estado inicial
  });
  return state;
};