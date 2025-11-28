'use client';

// Imports do React e RHF
import { useEffect, useState, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Imports do Next.js
import { useRouter, useParams } from 'next/navigation';

import { usePersistentState } from '../../../../hooks/usePersistentState';
import { usePGRStore, useActivePgrState } from '../../pgrStore';

import { z } from 'zod';
import {
  pgrFormSchema,
  step2Schema,
  step3Schema,
  step5Schema,
  step6Schema,
  step7Schema,
  type PGRFormData,
} from './pgrSchema'; 

// --- DADOS FICTÍCIOS PARA AS FUNÇÕES ---
const initialAvailableFunctions = [
  { id: 1, setor: 'Setor 1', name: 'Função A', description: 'Descrição da Função A' },
  { id: 2, setor: 'Setor 1', name: 'Função B', description: 'Descrição da Função B' },
  { id: 3, setor: 'Setor 2', name: 'Função C', description: 'Descrição da Função C' },
  { id: 4, setor: 'Setor 2', name: 'Função D', description: 'Descrição da Função D' },
  { id: 5, setor: 'Setor 3', name: 'Função E', description: 'Descrição da Função E' },
];

type AvailableFunction = typeof initialAvailableFunctions[number];

type SelectedFunction = {
  id: number;
  setor: string;
  name: string;
  description: string;
  numFuncionarios: string | number;
};
// --- FIM DOS DADOS FICTÍCIOS ---

// --- TIPOS DE ANEXO ---
type AnexoFileMetadata = {
  id: string;
  displayName: string;
  fileName: string;
  fileType: string;
  fileSize: number;
};

type AnexoBox = {
  id: string;
  title: string;
  isRequired: boolean;
  files: AnexoFileMetadata[];
};
// --- FIM DOS TIPOS DE ANEXO ---

// --- TIPOS DE RISCO ---
type RiskData = {
  id: string;
  nome: string;
  tipoAgente: string;
  descricaoAgente: string;
  perigo: string;
  meioPropagacao: string;
  fontesCircunstancias: string;
  tipoAvaliacao: string;
  intensidadeConcentracao: string;
  severidade: string;
  probabilidade: string;
  classificacaoRisco: string;
};

type RiskFormData = Omit<RiskData, 'id' | 'nome'>;

const initialRiskFormData: RiskFormData = {
  tipoAgente: '',
  descricaoAgente: '',
  perigo: '',
  meioPropagacao: '',
  fontesCircunstancias: '',
  tipoAvaliacao: '',
  intensidadeConcentracao: '',
  severidade: '',
  probabilidade: '',
  classificacaoRisco: '',
};

type CustomEstField = {
  id: string;
  label: string;
  value: string;
};

const initialPGRFormData: PGRFormData = {
  empresaGrupo: 'Value',
  empresaEmpresa: 'Value',
  empresaCnpj: 'Value',
  empresaRazaoSocial: 'Value',
  empresaCnae: 'Value',
  empresaGrauRisco: 'Value',
  empresaDescricaoAtividade: 'Value',
  empresaEndereco: 'Value',
  estNome: '',
  estCnpj: '',
  estTipo: 'proprio',
  estRazaoSocial: '',
  estCnae: '',
  estGrauRisco: '',
  estDescricaoAtividade: '',
  estEndereco: '',
  contNomeFantasia: '',
  contRazaoSocial: '',
  contCnae: '',
  contGrauRisco: '',
  contDescricaoAtividade: '',
  contEndereco: '',
  gheDescricaoProcesso: '',
  gheObservacoes: '',
  gheAmbiente: '',
  medidasGhe: '',
  medidasDescAgente: '',
  medidasControle: '',
  medidasEpc: '',
  medidasEpi: '',
  planoNr: '',
  planoData: '',
  planoMedidasGerais: '',
  planoRisco: '',
  planoClassificacao: '',
  planoAcoes: '',
  anexoDiretrizPdf: '',
};

// Definição dos steps (Sem mudanças)
const steps = [
  { id: 'inicio', label: 'Início' },
  { id: 'historico', label: 'Histórico de Versões' },
  { id: 'dados', label: 'Dados Cadastrais' },
  { id: 'ghe', label: 'Descrição do GHE' },
  { id: 'caracterizacao', label: 'Caracterização de Risco' },
  { id: 'medidas', label: 'Descrição das Medidas de Prevenção Implementadas' },
  { id: 'plano', label: 'Plano de Ação' },
  { id: 'anexos', label: 'Inclusão de Anexos' },
  { id: 'revisao', label: 'Revisão de Campos' },
];

// Mapeamento dos campos de cada etapa para validação (Sem mudanças)
const stepFields: Record<number, (keyof PGRFormData)[]> = {
  2: [...Object.keys(step2Schema.shape)] as (keyof PGRFormData)[],
  3: [...Object.keys(step3Schema.shape)] as (keyof PGRFormData)[],
  5: [...Object.keys(step5Schema.shape)] as (keyof PGRFormData)[],
  6: [...Object.keys(step6Schema.shape)] as (keyof PGRFormData)[],
  7: [...Object.keys(step7Schema.shape)] as (keyof PGRFormData)[],
};

export default function PGRWorkflowPage() {
  const router = useRouter();
  
  // Correção do erro do terminal: Usando useParams
  const params = useParams();
  const pgrId = params.pgrId as string; 

  // Lógica do Zustand (Sem mudanças)
  const {
    loadPgr,
    nextStep,
    previousStep,
    visitStep,
    markStepAsComplete,
    setCurrentStep,
  } = usePGRStore();

  const { currentStep, stepStates } = useActivePgrState();

  useEffect(() => {
    if (pgrId) {
      loadPgr(pgrId);
    }
  }, [pgrId, loadPgr]);

  // Lógica do React Hook Form 
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm<PGRFormData>({
    resolver: zodResolver(pgrFormSchema),
    defaultValues: initialPGRFormData,
    mode: 'onBlur'
  });

  // Lógica para carregar/salvar no localStorage (Sem mudanças)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = window.localStorage.getItem(`pgr-formData-${pgrId}`);
      if (storedData) {
        try {
          reset(JSON.parse(storedData));
        } catch (e) {
          console.error("Falha ao carregar dados do localStorage", e);
        }
      }
    }
  }, [pgrId, reset]);

  const watchedFormData = watch();
  useEffect(() => {
    const timer = setTimeout(() => {
      window.localStorage.setItem(`pgr-formData-${pgrId}`, JSON.stringify(watchedFormData));
    }, 500);

    return () => clearTimeout(timer);
  }, [watchedFormData, pgrId]);

  // --- ESTADO GHE (currentStep === 3) ---
  const [isGHEModalOpen, setIsGHEModalOpen] = useState(false);
  const [availableFunctions, setAvailableFunctions] = usePersistentState(
    `pgr-availableFunctions-${pgrId}`,
    initialAvailableFunctions
  );
  const [selectedFunctions, setSelectedFunctions] = usePersistentState<SelectedFunction[]>(
    `pgr-selectedFunctions-${pgrId}`,
    []
  );
  const [checkedFunctions, setCheckedFunctions] = useState(new Set<number>());
  const [searchTerm, setSearchTerm] = useState('');

  // --- ESTADO ANEXOS (currentStep === 7) ---
  const [anexoBoxes, setAnexoBoxes] = usePersistentState<AnexoBox[]>(
    `pgr-anexoBoxes-${pgrId}`,
    [{ id: 'art-1', title: 'ART - Anotação de Responsabilidade Técnica', isRequired: true, files: [] }]
  );
  const [anexoFileObjects, setAnexoFileObjects] = useState<Map<string, File>>(new Map());

  // --- ESTADO CARACTERIZAÇÃO DE RISCO (currentStep === 4) ---
  const [risks, setRisks] = usePersistentState<RiskData[]>(
    `pgr-risks-${pgrId}`,
    []
  );
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [currentRiskData, setCurrentRiskData] = useState<RiskFormData>(initialRiskFormData);
  const [editingRiskId, setEditingRiskId] = useState<string | null>(null);
  const [riskModalMode, setRiskModalMode] = useState<'add' | 'edit' | 'view'>('add');

  // --- ESTADO PARA CAMPOS CUSTOMIZADOS (currentStep === 2) ---
  const [customEstFields, setCustomEstFields] = usePersistentState<CustomEstField[]>(
    `pgr-customEstFields-${pgrId}`,
    []
  );
  
  // --- Lógica da "Área de Preparação" (Staging Area) ---
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState(''); // Começa vazio
  const [newFieldValue, setNewFieldValue] = useState(''); // Começa vazio

  // --- FUNÇÃO DE VALIDAÇÃO CUSTOMIZADA PARA ANEXOS ---
  const validateAnexosStep = (): boolean => {
    const requiredBoxes = anexoBoxes.filter(box => box.isRequired);
    
    const missingFiles = requiredBoxes.some(box => {
      if (box.files.length === 0) {
        return true; 
      }
      
      const hasValidFile = box.files.some(file => anexoFileObjects.has(file.id));
      return !hasValidFile;
    });

    if (missingFiles) {
      alert('Por favor, envie todos os arquivos obrigatórios (ex: ART).');
      return false;
    }

    return true;
  };
  
  const handleNextStep = async (stepIndex: number) => {
    const fieldsToValidate = stepFields[stepIndex];
    let isValid = true;

    // 1. Valida os campos do Zod
    if (fieldsToValidate) {
      isValid = await trigger(fieldsToValidate); 
    }
    
    if (!isValid) {
      alert("Por favor, complete os campos obrigatórios.");
      return;
    }

    // 2. Validação customizada da Etapa 7 (Anexos)
    if (stepIndex === 7) {
      const customStepValid = validateAnexosStep();
      if (!customStepValid) {
        return; 
      }
    }

    // 3. Se tudo passou, avance
    markStepAsComplete(stepIndex);
    nextStep();
  };

  const handleSaveStep = async (stepIndex: number) => {
    const fieldsToValidate = stepFields[stepIndex];
    let isValid = true;

    // 1. Valida os campos do Zod
    if (fieldsToValidate) {
      isValid = await trigger(fieldsToValidate);
    }

    if (!isValid) {
      alert("Por favor, complete os campos obrigatórios.");
      return;
    }

    // 2. Validação customizada da Etapa 7 (Anexos)
    if (stepIndex === 7) {
      const customStepValid = validateAnexosStep();
      if (!customStepValid) {
        return;
      }
    }

    // 3. Se tudo passou, salve
    markStepAsComplete(stepIndex);
    alert("Salvo com sucesso!");
  };
  
  // --- FUNÇÕES DE LÓGICA (Gerais) ---
  useEffect(() => {
    if (currentStep < steps.length -1) {
      visitStep(currentStep);
    }
  }, [currentStep, visitStep]);

  const getStepColor = (index: number) => {
    const state = stepStates[index];
    if (!state) return 'bg-white border-2 border-gray-300';
    if (state.status === 'complete') return 'bg-green-600';
    if (state.status === 'incomplete') return 'bg-red-600';
    return 'bg-white border-2 border-gray-300';
  };

  const getStepTextColor = (index: number) => {
    const state = stepStates[index];
    if (!state) return 'text-gray-500';
    if (index === currentStep) return 'font-semibold text-gray-800';
    if (state.status === 'complete') return 'text-green-600 font-medium';
    if (state.status === 'incomplete') return 'text-red-600 font-medium';
    return 'text-gray-500';
  };

  const canFinalize = () => {
    return stepStates.slice(0, -1).every(state => state.status === 'complete');
  };

  // --- FUNÇÕES DE LÓGICA PARA GHE (currentStep === 3) ---
  const handleImportExcel = () => {
    // Lógica placeholder para o botão de importar
    alert('Lógica de importação do Excel ainda não implementada.');
  };

  type FunctionsBySetor = Record<string, AvailableFunction[]>;

  const functionsBySetor = availableFunctions
    .filter((f: AvailableFunction) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.setor.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .reduce((acc: FunctionsBySetor, func: AvailableFunction) => {
      if (!acc[func.setor]) { acc[func.setor] = []; }
      acc[func.setor].push(func);
      return acc;
    }, {} as FunctionsBySetor);

  const handleCheckboxChange = (id: number) => {
    const newChecked = new Set(checkedFunctions);
    if (newChecked.has(id)) { newChecked.delete(id); } else { newChecked.add(id); }
    setCheckedFunctions(newChecked);
  };

  const handleSendToGHE = () => {
    const functionsToAdd = availableFunctions
      .filter((f: AvailableFunction) => checkedFunctions.has(f.id))
      .map((f: AvailableFunction) => ({ ...f, numFuncionarios: 0 }));
    setSelectedFunctions([...selectedFunctions, ...functionsToAdd]);
    setAvailableFunctions(availableFunctions.filter((f: AvailableFunction) => !checkedFunctions.has(f.id)));
    setCheckedFunctions(new Set());
    setIsGHEModalOpen(false);
  };

  const handleRemoveFunction = (id: number) => {
    const functionToReturn = selectedFunctions.find(f => f.id === id);
    if (!functionToReturn) return;
    setSelectedFunctions(selectedFunctions.filter(f => f.id !== id));
    const { numFuncionarios, ...originalFunction } = functionToReturn;
    setAvailableFunctions([...availableFunctions, originalFunction]);
  };

  const handleEmployeeCountChange = (id: number, value: string) => {
    setSelectedFunctions(
      selectedFunctions.map((f: SelectedFunction) =>
        f.id === id ? { ...f, numFuncionarios: value } : f
      )
    );
  };

  // --- FUNÇÕES DE LÓGICA PARA ANEXOS (currentStep === 7) ---
  const handleAddNewBox = () => {
    const newBox: AnexoBox = { id: `anexo-${Date.now()}`, title: 'Novo Anexo (Clique para Editar)', isRequired: false, files: [] };
    setAnexoBoxes([...anexoBoxes, newBox]);
  };

  const handleRemoveBox = (boxId: string) => {
    const boxToRemove = anexoBoxes.find((box: AnexoBox) => box.id === boxId);
    if (boxToRemove) {
      const newFileMap = new Map(anexoFileObjects);
      boxToRemove.files.forEach((file: AnexoFileMetadata) => newFileMap.delete(file.id));
      setAnexoFileObjects(newFileMap);
    }
    setAnexoBoxes(anexoBoxes.filter((box: AnexoBox) => box.id !== boxId));
  };

  const handleBoxTitleChange = (boxId: string, newTitle: string) => {
    setAnexoBoxes(anexoBoxes.map((box: AnexoBox) => box.id === boxId ? { ...box, title: newTitle } : box ));
  };

  const handleFileChange = (boxId: string, event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    const newMetadata: AnexoFileMetadata[] = [];
    const newFileMap = new Map(anexoFileObjects);

    Array.from(event.target.files).forEach((file: File) => {
      const fileId = `${file.name}-${file.lastModified}-${Math.random()}`;

      newMetadata.push({
        id: fileId,
        displayName: file.name,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      newFileMap.set(fileId, file);
    });

    setAnexoBoxes(anexoBoxes.map((box: AnexoBox) =>
      box.id === boxId
        ? { ...box, files: [...box.files, ...newMetadata] }
        : box
    ));

    setAnexoFileObjects(newFileMap);
    event.target.value = "";
  };

  const handleRemoveFile = (boxId: string, fileId: string) => {
    setAnexoBoxes(anexoBoxes.map((box: AnexoBox) =>
      box.id === boxId
        ? { ...box, files: box.files.filter((file: AnexoFileMetadata) => file.id !== fileId) }
        : box
    ));

    const newFileMap = new Map(anexoFileObjects);
    newFileMap.delete(fileId);
    setAnexoFileObjects(newFileMap);
  };

  const handleFileNameChange = (boxId: string, fileId: string, newName: string) => {
    setAnexoBoxes(anexoBoxes.map((box: AnexoBox) => box.id === boxId ? { ...box, files: box.files.map((file: AnexoFileMetadata) => file.id === fileId ? { ...file, displayName: newName } : file )} : box ));
  };
  // --- FIM DAS FUNÇÕES DE ANEXOS ---

  // --- FUNÇÕES DE LÓGICA PARA CARACTERIZAÇÃO DE RISCO (currentStep === 4) ---
  const openRiskModal = (mode: 'add' | 'edit' | 'view', riskId?: string) => {
    setRiskModalMode(mode);
    if (mode === 'add') {
      setEditingRiskId(null);
      setCurrentRiskData(initialRiskFormData);
    } else if (riskId) {
      const riskToProcess = risks.find(r => r.id === riskId);
      if (riskToProcess) {
        const { id, nome, ...formData } = riskToProcess;
        setCurrentRiskData(formData);
        setEditingRiskId(riskId);
      } else {
        console.error("Risco não encontrado para editar/visualizar:", riskId);
        return;
      }
    }
    setIsRiskModalOpen(true);
  };

  const handleRiskFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (riskModalMode === 'view') return;
    const { name, value } = e.target;
    setCurrentRiskData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveRisk = () => {
    if (editingRiskId) {
      setRisks(risks.map((r: RiskData) => r.id === editingRiskId ? { ...r, ...currentRiskData } : r));
    } else {
      const newRisk: RiskData = {
        ...currentRiskData,
        id: `risk-${Date.now()}`,
        nome: `RISCO ${String(risks.length + 1).padStart(2, '0')}`
      };
      setRisks([...risks, newRisk]);
    }
    setIsRiskModalOpen(false);
    setCurrentRiskData(initialRiskFormData);
    setEditingRiskId(null);
  };

  const handleDeleteRisk = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este risco?")) {
        setRisks(risks.filter((r: RiskData) => r.id !== id));
    }
  };

  const handleConfirmAddCustomField = () => {
    if (newFieldLabel.trim() === '') {
      alert('Por favor, dê um nome válido ao campo.');
      return;
    }
    setCustomEstFields((prev) => [
      ...prev,
      { id: `custom-est-${Date.now()}`, label: newFieldLabel, value: newFieldValue },
    ]);
    // Reseta o formulário de adição
    setNewFieldLabel('');
    setNewFieldValue('');
    setIsAddingField(false);
  };

  const handleCancelAddCustomField = () => {
    setNewFieldLabel('');
    setNewFieldValue('');
    setIsAddingField(false);
  };

  const handleRemoveCustomEstField = (id: string) => {
    setCustomEstFields((prev) => prev.filter((field) => field.id !== id));
  };

  const handleCustomEstFieldChange = (
    id: string,
    newValue: string
  ) => {
    setCustomEstFields((prev) =>
      prev.map((field) =>
        field.id === id ? { ...field, value: newValue } : field
      )
    );
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#0a3d5c] text-white px-6 py-4 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => router.push('/')}
        >
            <img
              src="/brmed-new-logo.png"
              alt="BR MED Logo"
              className="h-13"
            />
        </div>
        <div className="flex gap-3">
          <button type="button" className="px-6 py-2 border border-white rounded hover:bg-[#0c4a6e] transition">
            Sign In
          </button>
          <button type="button" className="px-6 py-2 bg-white text-[#0a3d5c] rounded hover:bg-gray-100 transition font-medium">
            Register
          </button>
        </div>
      </header>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="relative">
              <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200"></div>
              <div className="relative flex justify-between">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex flex-col items-center cursor-pointer group"
                    style={{ width: `${100 / steps.length}%` }}
                    onClick={() => {
                      visitStep(index);
                      setCurrentStep(index);
                    }}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all ${getStepColor(index)} ${
                        index === currentStep ? 'ring-4 ring-gray-300' : ''
                      } hover:scale-110`}
                    >
                      {stepStates[index] && stepStates[index].status === 'complete' ? (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : stepStates[index] && stepStates[index].status === 'unvisited' ? (
                        <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                      ) : null}
                    </div>
                    <span className={`text-xs text-center leading-tight transition-colors ${getStepTextColor(index)}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center gap-6 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-300"></div>
                <span className="text-gray-600">Não visitado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-600"></div>
                <span className="text-gray-600">Incompleto</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-600"></div>
                <span className="text-gray-600">Completo</span>
              </div>
            </div>
        </div>
      </div>

      {/* Tag <form> envolve todo o conteúdo (Sem mudanças) */}
      <form onSubmit={(e) => e.preventDefault()} className="max-w-7xl mx-auto px-6 py-8">
        <>
            {/* ==================================================================== */}
            {/* ================ Etapa 0: Início =================================== */}
            {/* ==================================================================== */}
            {currentStep === 0 && (
              <>
                <div className="flex items-center justify-between mb-8">
                   <div style={{ width: '80px' }}></div>
                    <h1 className="text-3xl font-semibold text-gray-800">
                      Programa de Gerenciamento de Riscos - PGR
                    </h1>
                   <button
                    type="button" 
                    onClick={nextStep}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition">
                      Avançar<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>

                <h2 className="text-xl font-medium text-gray-600 mb-6">
                  Editando PGR: <span className="font-semibold text-gray-800">{pgrId}</span>
                </h2>

                <div className="grid grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="bg-gray-100 rounded-lg h-48"></div>
                  ))}
                </div>
              </>
            )}

            {/* ==================================================================== */}
            {/* ================ Etapa 1: Histórico ================================ */}
            {/* ==================================================================== */}
            {currentStep === 1 && (
              <>
                 <div className="flex items-center justify-between mb-8">
                     <button type="button" onClick={previousStep} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>Voltar</button>
                      <h1 className="text-2xl font-semibold text-gray-800">
                         Histórico de Versões
                     </h1>
                     <button
                      type="button"
                      onClick={() => handleNextStep(1)} 
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition">
                        Avançar<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                 </div>

                 {/* Subtítulo do PGR ID  */}
                 <h2 className="text-xl font-medium text-gray-600 mb-6 -mt-4">
                   Editando PGR: <span className="font-semibold text-gray-800">{pgrId}</span>
                 </h2>

                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="grid grid-cols-5 gap-4 px-6 py-4 border-b bg-gray-50"><div className="font-semibold text-gray-700">Nome da Empresa</div><div className="font-semibold text-gray-700">Análise</div><div className="font-semibold text-gray-700">Alteração</div><div className="font-semibold text-gray-700">Motivo</div><div className="font-semibold text-gray-700">Data</div></div>
                    <div className="px-6 py-32 text-center text-gray-400"><p>Nenhum registro encontrado</p></div>
                </div>
                <div className="flex justify-end gap-4 mb-8">
                    <button type="button" className="px-6 py-2.5 bg-[#3d5368] text-white rounded-lg hover:bg-[#2c3e50] transition font-medium">Editar último documento</button>
                    <button type="button" className="px-6 py-2.5 bg-[#3d5368] text-white rounded-lg hover:bg-[#2c3e50] transition font-medium">Baixar PDF</button>
                </div>

                <div className="flex justify-center pt-6 border-t">
                   <button type="button" onClick={() => handleSaveStep(1) } className="px-10 py-2.5 bg-[#0a3d5c] text-white rounded-lg hover:bg-[#083047] transition font-medium">Salvar</button>
                </div>
              </>
            )}

            {/* ==================================================================== */}
            {/* ================ Etapa 2: Dados Cadastrais ========================= */}
            {/* ==================================================================== */}
            {currentStep === 2 && (
              <>
                <div className="flex items-center justify-between mb-8">
                  <button type="button" onClick={previousStep} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>Voltar</button>
                  <h1 className="text-2xl font-semibold text-gray-800">Dados Cadastrais</h1>
                  <button
                    type="button"
                    onClick={() => handleNextStep(2)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition">
                      Avançar<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>

                {/* Subtítulo do PGR ID  */}
                <h2 className="text-xl font-medium text-gray-600 mb-6 -mt-4">
                  Editando PGR: <span className="font-semibold text-gray-800">{pgrId}</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Identificação da Empresa:</h2>
                    
                    <div>
                      <div className="relative"><label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Grupo:</label>
                        <input 
                          type="text" 
                          {...register('empresaGrupo')} 
                          className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.empresaGrupo && <p className="text-xs text-red-600 mt-1">{errors.empresaGrupo.message}</p>}
                    </div>

                    <div>
                      <div className="relative"><label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Empresa:</label>
                        <input type="text" {...register('empresaEmpresa')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.empresaEmpresa && <p className="text-xs text-red-600 mt-1">{errors.empresaEmpresa.message}</p>}
                    </div>

                    <div>
                      <div className="relative"><label className="absolute top-2 left-3 text-xs font-medium text-gray-600">CNPJ:</label>
                        <input type="text" {...register('empresaCnpj')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.empresaCnpj && <p className="text-xs text-red-600 mt-1">{errors.empresaCnpj.message}</p>}
                    </div>

                    <div>
                      <div className="relative"><label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Razão Social:</label>
                        <input type="text" {...register('empresaRazaoSocial')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.empresaRazaoSocial && <p className="text-xs text-red-600 mt-1">{errors.empresaRazaoSocial.message}</p>}
                    </div>

                    <div>
                      <div className="relative"><label className="absolute top-2 left-3 text-xs font-medium text-gray-600">CNAE:</label>
                        <input type="text" {...register('empresaCnae')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.empresaCnae && <p className="text-xs text-red-600 mt-1">{errors.empresaCnae.message}</p>}
                    </div>

                    <div>
                      <div className="relative"><label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Grau de Risco:</label>
                        <input type="text" {...register('empresaGrauRisco')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.empresaGrauRisco && <p className="text-xs text-red-600 mt-1">{errors.empresaGrauRisco.message}</p>}
                    </div>

                    <div>
                      <div className="relative"><label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Descrição de Atividade Principal:</label>
                        <textarea rows={4} {...register('empresaDescricaoAtividade')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.empresaDescricaoAtividade && <p className="text-xs text-red-600 mt-1">{errors.empresaDescricaoAtividade.message}</p>}
                    </div>

                    <div>
                      <div className="relative"><label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Endereço:</label>
                        <textarea rows={4} {...register('empresaEndereco')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.empresaEndereco && <p className="text-xs text-red-600 mt-1">{errors.empresaEndereco.message}</p>}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Identificação do Estabelecimento</h2>
                    
                    <div>
                      <div className="relative"><label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Nome do Estabelecimento:</label>
                        <input type="text" {...register('estNome')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.estNome && <p className="text-xs text-red-600 mt-1">{errors.estNome.message}</p>}
                    </div>
                    
                    <div>
                      <div className="relative"><label className="absolute top-2 left-3 text-xs font-medium text-gray-600">CNPJ:</label>
                        <input type="text" {...register('estCnpj')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.estCnpj && <p className="text-xs text-red-600 mt-1">{errors.estCnpj.message}</p>}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2">Estabelecimento:</label>
                      <div className="flex gap-2 mt-1">
                        <button 
                          type="button" 
                          onClick={() => setValue('estTipo', 'proprio', { shouldValidate: true })} 
                          className={`flex-1 px-4 py-2 rounded-lg transition font-medium text-sm ${ watchedFormData.estTipo === 'proprio' ? 'bg-[#0a3d5c] text-white hover:bg-[#083047]' : 'bg-gray-200 text-gray-700 hover:bg-gray-300' }`}>
                            Próprio
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setValue('estTipo', 'terceirizado', { shouldValidate: true })} 
                          className={`flex-1 px-4 py-2 rounded-lg transition font-medium text-sm ${ watchedFormData.estTipo === 'terceirizado' ? 'bg-[#0a3d5c] text-white hover:bg-[#083047]' : 'bg-gray-200 text-gray-700 hover:bg-gray-300' }`}>
                            Terceirizado
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="relative"><label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Razão Social:</label>
                        <input type="text" {...register('estRazaoSocial')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.estRazaoSocial && <p className="text-xs text-red-600 mt-1">{errors.estRazaoSocial.message}</p>}
                    </div>

                    <div>
                      <div className="relative"><label className="absolute top-2 left-3 text-xs font-medium text-gray-600">CNAE:</label>
                        <input type="text" {...register('estCnae')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.estCnae && <p className="text-xs text-red-600 mt-1">{errors.estCnae.message}</p>}
                    </div>

                    <div>
                      <div className="relative"><label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Grau de Risco:</label>
                        <input type="text" {...register('estGrauRisco')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.estGrauRisco && <p className="text-xs text-red-600 mt-1">{errors.estGrauRisco.message}</p>}
                    </div>

                    <div>
                      <div className="relative"><label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Descrição de Atividade Principal:</label>
                        <textarea rows={4} {...register('estDescricaoAtividade')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.estDescricaoAtividade && <p className="text-xs text-red-600 mt-1">{errors.estDescricaoAtividade.message}</p>}
                    </div>

                    <div>
                      <div className="relative"><label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Endereço:</label>
                        <textarea rows={4} {...register('estEndereco')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.estEndereco && <p className="text-xs text-red-600 mt-1">{errors.estEndereco.message}</p>}
                    </div>

                    {customEstFields.length > 0 && (
                      <hr className="border-gray-200" />
                    )}

                    {/* 1. Renderiza os campos JÁ SALVOS */}
                    {customEstFields.map((field) => (
                      <div key={field.id} className="relative group">
                        <label className="absolute top-2 left-3 text-xs font-medium text-gray-600">{field.label}:</label>
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) =>
                            handleCustomEstFieldChange(field.id, e.target.value)
                          }
                          className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomEstField(field.id)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700 bg-gray-200 rounded w-6 h-6 flex items-center justify-center text-2xl font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remover Campo"
                        >
                          -
                        </button>
                      </div>
                    ))}

                    {/* 2. Renderiza a "Área de Preparação" (Staging Area) se `isAddingField` for true */}
                    {isAddingField && (
                      <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="relative">
                          <label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Nome do Novo Campo:</label>
                          <input
                            type="text"
                            value={newFieldLabel}
                            onChange={(e) => setNewFieldLabel(e.target.value)}
                            placeholder="Insira o nome do campo (ex: CNAE)"
                            autoFocus
                            className="w-full pt-6 pb-2 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"
                          />
                        </div>
                        <div className="relative">
                          <label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Valor do Campo:</label>
                          <input
                            type="text"
                            value={newFieldValue}
                            onChange={(e) => setNewFieldValue(e.target.value)}
                            placeholder="Insira o valor"
                            className="w-full pt-6 pb-2 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={handleCancelAddCustomField}
                            className="text-red-500 hover:text-red-700 bg-gray-200 rounded w-8 h-8 flex items-center justify-center text-2xl font-bold"
                            title="Cancelar"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={handleConfirmAddCustomField}
                            className="text-green-600 hover:text-green-800 bg-gray-200 rounded w-8 h-8 flex items-center justify-center text-2xl font-bold"
                            title="Salvar Campo"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 3. Botão Principal "Adicionar Campo" */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingField(true)}
                        disabled={isAddingField}
                        className="w-full px-6 py-2.5 bg-[#0a3d5c] text-white rounded-lg transition font-medium text-sm enabled:hover:bg-[#083047] disabled:opacity-50"
                      >
                        Adicionar Campo
                      </button>
                    </div>
              
                  </div>

                  <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Identificação da Contratante</h2>
                    
                    <div>
                      <div className="relative"><label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Nome Fantasia:</label>
                        <input type="text" {...register('contNomeFantasia')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.contNomeFantasia && <p className="text-xs text-red-600 mt-1">{errors.contNomeFantasia.message}</p>}
                    </div>

                    <div>
                      <div className="relative"><label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Razão Social:</label>
                        <input type="text" {...register('contRazaoSocial')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.contRazaoSocial && <p className="text-xs text-red-600 mt-1">{errors.contRazaoSocial.message}</p>}
                    </div>

                    <div>
                      <div className="relative"><label className="absolute top-2 left-3 text-xs font-medium text-gray-600">CNAE:</label>
                        <input type="text" {...register('contCnae')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.contCnae && <p className="text-xs text-red-600 mt-1">{errors.contCnae.message}</p>}
                    </div>

                    <div>
                      <div className="relative"><label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Grau de Risco:</label>
                        <input type="text" {...register('contGrauRisco')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.contGrauRisco && <p className="text-xs text-red-600 mt-1">{errors.contGrauRisco.message}</p>}
                    </div>

                    <div>
                      <div className="relative"><label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Descrição de Atividade Principal:</label>
                        <textarea rows={4} {...register('contDescricaoAtividade')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.contDescricaoAtividade && <p className="text-xs text-red-600 mt-1">{errors.contDescricaoAtividade.message}</p>}
                    </div>
                    
                    <div>
                      <div className="relative"><label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Endereço:</label>
                        <textarea rows={4} {...register('contEndereco')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.contEndereco && <p className="text-xs text-red-600 mt-1">{errors.contEndereco.message}</p>}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mt-8 border-t pt-6">
                  <button
                    type="button"
                    onClick={() => handleSaveStep(2)}
                    className="px-16 py-2.5 bg-[#0a3d5c] text-white rounded-lg hover:bg-[#083047] transition font-medium">
                      Salvar
                  </button>
                </div>
              </>
            )}

            {/* ==================================================================== */}
            {/* ================ Etapa 3: Descrição do GHE ========================= */}
            {/* ==================================================================== */}
            {currentStep === 3 && (
              <>
                 <div className="flex items-center justify-between mb-8">
                     <button type="button" onClick={previousStep} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>Voltar</button>
                      <h1 className="text-2xl font-semibold text-gray-800">Descrição do GHE</h1>
                     <button
                      type="button"
                      onClick={() => handleNextStep(3)}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition">
                        Avançar<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                 </div>

                 {/* --- MUDANÇA: Subtítulo do PGR ID Adicionado --- */}
                 <h2 className="text-xl font-medium text-gray-600 mb-6 -mt-4">
                   Editando PGR: <span className="font-semibold text-gray-800">{pgrId}</span>
                 </h2>

                <div className="bg-white rounded-lg shadow p-8 space-y-6">
                  <div>
                    <div className="relative"><label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Descrição Sucinta do Processo Produtivo:</label>
                      <input type="text" {...register('gheDescricaoProcesso')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                    </div>
                    {errors.gheDescricaoProcesso && <p className="text-xs text-red-600 mt-1">{errors.gheDescricaoProcesso.message}</p>}
                  </div>

                  <div>
                    <div className="relative"><label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Observações do GHE:</label>
                      <textarea rows={3} {...register('gheObservacoes')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                    </div>
                    {errors.gheObservacoes && <p className="text-xs text-red-600 mt-1">{errors.gheObservacoes.message}</p>}
                  </div>

                  <div>
                    <div className="relative"><label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Descrição Ambiente do GHE:</label>
                      <textarea rows={3} {...register('gheAmbiente')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                    </div>
                    {errors.gheAmbiente && <p className="text-xs text-red-600 mt-1">{errors.gheAmbiente.message}</p>}
                  </div>

                  <div className="pt-4"><button type="button" onClick={() => setIsGHEModalOpen(true)} className="px-6 py-2.5 bg-[#3d5368] text-white rounded-lg hover:bg-[#2c3e50] transition font-medium">Adicionar Funções ao GHE</button></div>
                  <div className="overflow-x-auto mt-6">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b"><tr><th className="px-4 py-3 text-sm font-semibold text-gray-700">Setor</th><th className="px-4 py-3 text-sm font-semibold text-gray-700">Função</th><th className="px-4 py-3 text-sm font-semibold text-gray-700">Descrição de Atividades</th><th className="px-4 py-3 text-sm font-semibold text-gray-700">Nº de Funcionários</th><th className="px-4 py-3 text-sm font-semibold text-gray-700">Ação</th></tr></thead>
                      <tbody>
                        {selectedFunctions.length === 0 && (<tr><td colSpan={5} className="text-center text-gray-400 py-8">Nenhuma função selecionada.</td></tr>)}
                        {selectedFunctions.map((func: SelectedFunction) => (
                          <tr key={func.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-800">{func.setor}</td>
                            <td className="px-4 py-3 text-sm text-gray-800">{func.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-800">{func.description}</td>
                            <td className="px-4 py-3"><input type="number" value={func.numFuncionarios} onChange={(e) => handleEmployeeCountChange(func.id, e.target.value)} className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/></td>
                            <td className="px-4 py-3"><button type="button" onClick={() => handleRemoveFunction(func.id)} className="text-red-600 hover:text-red-800" title="Remover"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                   <div className="flex justify-center pt-6 border-t mt-8">
                       <button
                        type="button"
                        onClick={() => handleSaveStep(3)}
                        className="px-16 py-2.5 bg-[#0a3d5c] text-white rounded-lg hover:bg-[#083047] transition font-medium">
                          Salvar
                        </button>
                   </div>
                </div>
              </>
            )}

            {/* ==================================================================== */}
            {/* ================ Etapa 4: Caracterização de Risco ================== */}
            {/* ==================================================================== */}
             {currentStep === 4 && (
              <>
                 <div className="flex items-center justify-between mb-8">
                     <button type="button" onClick={previousStep} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                         Voltar
                     </button>
                     <h1 className="text-2xl font-semibold text-gray-800">
                         Caracterização de Risco
                     </h1>
                     <button
                      type="button"
                      onClick={() => handleNextStep(4)}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition">
                         Avançar
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                     </button>
                 </div>

                 {/* --- MUDANÇA: Subtítulo do PGR ID Adicionado --- */}
                 <h2 className="text-xl font-medium text-gray-600 mb-6 -mt-4">
                   Editando PGR: <span className="font-semibold text-gray-800">{pgrId}</span>
                 </h2>

                <div className="bg-white rounded-lg shadow p-8 space-y-6 flex flex-col">
                  <button
                    type="button"
                    onClick={() => openRiskModal('add')}
                    className="px-8 py-3 bg-[#0a3d5c] text-white rounded-lg hover:bg-[#083047] transition font-medium self-end mb-6"
                  >
                    Adicionar Risco
                  </button>

                  <div className="border rounded-lg overflow-hidden flex-grow">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          {/* Coluna do Checkbox removida */}
                          <th className="px-4 py-3 text-sm font-semibold text-gray-700">Riscos atribuídos a um GHE</th>
                          <th className="px-4 py-3 text-sm font-semibold text-gray-700">Função</th>
                          <th className="px-4 py-3 text-sm font-semibold text-gray-700 w-24 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {risks.length === 0 && (
                          // colSpan atualizado para 3
                          <tr><td colSpan={3} className="text-center text-gray-400 py-8">Nenhum risco adicionado.</td></tr>
                        )}
                        {risks.map((risk: RiskData) => (
                          <tr key={risk.id} className="border-b hover:bg-gray-50">
                            {/* Célula do Checkbox removida */}
                            <td className="px-4 py-3 text-sm text-gray-800">{risk.nome}</td>
                            <td className="px-4 py-3 text-sm text-gray-800"></td>
                            <td className="px-4 py-3">
                                <div className="flex justify-center items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => openRiskModal('view', risk.id)}
                                        className="text-gray-400 hover:text-blue-600" title="Visualizar">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openRiskModal('edit', risk.id)}
                                        className="text-gray-400 hover:text-yellow-600" title="Editar">
                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteRisk(risk.id)}
                                        className="text-gray-400 hover:text-red-600" title="Excluir">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-center pt-6 border-t mt-8">
                    <button
                        type="button"
                        onClick={() => handleSaveStep(4)}
                        className="px-8 py-2.5 bg-[#0a3d5c] text-white rounded-lg hover:bg-[#083047] transition font-medium"
                      >
                        Salvar e gerar GHT
                      </button>
                  </div>
                </div>

                {/* ==================================================================== */}
                {/* ================ MODAL: Adicionar/Editar Risco =================== */}
                {/* ==================================================================== */}
                {isRiskModalOpen && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                      <div className="flex justify-between items-center p-5 border-b">
                        <h2 className="text-xl font-semibold text-gray-800">
                          {riskModalMode === 'add' && 'Adicionar Novo Risco'}
                          {riskModalMode === 'edit' && 'Editar Risco'}
                          {riskModalMode === 'view' && 'Visualizar Risco'}
                        </h2>
                        <button onClick={() => setIsRiskModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>

                      <div className="p-5 overflow-y-auto flex-grow space-y-3">
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Tipo de Agente de Risco:</label><input type="text" name="tipoAgente" value={currentRiskData.tipoAgente} onChange={handleRiskFormChange} disabled={riskModalMode === 'view'} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3d5368] outline-none disabled:bg-gray-100 disabled:text-gray-500"/></div>
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Descrição do Agente de Risco:</label><textarea name="descricaoAgente" rows={2} value={currentRiskData.descricaoAgente} onChange={handleRiskFormChange} disabled={riskModalMode === 'view'} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3d5368] outline-none disabled:bg-gray-100 disabled:text-gray-500"/></div>
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Perigo:</label><input type="text" name="perigo" value={currentRiskData.perigo} onChange={handleRiskFormChange} disabled={riskModalMode === 'view'} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3d5368] outline-none disabled:bg-gray-100 disabled:text-gray-500"/></div>
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Meio de Propagação:</label><input type="text" name="meioPropagacao" value={currentRiskData.meioPropagacao} onChange={handleRiskFormChange} disabled={riskModalMode === 'view'} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3d5368] outline-none disabled:bg-gray-100 disabled:text-gray-500"/></div>
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Fontes ou Circunstâncias:</label><input type="text" name="fontesCircunstancias" value={currentRiskData.fontesCircunstancias} onChange={handleRiskFormChange} disabled={riskModalMode === 'view'} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3d5368] outline-none disabled:bg-gray-100 disabled:text-gray-500"/></div>
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Tipo de Avaliação:</label><input type="text" name="tipoAvaliacao" value={currentRiskData.tipoAvaliacao} onChange={handleRiskFormChange} disabled={riskModalMode === 'view'} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3d5368] outline-none disabled:bg-gray-100 disabled:text-gray-500"/></div>
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Intensidade/Concentração:</label><input type="text" name="intensidadeConcentracao" value={currentRiskData.intensidadeConcentracao} onChange={handleRiskFormChange} disabled={riskModalMode === 'view'} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3d5368] outline-none disabled:bg-gray-100 disabled:text-gray-500"/></div>
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Severidade:</label><input type="text" name="severidade" value={currentRiskData.severidade} onChange={handleRiskFormChange} disabled={riskModalMode === 'view'} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3d5368] outline-none disabled:bg-gray-100 disabled:text-gray-500"/></div>
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Probabilidade:</label><input type="text" name="probabilidade" value={currentRiskData.probabilidade} onChange={handleRiskFormChange} disabled={riskModalMode === 'view'} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3d5368] outline-none disabled:bg-gray-100 disabled:text-gray-500"/></div>
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Classificação do Risco:</label><input type="text" name="classificacaoRisco" value={currentRiskData.classificacaoRisco} onChange={handleRiskFormChange} disabled={riskModalMode === 'view'} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3d5368] outline-none disabled:bg-gray-100 disabled:text-gray-500"/></div>
                      </div>

                      <div className="p-5 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                        <button type="button" onClick={() => setIsRiskModalOpen(false)} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                           {riskModalMode === 'view' ? 'Fechar' : 'Cancelar'}
                        </button>
                        {riskModalMode !== 'view' && (
                            <button
                                type="button"
                                onClick={handleSaveRisk}
                                className="px-6 py-2 bg-[#0a3d5c] text-white rounded-lg hover:bg-[#083047] transition"
                            >
                                Salvar Risco
                            </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {/* --- FIM DO MODAL DE RISCO --- */}
              </>
            )}

            {/* ==================================================================== */}
            {/* ================ Etapa 5: Medidas de Prevenção ===================== */}
            {/* ==================================================================== */}
            {currentStep === 5 && (
              <>
                <div className="flex items-center justify-between mb-8">
                  <button
                    type="button"
                    onClick={previousStep}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Voltar
                  </button>
                  <h1 className="text-2xl font-semibold text-gray-800">
                    {steps[currentStep].label}
                  </h1>
                  <button
                    type="button"
                    onClick={() => handleNextStep(5)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
                  >
                    Avançar
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>

                {/* --- MUDANÇA: Subtítulo do PGR ID Adicionado --- */}
                <h2 className="text-xl font-medium text-gray-600 mb-6 -mt-4">
                  Editando PGR: <span className="font-semibold text-gray-800">{pgrId}</span>
                </h2>

                <div className="bg-white rounded-lg shadow p-8 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div>
                      <div className="relative">
                        <label className="absolute top-2 left-3 text-xs font-medium text-gray-600">GHE:</label>
                        <textarea rows={10} {...register('medidasGhe')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.medidasGhe && <p className="text-xs text-red-600 mt-1">{errors.medidasGhe.message}</p>}
                    </div>
                    <div>
                      <div className="relative">
                        <label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Descrição do Agente de Risco:</label>
                        <textarea rows={10} {...register('medidasDescAgente')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.medidasDescAgente && <p className="text-xs text-red-600 mt-1">{errors.medidasDescAgente.message}</p>}
                    </div>
                    <div>
                      <div className="relative">
                        <label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Medidas de Controle Administrativas e/ou de Engenharia:</label>
                        <textarea rows={10} {...register('medidasControle')} className="w-full pt-10 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.medidasControle && <p className="text-xs text-red-600 mt-1">{errors.medidasControle.message}</p>}
                    </div>
                    <div>
                      <div className="relative">
                        <label className="absolute top-2 left-3 text-xs font-medium text-gray-600">EPC:</label>
                        <textarea rows={10} {...register('medidasEpc')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.medidasEpc && <p className="text-xs text-red-600 mt-1">{errors.medidasEpc.message}</p>}
                    </div>
                    <div>
                      <div className="relative">
                        <label className="absolute top-2 left-3 text-xs font-medium text-gray-600">EPI / C.A.:</label>
                        <textarea rows={10} {...register('medidasEpi')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.medidasEpi && <p className="text-xs text-red-600 mt-1">{errors.medidasEpi.message}</p>}
                    </div>
                  </div>

                  <div className="flex justify-center pt-6 border-t mt-8">
                    <button
                      type="button"
                      onClick={() => handleSaveStep(5)}
                      className="px-16 py-2.5 bg-[#0a3d5c] text-white rounded-lg hover:bg-[#083047] transition font-medium"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ==================================================================== */}
            {/* ================ Etapa 6: Plano de Ação ============================ */}
            {/* ==================================================================== */}
            {currentStep === 6 && (
              <>
                <div className="flex items-center justify-between mb-8">
                  <button
                    type="button"
                    onClick={previousStep}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Voltar
                  </button>
                  <h1 className="text-2xl font-semibold text-gray-800">
                    Plano de Ação
                  </h1>
                  <button
                    type="button"
                    onClick={() => handleNextStep(6)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
                  >
                    Avançar
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>

                {/* --- MUDANÇA: Subtítulo do PGR ID Adicionado --- */}
                <h2 className="text-xl font-medium text-gray-600 mb-6 -mt-4">
                  Editando PGR: <span className="font-semibold text-gray-800">{pgrId}</span>
                </h2>

                <div className="bg-white rounded-lg shadow p-8 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-4 items-end gap-6">

                    <div className="md:col-span-3">
                      <label htmlFor="nr-select" className="block text-sm font-medium text-gray-700 mb-1">NRs</label>
                      <select
                        id="nr-select"
                        {...register('planoNr')}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"
                      >
                        <option value="">Selecione a NR</option>
                        <option value="nr-1">NR 1 - Disposições Gerais</option>
                        <option value="nr-2">NR 2 - (Revogada)</option>
                        <option value="nr-3">NR 3 - Embargo ou Interdição</option>
                      </select>
                      {errors.planoNr && <p className="text-xs text-red-600 mt-1">{errors.planoNr.message}</p>}
                    </div>

                    <div className="md:col-span-1">
                      <label htmlFor="data-acompanhamento" className="block text-sm font-medium text-gray-700 mb-1">Acompanhamento das Medidas de Prevenção:</label>
                      <input
                          id="data-acompanhamento"
                          type="text"
                          placeholder="DD/MM/AAAA"
                          {...register('planoData')}
                          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"
                      />
                      {errors.planoData && <p className="text-xs text-red-600 mt-1">{errors.planoData.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <div className="relative">
                        <label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Medidas Gerais:</label>
                        <textarea rows={10} {...register('planoMedidasGerais')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.planoMedidasGerais && <p className="text-xs text-red-600 mt-1">{errors.planoMedidasGerais.message}</p>}
                    </div>
                    <div>
                      <div className="relative">
                        <label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Risco:</label>
                        <textarea rows={10} {...register('planoRisco')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.planoRisco && <p className="text-xs text-red-600 mt-1">{errors.planoRisco.message}</p>}
                    </div>
                    <div>
                      <div className="relative">
                        <label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Classificação:</label>
                        <textarea rows={10} {...register('planoClassificacao')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.planoClassificacao && <p className="text-xs text-red-600 mt-1">{errors.planoClassificacao.message}</p>}
                    </div>
                    <div>
                      <div className="relative">
                        <label className="absolute top-2 left-3 text-xs font-medium text-gray-600">Ações:</label>
                        <textarea rows={10} {...register('planoAcoes')} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"/>
                      </div>
                      {errors.planoAcoes && <p className="text-xs text-red-600 mt-1">{errors.planoAcoes.message}</p>}
                    </div>
                  </div>

                  <div className="flex justify-center pt-6 border-t mt-8">
                    <button
                      type="button"
                      onClick={() => handleSaveStep(6)}
                      className="px-16 py-2.5 bg-[#0a3d5c] text-white rounded-lg hover:bg-[#083047] transition font-medium"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ==================================================================== */}
            {/* ================ Etapa 7: Inclusão de Anexos ======================= */}
            {/* ==================================================================== */}
            {currentStep === 7 && (
              <>
                <div className="flex items-center justify-between mb-8">
                  <button
                    type="button"
                    onClick={previousStep}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Voltar
                  </button>
                  <h1 className="text-2xl font-semibold text-gray-800">
                    Inclusão de Anexos
                  </h1>
                  <button
                    type="button"
                    onClick={() => handleNextStep(7)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
                  >
                    Avançar
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>

                {/* Subtítulo do PGR ID --- */}
                <h2 className="text-xl font-medium text-gray-600 mb-6 -mt-4">
                  Editando PGR: <span className="font-semibold text-gray-800">{pgrId}</span>
                </h2>

                <div className="bg-white rounded-lg shadow p-8 space-y-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Diretriz para Geração do PDF
                    </label>
                    <select
                      {...register('anexoDiretrizPdf')}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d5368] focus:border-transparent outline-none"
                    >
                      <option value="">Selecione a diretriz</option>
                      <option value="diretriz-1">Diretriz Padrão</option>
                      <option value="diretriz-2">Diretriz Completa</option>
                    </select>
                    {errors.anexoDiretrizPdf && <p className="text-xs text-red-600 mt-1">{errors.anexoDiretrizPdf.message}</p>}
                  </div>

                  {anexoBoxes.map((box: AnexoBox) => (
                    <div key={box.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"></path></svg>
                          <input
                            type="text"
                            value={box.title}
                            disabled={box.isRequired}
                            onChange={(e) => handleBoxTitleChange(box.id, e.target.value)}
                            className={`text-sm font-medium text-gray-700 p-1 rounded-md focus:outline-none disabled:bg-transparent disabled:border-none ${!box.isRequired && 'focus:ring-2 focus:ring-[#3d5368] bg-gray-50'}`}
                          />
                          {box.isRequired && <span className="text-xs text-gray-500">(Obrigatório)</span>}
                        </div>
                        {!box.isRequired && (
                          <button type="button" onClick={() => handleRemoveBox(box.id)} className="text-red-500 hover:text-red-700" title="Excluir este anexo">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                          </button>
                        )}
                      </div>

                      <div className="relative border border-gray-300 rounded-lg p-3 bg-white text-sm">
                        Escolher arquivos
                        <span className="text-gray-500 ml-2">Nenhum arquivo escolhido</span>
                        <input
                          type="file"
                          multiple
                          accept=".pdf"
                          onChange={(e) => handleFileChange(box.id, e)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2 pt-2">
                        {box.files.map((file: AnexoFileMetadata) => (
                          <div
                            key={file.id}
                            className={`flex items-center gap-2 p-2 rounded-lg ${
                              anexoFileObjects.has(file.id) ? 'bg-gray-50' : 'bg-red-50 border border-red-200'
                            }`}
                          >
                            <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v1H5V4zM5 7v11a2 2 0 002 2h8a2 2 0 002-2V7H5zm2 4a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                            <input
                              type="text"
                              value={file.displayName}
                              onChange={(e) => handleFileNameChange(box.id, file.id, e.target.value)}
                              className="flex-1 text-sm text-gray-800 bg-transparent border-b border-gray-300 focus:border-[#0a3d5c] focus:ring-0 outline-none"
                            />
                            {!anexoFileObjects.has(file.id) && (
                                <span className="text-xs text-red-600 font-medium">(Arquivo pendente - re-anexar)</span>
                            )}
                            <button type="button" onClick={() => handleRemoveFile(box.id, file.id)} className="text-gray-400 hover:text-red-500">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-col items-center gap-4 pt-6 border-t mt-8">
                    <button
                        type="button"
                        onClick={handleAddNewBox}
                        className="flex items-center gap-2 px-6 py-2 border border-gray-400 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Adicionar Novo Anexo
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSaveStep(7)}
                        className="px-16 py-2.5 bg-[#0a3d5c] text-white rounded-lg hover:bg-[#083047] transition font-medium"
                      >
                        Salvar
                      </button>
                  </div>
                </div>
              </>
            )}

            {/* ==================================================================== */}
            {/* ================ Etapa 8: Revisão de Campos ======================== */}
            {/* ==================================================================== */}
             {currentStep === 8 && (
              <>
                 <div className="flex items-center justify-between mb-8">
                     <button type="button" onClick={previousStep} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                         Voltar
                     </button>
                      <h1 className="text-2xl font-semibold text-gray-800">
                         {steps[currentStep].label}
                     </h1>
                     <div style={{ width: '68px' }} ></div>
                 </div>

                 {/* --- MUDANÇA: Subtítulo do PGR ID Adicionado --- */}
                 <h2 className="text-xl font-medium text-gray-600 mb-6 -mt-4">
                   Editando PGR: <span className="font-semibold text-gray-800">{pgrId}</span>
                 </h2>

                <div className="bg-white rounded-lg shadow p-8 space-y-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">Revisão de campos anteriores:</h2>
                    <p className="text-sm text-gray-600 mb-6">Revise os campos completados, edite um de cada vez:</p>

                    <div className="space-y-2">
                        {steps.map((step: { id: string, label: string }, index: number) => {
                            if (index === 0 || index === steps.length - 1) {
                                return null;
                            }

                            return (
                                <div key={step.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                                    <div className="flex items-center">
                                  
                                        <span className="text-sm font-medium text-gray-700">{step.label}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setCurrentStep(index)}
                                            className="text-gray-400 hover:text-blue-600"
                                            title={`Editar ${step.label}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-center pt-8 border-t mt-8">
                        <button
                          type="button"
                          onClick={() => {
                              if (canFinalize()) {
                                 markStepAsComplete(8);
                                 alert("Finalizado! Pronto para gerar PDF.");
                              } else {
                                  markStepAsComplete(8);
                                  alert("Revisão salva. Complete todas as etapas para finalizar.");
                              }
                          }}
                          className={`px-16 py-2.5 rounded-lg transition font-medium ${
                              canFinalize()
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : 'bg-[#0a3d5c] text-white hover:bg-[#083047]'
                          }`}
                          title={canFinalize() ? "Finalizar e Gerar PDF" : "Salvar Revisão (Complete todas as etapas para finalizar)"}
                        >
                           {canFinalize() ? 'Finalizar e Gerar PDF' : 'Salvar Revisão'}
                        </button>
                    </div>
                     {!canFinalize() && (
                      <p className="text-red-500 text-sm text-center mt-2">
                        Complete todas as etapas anteriores para habilitar a finalização.
                      </p>
                    )}
                </div>
              </>
            )}

            {/* ==================================================================== */}
            {/* ================ MODAL: Adicionar Funções (GHE) ==================== */}
            {/* ==================================================================== */}
            {isGHEModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
                  <div className="flex justify-between items-center p-5 border-b">
                    <div className="flex items-center gap-4">
                      <h2 className="text-xl font-semibold text-gray-800">Adicionar Funções ao GHE</h2>
                      
                      {/* --- BOTÃO DE IMPORTAR COM ÍCONE --- */}
                      <button
                        type="button"
                        onClick={handleImportExcel}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                        title="Importar planilha"
                      >
                        <img 
                          src="/excel-icon.png" 
                          alt="Importar" 
                          className="w-4 h-4" 
                        />
                        Importar
                      </button>
    
                    </div>

                    <button onClick={() => setIsGHEModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="p-5 overflow-y-auto flex-grow">
                    <input
                      type="text"
                      placeholder="Buscar por setor ou função..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-[#3d5368] outline-none"
                    />
                    <div className="space-y-4">
                      {Object.keys(functionsBySetor).length === 0 && (
                        <p className="text-gray-500 text-center">Nenhuma função encontrada.</p>
                      )}
                      {Object.entries(functionsBySetor).map(([setor, funcoes]: [string, AvailableFunction[]]) => (
                        <div key={setor}>
                          <h3 className="text-lg font-semibold text-gray-700 mb-2">{setor}</h3>
                          <div className="space-y-2">
                            {funcoes.map((func: AvailableFunction) => (
                              <label key={func.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checkedFunctions.has(func.id)}
                                  onChange={() => handleCheckboxChange(func.id)}
                                  className="w-5 h-5 rounded text-[#0a3d5c] focus:ring-[#0a3d5c]"
                                />
                                <span className="text-sm text-gray-800">{func.name} - <span className="text-gray-600">{func.description}</span></span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-5 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                    <button type="button" onClick={() => setIsGHEModalOpen(false)} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSendToGHE}
                      className="px-6 py-2 bg-[#0a3d5c] text-white rounded-lg hover:bg-[#083047] transition"
                      disabled={checkedFunctions.size === 0}
                    >
                      Adicionar Selecionadas
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
      </form>
    </div>
  );
}