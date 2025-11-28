import { useState, useEffect, Dispatch, SetStateAction } from 'react';

// Função auxiliar para verificar se estamos no navegador
const isBrowser = typeof window !== 'undefined';

/**
 * Um hook customizado que funciona como o useState, mas persiste
 * o estado no localStorage.
 *
 * @param key A chave única para o localStorage.
 * @param initialValue O valor inicial a ser usado se nada for encontrado no localStorage.
 * @returns Um array [value, setValue] semelhante ao useState.
 */
function usePersistentState<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  
  // 1. Inicializa o estado
  // Usamos uma função para inicializar o useState APENAS UMA VEZ.
  // Isso evita ler o localStorage em cada renderização.
  const [value, setValue] = useState<T>(() => {
    // Se não estiver no navegador (ex: Next.js SSR/build),
    // apenas retorne o valor inicial.
    if (!isBrowser) {
      return initialValue;
    }

    try {
      // Tenta ler o valor do localStorage
      const item = window.localStorage.getItem(key);
      // Se o item existir, parseia o JSON.
      // Se não existir, retorna o valor inicial.
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      // Se o JSON.parse falhar ou houver outro erro,
      // loga o erro e retorna o valor inicial.
      console.error(`Erro ao ler do localStorage (chave: "${key}"):`, error);
      return initialValue;
    }
  });

  // 2. Cria um useEffect para ATUALIZAR o localStorage
  // Este efeito roda toda vez que 'key' ou 'value' mudarem.
  useEffect(() => {
    // Novamente, só roda no navegador.
    if (!isBrowser) {
      return;
    }

    try {
      // Salva o estado atual no localStorage.
      // JSON.stringify lida com objetos, arrays, strings, etc.
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Se o JSON.stringify falhar (ex: objeto cíclico)
      // ou o localStorage estiver cheio.
      console.error(`Erro ao salvar no localStorage (chave: "${key}"):`, error);
    }
  }, [key, value]); // Dependências: regrava se a chave ou o valor mudarem

  // Retorna a API idêntica ao useState
  return [value, setValue];
}

export { usePersistentState };