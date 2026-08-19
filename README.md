# Geo-Explorer

## O que é o Geo-Explorer

Geo-Explorer é uma plataforma de estudos fictícia inspirada na [DIO (Digital Innovation One)](https://www.dio.me/). O projeto simula um sistema de trilhas de aprendizado com desafios de código e emissão de certificados.

Ele serve como base de estudo para:

- Desenvolvimento de ferramentas CLI em TypeScript
- Construção de um **MCP Server** que expõe a lógica da plataforma como ferramentas invocáveis por agentes de IA (Bob, Claude Desktop, Cursor etc.)
- Definição de **slash commands locais** no Bob para acionar as ferramentas diretamente no chat
- Prática de testes unitários com cobertura 100%

---

## Estrutura do projeto

```
geo-explorer/
│
├── commands/               # Comandos CLI executáveis via npm run
│   ├── lib/
│   │   └── trilhas.ts      # Leitura de data/trilhas_dio.json e função findTrilha()
│   ├── trilha.ts           # /trilha <tecnologia>
│   ├── desafio.ts          # /desafio <tecnologia> [nivel]
│   └── certificado.ts      # /certificado --nome "<nome>" --tech "<tecnologia>" (flags) ou posicional
│
├── data/
│   └── trilhas_dio.json    # Base de dados com 35 trilhas DIO
│
├── mcp/                    # MCP Server (pacote independente)
│   ├── src/
│   │   └── index.ts        # Entry-point do servidor MCP (stdio transport)
│   ├── build/              # Saída compilada (gerada por npm run build, não versionada)
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md           # Documentação específica do servidor MCP
│
├── tests/                  # Testes unitários (Vitest)
│   ├── trilha.test.ts
│   ├── desafio.test.ts
│   └── certificado.test.ts
│
├── .bob/
│   ├── commands/           # Slash commands locais do Bob
│   │   ├── trilha.md
│   │   ├── desafio.md
│   │   └── certificado.md
│   ├── mcp.example.json    # Template de registro do MCP Server (versionado)
│   └── mcp.json            # Configuração local do MCP Server (não versionada)
│
├── package.json
├── tsconfig.json
└── vitest.config.mts
```

---

## Como executar

### Pré-requisitos

- **Node.js** ≥ 18
- **npm** ≥ 9

### Instalação

```bash
# Na raiz do projeto
npm install

# Para o servidor MCP (pacote separado)
cd mcp
npm install
```

### Build (verificação de tipos)

```bash
# Raiz — verifica os tipos sem emitir arquivos
npm run build

# MCP Server — compila TypeScript para JavaScript em mcp/build/
cd mcp
npm run build
```

> O build do servidor MCP precisa ser executado ao menos uma vez antes de registrá-lo.

---

## Como usar os comandos

Os três comandos CLI são executados via `npm run` na raiz do projeto.

---

### `/trilha <tecnologia>`

Exibe o plano de estudos completo de uma trilha a partir do nome (ou parte do nome) da tecnologia. A busca é **case-insensitive** e aceita correspondência parcial.

```bash
npm run trilha -- javascript
```

**Saída:**

```
╔══════════════════════════════════════════════════════╗
  🎯  PLANO DE ESTUDOS — JAVASCRIPT DEVELOPER
╚══════════════════════════════════════════════════════╝

  Tecnologia   : JavaScript
  Nível        : Básico
  Total de XP  : 12.000 XP
  Acesso       : Por período
  Promoção     : ✅ Disponível
  Lives ao vivo: 4

── MÓDULOS ──────────────────────────────────────────
  1. Fundamentos de JavaScript e ambiente de execução
  2. Tipos de dados, variáveis e operadores
  3. Estruturas de controle e funções
  4. Manipulação do DOM e eventos
  5. ES6+: arrow functions, promises e async/await
  6. Projeto final: aplicação web interativa

── BADGES DISPONÍVEIS ───────────────────────────────
  🏅 JS Fundamentals
  🏅 DOM Master
  🏅 ES6+ Hero

  Bons estudos! 🚀
```

---

### `/desafio <tecnologia> [nivel]`

Gera um desafio de código aleatório. O parâmetro `nivel` é opcional; quando omitido, usa o nível registrado na trilha. Valores aceitos para nível: `básico`, `intermediário`, `avançado` (com ou sem acento, case-insensitive).

```bash
# Sem nível (usa o nível da trilha)
npm run desafio -- typescript

# Com nível explícito
npm run desafio -- python avançado
```

**Saída (exemplo):**

```
╔══════════════════════════════════════════════════════╗
  ⚔️   DESAFIO DE CÓDIGO — TYPESCRIPT
╚══════════════════════════════════════════════════════╝

  Nível      : Intermediário
  Trilha base: Formação TypeScript Fullstack

── ENUNCIADO ────────────────────────────────────────

  Implemente uma classe Stack (pilha) com os métodos push, pop, peek e isEmpty.

── CRITÉRIOS DE AVALIAÇÃO ───────────────────────────

  ✔  Código legível e bem estruturado
  ✔  Tratamento de casos extremos (edge cases)
  ✔  Complexidade de tempo e espaço adequada ao nível
  ✔  Testes mínimos demonstrando o funcionamento

  Boa sorte! 💪
```

---

### `/certificado`

Emite um certificado fictício em Markdown. O ID do certificado é determinístico — gerado a partir do nome do estudante e do ID da trilha.

O comando aceita **duas formas** de passagem de argumentos:

```bash
# Forma recomendada — flags explícitas; cada flag coleta todos os tokens
# até a flag seguinte, então valores com espaços funcionam normalmente
npm run certificado -- --nome "Maria Silva" --tech "TypeScript"
npm run certificado -- --nome "Ana Lima" --tech "Data Science"

# Forma posicional — o primeiro argumento vira nome e o segundo vira tecnologia;
# aspas fazem o shell entregar cada valor como um único elemento de argv,
# então espaços dentro de cada valor funcionam normalmente
npm run certificado -- "Ana Lima" "TypeScript"
npm run certificado -- "Ana" "Data Science"
```

> Na forma posicional o parser espera exatamente dois argumentos (`argv[0]` → nome, `argv[1]` → tecnologia). Use as flags `--nome` e `--tech` se preferir uma sintaxe mais explícita ou se quiser evitar depender das aspas do shell.

**Saída (em Markdown):**

```markdown
# 🎓 CERTIFICADO DE CONCLUSÃO

---

**A Digital Innovation One certifica que**

## Maria Silva

**concluiu com êxito a trilha:**

# Formação TypeScript Fullstack

---

| Campo              | Detalhe                            |
|--------------------|------------------------------------|
| **Tecnologia**     | TypeScript                         |
| **Nível**          | Intermediário                      |
| **Módulos**        | 9 módulos concluídos               |
| **XP conquistado** | 22.000 XP                          |
| **Lives ao vivo**  | 6 aulas                            |
| **Emitido em**     | <data de hoje>                     |
| **Certificado ID** | `DIO-002-XXXXXXXX`                 |

---

### Badges conquistadas

- 🏅 TS Beginner
- 🏅 TS Advanced
- 🏅 Fullstack Badge
```

> **Redirecionando para arquivo:** `npm run certificado -- --nome "Maria Silva" --tech "TypeScript" > certificado.md`

---

## Como usar no chat do Bob

O projeto define três **slash commands locais** em [`.bob/commands/`](.bob/commands/). Após abrir o projeto no Bob, eles ficam disponíveis diretamente no chat:

| Comando | Sintaxe | O que faz |
|---|---|---|
| `/trilha` | `/trilha <tecnologia>` | Executa `commands/trilha.ts` e exibe o plano de estudos |
| `/desafio` | `/desafio <tecnologia> [nivel]` | Executa `commands/desafio.ts` e exibe o desafio gerado |
| `/certificado` | `/certificado "<nome>" "<tecnologia>"` | Executa `commands/certificado.ts` e renderiza o certificado |

**Exemplos de uso no chat:**

```
/trilha react
/desafio java intermediário
/certificado "Ana Lima" "Data Science"
```

O Bob interpreta os argumentos, monta o comando correto e exibe a saída formatada no próprio chat.

---

## Como executar os testes

```bash
# Executa os testes sem cobertura
npm test

# Executa os testes com relatório de cobertura
npm run test:coverage
```

### Resultado atual

```
 ✔ tests/trilha.test.ts        (14 testes)
 ✔ tests/certificado.test.ts   (24 testes)
 ✔ tests/desafio.test.ts       (20 testes)

 Test Files  3 passed (3)
      Tests  58 passed (58)
   Duration  1.71s

 % Coverage report from v8
------------------|---------|----------|---------|---------|
 File             | % Stmts | % Branch | % Funcs | % Lines |
------------------|---------|----------|---------|---------|
 All files        |     100 |      100 |     100 |     100 |
  commands        |     100 |      100 |     100 |     100 |
   certificado.ts |     100 |      100 |     100 |     100 |
   desafio.ts     |     100 |      100 |     100 |     100 |
   trilha.ts      |     100 |      100 |     100 |     100 |
  commands/lib    |     100 |      100 |     100 |     100 |
   trilhas.ts     |     100 |      100 |     100 |     100 |
------------------|---------|----------|---------|---------|

Statements : 100% (49/49) | Branches : 100% (28/28) | Functions : 100% (14/14) | Lines : 100% (43/43)
```

---

## MCP Server

### O que expõe

O servidor MCP em [`mcp/src/index.ts`](mcp/src/index.ts) reutiliza diretamente a lógica dos comandos em `commands/` e expõe quatro ferramentas:

| Ferramenta | Parâmetros | Descrição |
|---|---|---|
| `listar_tecnologias` | *(nenhum)* | Lista todas as tecnologias disponíveis com nível e XP total |
| `buscar_trilha` | `tecnologia` (string) | Retorna o plano de estudos completo de uma tecnologia |
| `gerar_desafio` | `tecnologia` (string), `nivel` (opcional) | Gera um desafio de código aleatório |
| `gerar_certificado` | `nome` (string), `tecnologia` (string) | Emite um certificado em Markdown |

O transporte usado é **stdio** — o servidor é iniciado como processo filho pelo cliente MCP.

### Como registrar no Bob

1. Faça o build do servidor (necessário apenas uma vez):

   ```bash
   cd mcp
   npm install
   npm run build
   ```

2. Copie o template de configuração:

   ```bash
   cp .bob/mcp.example.json .bob/mcp.json
   ```

3. Edite [`.bob/mcp.json`](.bob/mcp.json) substituindo o caminho pelo absoluto da sua máquina:

   ```json
   {
     "mcpServers": {
       "geo-explorer": {
         "command": "node",
         "args": ["/caminho/absoluto/para/geo-explorer/mcp/build/mcp/src/index.js"]
       }
     }
   }
   ```

4. O Bob recarrega os servidores MCP automaticamente ao salvar o arquivo. Após isso, **geo-explorer** aparecerá como servidor conectado no painel MCP do Bob.

> O arquivo `.bob/mcp.json` está no `.gitignore` — cada desenvolvedor mantém seu próprio caminho absoluto localmente.

---

## Melhorias realizadas

### Correções encontradas em teste manual

Ao validar os comandos além do caminho feliz, apareceram dois defeitos que os testes iniciais não pegavam:

- O `/certificado` travava quando a tecnologia tinha espaço no nome (`"Data Science"`). O parsing dependia da posição dos argumentos e não distinguia onde terminava o nome. Corrigido com flags explícitas `--nome` e `--tech`, mantendo o modo posicional como fallback.
- O `/trilha` exibia `"Módulo 1, Módulo 2..."` em vez dos nomes reais. O código gerava os rótulos a partir do campo `numero_de_modulos` e ignorava o array `modulos` do JSON — o dado estava correto, quem o consumia é que não lia.
- O `findTrilha` retornava a primeira trilha do catálogo para entrada vazia, porque `"".includes("")` é sempre verdadeiro. A validação existia na CLI, mas não no servidor MCP, onde o schema Zod aceita string de espaços. Corrigido na origem.

### Cobertura medida em vez de estimada

A meta era 70% de cobertura. Em vez de afirmar um número, configurei o provider `v8` do Vitest para medir de fato, com relatório gravado em arquivo e script `npm` reproduzível. Os entrypoints CLI foram excluídos do cálculo com justificativa explícita, e as branches descobertas que sobraram receberam teste. Resultado: 100% sobre a lógica testável, 59 testes.

### Separação entre lógica pura e I/O

Cada comando foi refatorado em duas camadas: funções puras exportadas e uma função `run()` isolada pelo guard `require.main === module`. Isso tornou o código testável sem mock de `process.argv`, e permitiu que o servidor MCP importasse a mesma lógica sem duplicação.

### Configuração local fora do versionamento

O `.bob/mcp.json` exige caminho absoluto da máquina. Em vez de versionar um caminho que só funciona no meu computador, versionei `.bob/mcp.example.json` com placeholder e ignorei o arquivo real — mesmo padrão do `.env.example`.

### Revisão da documentação gerada

A documentação produzida pelo agente foi revisada linha a linha e continha imprecisões: contagem errada de trilhas (15 em vez de 35), descrição do parser que não correspondia ao código, e uma justificativa de modelagem que racionalizava um campo redundante em vez de admitir o trade-off. Todas foram corrigidas contra o código.

---

## O que aprendi

- **Agente gera rápido, mas não verifica.** O ciclo que funcionou foi sempre o mesmo: pedir, ler o que saiu, testar o caminho de erro, corrigir. Os três bugs deste projeto apareceram em teste manual, nunca no que o agente relatou como pronto. Ele descreveu o próprio parser de forma incorreta duas vezes — descrevia a intenção, não o código.

- **Número afirmado não é número medido.** O projeto de referência declarava 100% de cobertura sem ter nenhuma ferramenta de cobertura instalada. É a diferença entre dizer e demonstrar, e ela só aparece se alguém procurar.

- **Segurança por padrão costuma ser a opção mais fraca.** A instrução original mandava usar `credential.helper store`, que grava o token em texto puro no disco. Troquei pelo Git Credential Manager, que cumpre o mesmo requisito com armazenamento criptografado. O token do GitHub ficou em variável de ambiente de usuário, nunca em arquivo do projeto — decisão que também atende à orientação do desafio de não enviar credenciais ao repositório.

- **Documentar decisão é diferente de documentar código.** O `ARQUITETURA.md` só ficou útil quando cada seção passou a registrar o problema, a alternativa descartada e o motivo da escolha. Descrever o que o código faz é redundante — o código já está lá.
