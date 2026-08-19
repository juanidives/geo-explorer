/**
 * /certificado "<nome>" "<tecnologia>"
 *
 * Generates a fictitious Markdown certificate for a completed trail.
 * Output is printed to stdout; redirect to a file to save it.
 *
 * Usage:
 *   npx ts-node commands/certificado.ts "<nome>" "<tecnologia>"
 *
 * Examples:
 *   npx ts-node commands/certificado.ts "Maria Silva" "TypeScript"
 *   npx ts-node commands/certificado.ts "João Souza" "python"
 */

import { findTrilha } from "./lib/trilhas";

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

function run(): void {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(
      'Erro: informe o nome e a tecnologia entre aspas.\n' +
        'Uso: /certificado "<nome>" "<tecnologia>"'
    );
    process.exit(1);
  }

  const nome = args[0].trim();
  const tecnologia = args[1].trim();

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
