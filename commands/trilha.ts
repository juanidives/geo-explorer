/**
 * /trilha <tecnologia>
 *
 * Returns a formatted study plan for the given technology,
 * drawn from data/trilhas_dio.json.
 *
 * Usage:
 *   npx ts-node commands/trilha.ts <tecnologia>
 *
 * Examples:
 *   npx ts-node commands/trilha.ts javascript
 *   npx ts-node commands/trilha.ts "node.js"
 */

import { findTrilha, Trilha } from "./lib/trilhas";

export function buildOutput(trilha: Trilha): string {
  const modulos = trilha.modulos
    .map((nome, i) => `  ${i + 1}. ${nome}`)
    .join("\n");

  const promocao = trilha.promocoes ? "✅ Disponível" : "❌ Não disponível";
  const acesso = trilha.vitalicio ? "Vitalício" : "Por período";

  return `
╔══════════════════════════════════════════════════════╗
  🎯  PLANO DE ESTUDOS — ${trilha.nome.toUpperCase()}
╚══════════════════════════════════════════════════════╝

  Tecnologia   : ${trilha.tecnologia}
  Nível        : ${trilha.nivel}
  Total de XP  : ${trilha.xp_total.toLocaleString("pt-BR")} XP
  Acesso       : ${acesso}
  Promoção     : ${promocao}
  Lives ao vivo: ${trilha.lives_ao_vivo}

── MÓDULOS ──────────────────────────────────────────
${modulos}

── BADGES DISPONÍVEIS ───────────────────────────────
${trilha.badges_disponiveis.map((b) => `  🏅 ${b}`).join("\n")}

  Bons estudos! 🚀
`.trim();
}

/* istanbul ignore next */
function run(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Erro: informe a tecnologia.\nUso: /trilha <tecnologia>");
    process.exit(1);
  }

  const tecnologia = args.join(" ").trim();
  const trilha = findTrilha(tecnologia);

  if (!trilha) {
    console.error(
      `Erro: nenhuma trilha encontrada para "${tecnologia}".\n` +
        `Verifique o nome e tente novamente.`
    );
    process.exit(1);
  }

  console.log(buildOutput(trilha));
}

/* istanbul ignore next */
if (require.main === module) run();
