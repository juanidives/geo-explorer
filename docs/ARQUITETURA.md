# Arquitetura e Decisões Técnicas

Este documento registra as principais decisões técnicas tomadas no Geo-Explorer: o problema que cada uma resolvia, as alternativas consideradas e a justificativa da escolha.

---

## 1. Separação entre lógica pura e entrypoint CLI

### Problema

Um arquivo TypeScript executado diretamente via `npx tsx` precisa ler `process.argv`, imprimir no stdout e eventualmente chamar `process.exit()`. Essas três operações tornam o arquivo **impossível de testar unitariamente** — não há como importar a função de negócio sem que o efeito colateral do CLI dispare junto.

### Alternativa considerada

Testar o módulo completo com mocks de `process.argv` e spies em `console.log` / `process.exit`. Funciona, mas o teste precisa se preocupar com o ambiente de processo (restaurar argv, interceptar exit) em vez de verificar apenas a lógica que interessa.

### Decisão adotada

Cada arquivo de comando tem **duas camadas claramente separadas**:

1. **Funções exportadas** (`buildOutput`, `parseArgs`, `generateCertId`, …) — lógica pura, sem efeito colateral, testáveis diretamente.
2. **Função `run()`** e guarda de entrypoint — contém toda a leitura de `process.argv`, as chamadas a `console.log`/`console.error` e `process.exit`. Nunca é chamada pelos testes.

O padrão usado para isolar o entrypoint é:

```typescript
/* istanbul ignore next */
if (require.main === module) run();
```

`require.main === module` é `true` apenas quando o Node executa o arquivo diretamente. Quando o arquivo é `import`ado pelos testes (ou pelo servidor MCP), a expressão é `false` e `run()` nunca é chamada. O comentário `/* istanbul ignore next */` instrui o c8/v8 a não contar essa linha na cobertura — ela nunca executa em ambiente de teste e isso é intencional.

O mesmo comentário aparece na definição de `run()` e no `setTimeout` de guarda do `certificado.ts`, pelos mesmos motivos.

---

## 2. `commands/lib/trilhas.ts` como fonte única de busca

### Problema

Os três comandos (`trilha.ts`, `desafio.ts`, `certificado.ts`) e o servidor MCP precisam todos localizar uma trilha a partir de um nome de tecnologia digitado pelo usuário. Duplicar a lógica de leitura do JSON e a busca case-insensitive em cada arquivo introduziria divergência inevitável — uma correção em um lugar não chegaria aos outros.

### Alternativa considerada

Importar `trilhas_dio.json` diretamente em cada arquivo que precisasse dele, repetindo o cast de tipo e a chamada a `Array.find`.

### Decisão adotada

[`commands/lib/trilhas.ts`](../commands/lib/trilhas.ts) centraliza:

- A **leitura e tipagem** do JSON (`trilhasData as { trilhas: Trilha[] }`).
- A **interface `Trilha`** — contrato único com o formato dos dados.
- A função `findTrilha(tecnologia: string): Trilha | undefined` — busca por substring case-insensitive.
- O array `trilhas` exportado diretamente para os casos em que é necessário iterar sobre todas as trilhas (testes, `listar_tecnologias` do MCP).

Todos os consumidores — CLI, MCP e testes — importam desse único módulo. Qualquer mudança na estrutura do JSON ou na estratégia de busca tem um só ponto de edição.

**Entrada em branco:** `findTrilha` rejeita explicitamente strings vazias ou compostas só de espaços, retornando `undefined` antes de executar o `Array.find`. Sem essa guarda, `"".includes("")` é sempre `true` e qualquer string vazia retornaria a primeira trilha do array — comportamento silencioso que afeta não só a CLI (que valida `process.argv` antes) mas também o servidor MCP, cujo schema Zod aceita `z.string().min(1)` mas não impede que um cliente envie só espaços em branco.

---

## 3. Estratégia de testes e o que foi excluído da cobertura

### Problema

Os testes precisam verificar a lógica de negócio (busca de trilhas, formatação de saída, geração de IDs, parsing de argumentos) sem depender de efeitos colaterais do processo (argv, stdout, exit, timers).

### O que foi excluído e por quê

Três categorias de código recebem `/* istanbul ignore next */` e são excluídas da métrica de cobertura:

