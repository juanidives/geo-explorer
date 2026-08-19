/**
 * /desafio <tecnologia> [nivel]
 *
 * Generates a random coding challenge based on the technology and
 * optional difficulty level.
 *
 * Níveis aceitos (case-insensitive): Básico | Intermediário | Avançado
 * Quando o nível é omitido, usa o nível registrado na trilha.
 *
 * Usage:
 *   npx ts-node commands/desafio.ts <tecnologia> [nivel]
 *
 * Examples:
 *   npx ts-node commands/desafio.ts javascript
 *   npx ts-node commands/desafio.ts python avançado
 *   npx ts-node commands/desafio.ts "node.js" intermediário
 */

import { findTrilha } from "./lib/trilhas";

type Nivel = "Básico" | "Intermediário" | "Avançado";

const NIVEIS: Nivel[] = ["Básico", "Intermediário", "Avançado"];

/** Challenges keyed by normalised level. */
const DESAFIOS: Record<Nivel, string[]> = {
  Básico: [
    "Implemente uma função que recebe um array de números e retorna a soma de todos os elementos.",
    "Crie uma função que verifica se uma string é um palíndromo.",
    "Escreva um programa que lista os números primos entre 1 e 100.",
    "Implemente o algoritmo de busca linear em um array.",
    "Crie uma função que converte temperatura de Celsius para Fahrenheit e vice-versa.",
    "Escreva uma função que conta a frequência de cada caractere em uma string.",
  ],
  Intermediário: [
    "Implemente uma classe Stack (pilha) com os métodos push, pop, peek e isEmpty.",
    "Crie uma função que achata um array aninhado em qualquer profundidade sem usar Array.flat.",
    "Implemente o algoritmo Merge Sort para ordenação de arrays.",
    "Escreva uma função que resolve o problema da mochila (knapsack) usando programação dinâmica.",
    "Crie um sistema de cache LRU com capacidade configurável.",
    "Implemente uma função de debounce sem usar bibliotecas externas.",
  ],
  Avançado: [
    "Implemente um interpretador simples para expressões matemáticas com precedência de operadores.",
    "Crie um motor de busca de texto com suporte a expressões regulares usando uma árvore de sufixos.",
    "Implemente o algoritmo A* para encontrar o caminho mais curto em um grafo.",
    "Escreva um runtime assíncrono mínimo (event loop) para corrotinas em sua linguagem escolhida.",
    "Implemente um compilador de expressões regulares para NFA e depois para DFA.",
    "Crie um sistema distribuído de consenso usando o algoritmo Raft simplificado.",
  ],
};

function normaliseNivel(input: string): Nivel | null {
  const normalised = input.toLowerCase().trim();
  if (["basico", "básico"].includes(normalised)) return "Básico";
  if (["intermediario", "intermediário"].includes(normalised))
    return "Intermediário";
  if (["avancado", "avançado"].includes(normalised)) return "Avançado";
  return null;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function run(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(
      "Erro: informe a tecnologia.\nUso: /desafio <tecnologia> [nivel]"
    );
    process.exit(1);
  }

  // Last arg may be a level — try to parse it.
  let tecnologiaArgs = args;
  let nivel: Nivel | null = null;

  const maybeLast = args[args.length - 1];
  const parsedLast = normaliseNivel(maybeLast);
  if (parsedLast) {
    nivel = parsedLast;
    tecnologiaArgs = args.slice(0, -1);
  }

  if (tecnologiaArgs.length === 0) {
    console.error(
      "Erro: informe a tecnologia.\nUso: /desafio <tecnologia> [nivel]"
    );
    process.exit(1);
  }

  const tecnologia = tecnologiaArgs.join(" ").trim();
  const trilha = findTrilha(tecnologia);

  if (!trilha) {
    console.error(
      `Erro: nenhuma trilha encontrada para "${tecnologia}".\n` +
        `Verifique o nome e tente novamente.`
    );
    process.exit(1);
  }

  // Fall back to the level registered in the trail when none was supplied.
  if (!nivel) {
    nivel = trilha.nivel as Nivel;
    if (!NIVEIS.includes(nivel)) {
      nivel = "Intermediário"; // safe fallback
    }
  }

  const desafio = pickRandom(DESAFIOS[nivel]);

  const output = `
╔══════════════════════════════════════════════════════╗
  ⚔️   DESAFIO DE CÓDIGO — ${trilha.tecnologia.toUpperCase()}
╚══════════════════════════════════════════════════════╝

  Nível      : ${nivel}
  Trilha base: ${trilha.nome}

── ENUNCIADO ────────────────────────────────────────

  ${desafio}

── CRITÉRIOS DE AVALIAÇÃO ───────────────────────────

  ✔  Código legível e bem estruturado
  ✔  Tratamento de casos extremos (edge cases)
  ✔  Complexidade de tempo e espaço adequada ao nível
  ✔  Testes mínimos demonstrando o funcionamento

  Boa sorte! 💪
`.trim();

  console.log(output);
}

run();
