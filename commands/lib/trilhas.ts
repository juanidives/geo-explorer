import trilhasData from "../../data/trilhas_dio.json";

export interface Trilha {
  id: number;
  nome: string;
  tecnologia: string;
  nivel: string;
  numero_de_modulos: number;
  xp_total: number;
  badges_disponiveis: string[];
  promocoes: boolean;
  vitalicio: boolean;
  lives_ao_vivo: number;
}

const trilhas: Trilha[] = (trilhasData as { trilhas: Trilha[] }).trilhas;

/**
 * Finds a trilha by technology name (case-insensitive, partial match).
 * Returns undefined when nothing is found.
 */
export function findTrilha(tecnologia: string): Trilha | undefined {
  const needle = tecnologia.toLowerCase();
  return trilhas.find((t) => t.tecnologia.toLowerCase().includes(needle));
}

export { trilhas };
