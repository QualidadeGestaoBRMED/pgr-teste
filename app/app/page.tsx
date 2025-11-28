'use client';

import { useRouter } from 'next/navigation';
// Importe seu store para poder resetar o estado ao criar um novo PGR
import { usePGRStore } from './pgrStore';

// Dados fictícios para a lista de PGRs
const pgrList = [
  { id: 'pgr-123', name: 'PGR - AeroClinica' },
  { id: 'pgr-456', name: 'PGR - BRMED' },
  { id: 'pgr-789', name: 'PGR - Cliente Teste' },
];

export default function HomePage() {
  const router = useRouter();
  const resetPgrState = usePGRStore((s) => s.resetPgrState);

  const handlePGRClick = (pgrId: string) => {
    // Ao clicar, você navega para a rota dinâmica
    // Opcional: Você pode querer resetar o estado daquele PGR específico
    // resetPgrState(pgrId); // (Implementaremos o reset abaixo)
    router.push(`/pgr/${pgrId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#0a3d5c] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/brmed-new-logo.png" 
            alt="BR MED Logo"
            className="h-13"
          />
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-2 border border-white rounded hover:bg-[#0c4a6e] transition">
            Sign In
          </button>
          <button className="px-6 py-2 bg-white text-[#0a3d5c] rounded hover:bg-gray-100 transition font-medium">
            Register
          </button>
        </div>
      </header>

      {/* Main Content (Apenas a Home) */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-gray-800">
            Programa de Gerenciamento de Riscos - PGR
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pgrList.map((pgr) => (
            <div
              key={pgr.id}
              className="bg-white rounded-lg h-48 cursor-pointer hover:shadow-lg transition border flex flex-col justify-between p-4"
              onClick={() => handlePGRClick(pgr.id)}
            >
              <span className="text-lg font-semibold text-gray-800">{pgr.name}</span>
              <span className="text-sm text-gray-500">ID: {pgr.id}</span>
            </div>
          ))}
          
          {/* Botão para criar um novo (exemplo) */}
           <div
              className="bg-gray-100 rounded-lg h-48 cursor-pointer hover:bg-gray-200 transition border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500"
              onClick={() => handlePGRClick(`pgr-${Date.now()}`)} // Cria um ID novo
            >
              <span className="text-lg font-semibold">+ Novo PGR</span>
            </div>
        </div>
      </div>
    </div>
  );
}