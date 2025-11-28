import { z } from "zod";

/**
 * Regras comuns e helpers
 */
const requiredMsg = (campo: string) => `${campo} é obrigatório`;
const nonEmpty = (campo: string) => z.string().min(1, requiredMsg(campo));

/** CNPJ bem simples (você pode trocar por uma validação mais forte) */
const cnpjSchema = z
  .string()
  .min(14, "CNPJ inválido")
  .regex(/^\d{14}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ inválido");

/** Data DD/MM/AAAA (opcional nos outros steps) */
const dateBR = z
  .string()
  .regex(
    /^(?:0[1-9]|[12]\d|3[01])\/(?:0[1-9]|1[0-2])\/\d{4}$/,
    "Data inválida (use DD/MM/AAAA)"
  );

/**
 * Schema completo do formulário
 * (todos os campos com nomes exatamente como no seu formData)
 */
export const pgrFormSchema = z.object({
  // Identificação da Empresa
  empresaGrupo: nonEmpty("Grupo"),
  empresaEmpresa: nonEmpty("Empresa"),
  empresaCnpj: nonEmpty("CNPJ"), // use cnpjSchema se quiser exigir formato aqui
  empresaRazaoSocial: nonEmpty("Razão Social"),
  empresaCnae: nonEmpty("CNAE"),
  empresaGrauRisco: nonEmpty("Grau de Risco"),
  empresaDescricaoAtividade: nonEmpty("Descrição de Atividade Principal"),
  empresaEndereco: nonEmpty("Endereço"),

  // Estabelecimento
  estNome: nonEmpty("Nome do Estabelecimento"),
  estCnpj: z.string().optional(), // se quiser obrigatório: cnpjSchema
  estTipo: z.enum(["proprio", "terceirizado"]),
  estRazaoSocial: z.string().optional(),
  estCnae: z.string().optional(),
  estGrauRisco: z.string().optional(),
  estDescricaoAtividade: z.string().optional(),
  estEndereco: z.string().optional(),

  // Contratante (Os campos base continuam opcionais)
  contNomeFantasia: z.string().optional(),
  contRazaoSocial: z.string().optional(),
  contCnae: z.string().optional(),
  contGrauRisco: z.string().optional(),
  contDescricaoAtividade: z.string().optional(),
  contEndereco: z.string().optional(),

  // GHE (step 3)
  gheDescricaoProcesso: nonEmpty("Descrição Sucinta do Processo Produtivo"),
  gheObservacoes: z.string().optional(),
  gheAmbiente: nonEmpty("Descrição Ambiente do GHE"),

  // Medidas (step 5)
  medidasGhe: nonEmpty("GHE"),
  medidasDescAgente: nonEmpty("Descrição do Agente de Risco"),
  medidasControle: nonEmpty("Medidas de Controle"),
  medidasEpc: nonEmpty("EPC"),
  medidasEpi: nonEmpty("EPI / C.A."),

  // Plano (step 6)
  planoNr: nonEmpty("NR"),
  planoData: dateBR,
  planoMedidasGerais: nonEmpty("Medidas Gerais"),
  planoRisco: nonEmpty("Risco"),
  planoClassificacao: nonEmpty("Classificação"),
  planoAcoes: nonEmpty("Ações"),

  // Anexos (step 7)
  anexoDiretrizPdf: nonEmpty("Diretriz para Geração do PDF"),
})
// --- INÍCIO DA CORREÇÃO: Validação Condicional (Nome Fantasia e CNAE) ---
.superRefine((data, ctx) => {
  // 1. Lista de todos os campos da seção "Contratante"
  const contratanteFields = [
    data.contNomeFantasia,
    data.contRazaoSocial,
    data.contCnae,
    data.contGrauRisco,
    data.contDescricaoAtividade,
    data.contEndereco,
  ];

  // 2. Verifica se *algum* campo da seção "Contratante" foi preenchido
  const isContratantePreenchido = contratanteFields.some(
    (field) => field && field.trim() !== ''
  );

  // 3. Se nenhum campo foi preenchido, a seção é opcional. Tudo OK.
  if (!isContratantePreenchido) {
    return;
  }

  // 4. Se *algum* campo foi preenchido, então 'Nome Fantasia' e 'CNAE'
  //    se tornam obrigatórios.
  
  if (!data.contNomeFantasia || data.contNomeFantasia.trim() === '') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      // Esta mensagem aparecerá abaixo do campo
      message: "Nome Fantasia é obrigatório se a seção Contratante for preenchida.",
      // Este é o campo que receberá o erro
      path: ['contNomeFantasia'], 
    });
  }
  
  if (!data.contCnae || data.contCnae.trim() === '') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "CNAE é obrigatório se a seção Contratante for preenchida.",
      path: ['contCnae'],
    });
  }
});
// --- FIM DA CORREÇÃO ---


/**
 * Schemas por etapa
 * (reusamos o principal e selecionamos apenas os campos da etapa)
 */
export const step2Schema = pgrFormSchema.pick({
  empresaGrupo: true,
  empresaEmpresa: true,
  empresaCnpj: true,
  empresaRazaoSocial: true,
  empresaCnae: true,
  empresaGrauRisco: true,
  empresaDescricaoAtividade: true,
  empresaEndereco: true,

  estNome: true,
  estCnpj: true,
  estTipo: true,
  estRazaoSocial: true,
  estCnae: true,
  estGrauRisco: true,
  estDescricaoAtividade: true,
  estEndereco: true,

  contNomeFantasia: true,
  contRazaoSocial: true,
  contCnae: true,
  contGrauRisco: true,
  contDescricaoAtividade: true,
  contEndereco: true,
});

export const step3Schema = pgrFormSchema.pick({
  gheDescricaoProcesso: true,
  gheObservacoes: true,
  gheAmbiente: true,
});

export const step5Schema = pgrFormSchema.pick({
  medidasGhe: true,
  medidasDescAgente: true,
  medidasControle: true,
  medidasEpc: true,
  medidasEpi: true,
});

export const step6Schema = pgrFormSchema.pick({
  planoNr: true,
  planoData: true,
  planoMedidasGerais: true,
  planoRisco: true,
  planoClassificacao: true,
  planoAcoes: true,
});

export const step7Schema = pgrFormSchema.pick({
  anexoDiretrizPdf: true,
});

/** Tipos inferidos para usar no componente */
export type PGRFormData = z.infer<typeof pgrFormSchema>;
export type PGRFormErrors = Partial<Record<keyof PGRFormData, string>>;