| Trecho | Motivo |
|---|---|
| `if (require.main === module) run()` | Verdadeiro apenas na execução direta; jamais executado em testes |
| A função `run()` inteira em cada comando | Contém apenas leitura de `process.argv`, `console.log/error` e `process.exit` — sem lógica de negócio |
| O `setTimeout` de guarda em `certificado.ts` | Timer de segurança para execução direta; irrelevante em ambiente de teste |

### O que foi testado

Os testes cobrem **100% das linhas, branches, funções e statements** do código que importa:

- **`findTrilha`** — casos feliz, busca case-insensitive, tecnologia inexistente, string vazia.
- **`buildOutput` (trilha)** — cabeçalho, módulos numerados, badges, flags `vitalicio` e `promocoes`.
- **`normaliseNivel`** — todas as variantes com e sem acento, maiúsculas, valores inválidos.
- **`pickRandom`** — invariante de que o resultado sempre pertence ao array de entrada.
- **`buildOutput` (desafio)** — cabeçalho, nível, trilha base, texto do desafio, critérios.
- **`parseArgs`** — flags `--nome`/`--tech` com valores multi-palavra, fallback posicional, casos nulos.
- **`generateCertId`** — formato `DIO-NNN-HHHHHHHH`, determinismo, diferença de entrada gera saída diferente.
- **`formatDate`** — formato pt-BR com dia, mês por extenso e ano.
- **`buildCertificate`** — nome, trilha, nível, XP formatado, badges, ID do certificado.

### Ferramenta escolhida

**Vitest** foi escolhido por ter zero configuração adicional para projetos TypeScript com `tsx`, pelo suporte nativo a módulos ES e CommonJS, e pela integração com o provider de cobertura `v8` (sem precisar de `babel` ou `@babel/register`).

A cobertura está configurada em [`vitest.config.mts`](../vitest.config.mts) para incidir apenas sobre `commands/**/*.ts`, excluindo deliberadamente `mcp/src/index.ts` (servidor MCP — testado por integração via cliente MCP, não por testes unitários).

---

## 4. Reutilização de código entre CLI, slash commands e MCP Server

### Problema

O mesmo comportamento — buscar trilha, formatar saída de trilha, gerar desafio, emitir certificado — precisa ser acessível por três superfícies diferentes:

1. **CLI** (`npm run trilha`, `npm run desafio`, `npm run certificado`)
2. **Slash commands do Bob** (`.bob/commands/*.md` invocam os mesmos arquivos CLI via `npx tsx`)
3. **Servidor MCP** (`mcp/src/index.ts` precisa das mesmas funções para responder às chamadas de ferramentas)

### Alternativas consideradas

- **Duplicar a lógica no MCP server** — rejeitado: qualquer bug ou melhoria teria de ser aplicado em dois lugares.
- **Mover tudo para um pacote `core` separado** — overhead desnecessário para um projeto deste tamanho.

### Decisão adotada

O servidor MCP **importa diretamente** dos arquivos de comando da raiz:

```typescript
// mcp/src/index.ts
import { findTrilha, trilhas } from "../../commands/lib/trilhas";
import { buildOutput as buildTrilhaOutput } from "../../commands/trilha";
import { normaliseNivel, pickRandom, DESAFIOS, NIVEIS,
         buildOutput as buildDesafioOutput } from "../../commands/desafio";
import { buildCertificate } from "../../commands/certificado";
```

Isso é possível porque o `tsconfig.json` do pacote MCP define `rootDir: ".."` (raiz do projeto) e inclui `"../commands/**/*.ts"` no `include`. O compilador enxerga toda a árvore de fontes ao compilar o servidor.

Os slash commands do Bob seguem o mesmo princípio: os arquivos `.bob/commands/*.md` apenas montam e executam o comando CLI correto via `npx tsx commands/<comando>.ts`. Não há lógica duplicada — o Bob age como uma casca de UI sobre os mesmos entrypoints.

```
┌─────────────────────────────────────────────┐
│           commands/lib/trilhas.ts           │  ← fonte de dados e busca
└──────────────────┬──────────────────────────┘
                   │ importa
        ┌──────────┴──────────────────────┐
        │                                 │
  commands/*.ts                  mcp/src/index.ts
  (lógica pura + run())          (ferramentas MCP)
        │
   npx tsx
        │
  .bob/commands/*.md             → Bob MCP tools
  (slash commands)
```

---

## 5. Workaround do TS2589 no SDK do MCP

### Problema

