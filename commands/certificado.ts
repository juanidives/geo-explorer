/**
 * /certificado --nome "<nome>" --tech "<tecnologia>"
 *
 * Generates a fictitious Markdown certificate for a completed trail.
 * Output is printed to stdout; redirect to a file to save it.
 *
 * Usage:
 *   npx ts-node commands/certificado.ts --nome "<nome>" --tech "<tecnologia>"
 *
 * Examples:
 *   npx ts-node commands/certificado.ts --nome "Maria Silva" --tech "TypeScript"
 *   npx ts-node commands/certificado.ts --nome "João Souza" --tech "Data Science"
 *
 * Positional fallback (single-word values only, kept for backwards compatibility):
 *   npx ts-node commands/certificado.ts Maria TypeScript
 */

import { findTrilha } from "./lib/trilhas";

// Fail-safe: exit with an error message if the process hangs for more than 5 s.
// Under normal execution the synchronous path finishes well within 1 s.
const TIMEOUT_MS = 5_000;
const hangGuard = setTimeout(() => {
  console.error("Erro: o comando demorou demais e foi encerrado automaticamente.");
  process.exit(2);
}, TIMEOUT_MS);
// Allow Node to exit normally when the work finishes before the timeout fires.
hangGuard.unref();

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Generates a deterministic-looking certificate ID from name + trail id. */
function generateCertId(nome: string, trilhaId: number): string {
  let hash = trilhaId * 31;
  for (let i = 0; i < nome.length; i++) {
    hash = (hash * 31 + nome.charCodeAt(i)) >>> 0;
  }
  return `DIO-${trilhaId.toString().padStart(3, "0")}-${hash
    .toString(16)
    .toUpperCase()
    .padStart(8, "0")}`;
}

/**
 * Parses --nome / --tech flags from the raw argv array.
 * Each flag consumes all tokens that follow it until the next flag (or end),
 * so multi-word values work without quotes surviving the shell.
 *
 * Falls back to positional args[0] / args[1] when no flags are present,
 * preserving backwards compatibility for single-word values.
 */
function parseArgs(argv: string[]): { nome: string; tecnologia: string } | null {
  const nomeIdx = argv.indexOf("--nome");
  const techIdx = argv.indexOf("--tech");

  if (nomeIdx !== -1 || techIdx !== -1) {
    // Flag-based parsing: collect every token between this flag and the next.
    function collectAfter(flagIdx: number, otherFlagIdx: number): string {
      const start = flagIdx + 1;
      const end =
        otherFlagIdx !== -1 && otherFlagIdx > flagIdx
          ? otherFlagIdx
          : argv.length;
      return argv.slice(start, end).join(" ").trim();
    }

    const nome = nomeIdx !== -1 ? collectAfter(nomeIdx, techIdx) : "";
    const tecnologia = techIdx !== -1 ? collectAfter(techIdx, nomeIdx) : "";

    if (!nome || !tecnologia) return null;
    return { nome, tecnologia };
  }

  // Positional fallback: requires exactly 2 args (single-word values).
  if (argv.length >= 2) {
    return { nome: argv[0].trim(), tecnologia: argv[1].trim() };
  }

  return null;
}

function run(): void {
  const argv = process.argv.slice(2);
  const parsed = parseArgs(argv);

  if (!parsed) {
    console.error(
      "Erro: informe o nome e a tecnologia.\n" +
        "Uso: /certificado --nome \"<nome>\" --tech \"<tecnologia>\"\n" +
        'Exemplo: npm run certificado -- --nome "Ana" --tech "Data Science"'
    );
    process.exit(1);
  }

  const { nome, tecnologia } = parsed;

  if (!nome) {
    console.error("Erro: o nome não pode ser vazio.");
    process.exit(1);
  }

  const trilha = findTrilha(tecnologia);

  if (!trilha) {
    console.error(
      `Erro: nenhuma trilha encontrada para "${tecnologia}".\n` +
        `Verifique o nome e tente novamente.`
    );
    process.exit(1);
  }

  const emitidoEm = formatDate(new Date());
  const certId = generateCertId(nome, trilha.id);
  const badges = trilha.badges_disponiveis.map((b) => `- 🏅 ${b}`).join("\n");

  const certificado = `
# 🎓 CERTIFICADO DE CONCLUSÃO

---

**A Digital Innovation One certifica que**

## ${nome}

**concluiu com êxito a trilha:**

# ${trilha.nome}

---

| Campo              | Detalhe                            |
|--------------------|------------------------------------|
| **Tecnologia**     | ${trilha.tecnologia}               |
| **Nível**          | ${trilha.nivel}                    |
| **Módulos**        | ${trilha.numero_de_modulos} módulos concluídos |
| **XP conquistado** | ${trilha.xp_total.toLocaleString("pt-BR")} XP |
| **Lives ao vivo**  | ${trilha.lives_ao_vivo} aulas     |
| **Emitido em**     | ${emitidoEm}                      |
| **Certificado ID** | \`${certId}\`                      |

---

### Badges conquistadas

${badges}

---

> *Este é um certificado fictício gerado para fins educacionais.*
> *Código de verificação: \`${certId}\`*

---

**Digital Innovation One**
_Transformando talentos em protagonistas_
`.trim();

  console.log(certificado);
}

run();