O `@modelcontextprotocol/sdk` expõe `McpServer.tool()` com um tipo de parâmetro que usa uma union complexa (`ZodRawShapeCompat`) para aceitar diferentes formas de schema Zod. Quando esse tipo é instanciado junto com Zod v3 sob `strict: true`, o TypeScript 5.x lança:

```
TS2589: Type instantiation is excessively deep and possibly infinite.
```

O erro não indica um bug no código — é uma limitação do motor de inferência de tipos do TypeScript com tipos recursivos profundos.

### Alternativas consideradas

- **Desativar `strict`** — rejeitado: perderia toda a proteção de tipo no restante do projeto.
- **Usar `@ts-ignore`** em cada chamada — possível, mas silencia erros sem documentar o motivo.
- **Fazer downgrade do SDK ou do Zod** — não confiável e dificulta atualizações futuras.

### Decisão adotada

Foi criado um helper local que aplica um cast `as any` **uma única vez**, restringindo o escape de tipos a um ponto controlado e documentado:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registerTool = (server.tool as any).bind(server) as (
  name: string,
  description: string,
  schema: Record<string, z.ZodTypeAny>,
  handler: (args: Record<string, unknown>) => Promise<{ content: ... }>
) => void;
```

`registerTool` tem uma assinatura explícita e correta — o `as any` fica contido na sua definição. Todas as chamadas subsequentes passam pelo type-checker normalmente. O comentário `eslint-disable` documenta que o uso de `any` aqui é deliberado.

A ferramenta `listar_tecnologias` não recebe parâmetros e usa `server.tool()` diretamente (sem o helper), pois sua assinatura sem schema não aciona o problema de inferência.

---

## 6. Estrutura do `trilhas_dio.json`

### Problema

Os dados das trilhas precisam ser legíveis por humanos (para manutenção), tipados em tempo de compilação (para segurança) e acessíveis tanto no Node quanto no compilador TypeScript sem nenhuma etapa de transformação extra.

### Alternativa considerada

Armazenar as trilhas em um módulo TypeScript (`trilhas.ts` com `export const trilhas = [...]`). Mais simples de tipar, mas mistura dados com código e dificulta a edição isolada do catálogo.

### Decisão adotada

Os dados vivem em [`data/trilhas_dio.json`](../data/trilhas_dio.json), importado via `resolveJsonModule: true` no `tsconfig.json`. Isso dá inferência de tipos automática na importação e mantém dados e lógica em arquivos separados.

Cada trilha tem o seguinte esquema:

```jsonc
{
  "id": 1,                          // identificador numérico único (usado no certId)
  "nome": "Formação … Developer",   // nome completo da trilha
  "tecnologia": "JavaScript",       // chave de busca (findTrilha usa .includes sobre este campo)
  "nivel": "Básico",                // "Básico" | "Intermediário" | "Avançado"
  "numero_de_modulos": 6,           // redundante com modulos.length, mas explícito para exibição
  "modulos": ["…", "…"],            // lista ordenada de módulos
  "xp_total": 12000,                // XP acumulado ao concluir a trilha
  "badges_disponiveis": ["…"],      // badges emitidas ao concluir
  "promocoes": true,                // se há promoção ativa (exibido como ✅/❌)
  "vitalicio": false,               // acesso vitalício ou por período
  "lives_ao_vivo": 4                // número de aulas ao vivo
}
```

**Decisões de modelagem relevantes:**

- **`tecnologia` como chave de busca** — `findTrilha` busca por substring sobre esse campo. Isso permite que o usuário digite `"java"` e encontre `"Java"`, ou `"node"` e encontre `"Node.js"`. Trilhas cujo nome de tecnologia é composto (ex: `"Python / ML"`, `"Java / Spring"`) são encontradas tanto por `"python"` quanto por `"ml"` ou `"spring"`.
- **`numero_de_modulos` redundante** — o campo existe porque estava no formato original dos dados e foi preservado para não quebrar compatibilidade com esse esquema. Na prática, `modulos.length` é a fonte confiável: nunca fica fora de sincronia com o array real. O código de exibição usa `trilha.numero_de_modulos` por consistência com o JSON, mas qualquer novo código deve preferir `trilha.modulos.length`.
- **`id` numérico** — usado exclusivamente por `generateCertId` para produzir um identificador de certificado determinístico sem precisar de UUID ou dependência externa.
