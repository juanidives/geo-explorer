# Guia prático: usando o IBM Bob como agente de desenvolvimento

Este guia reúne aprendizados concretos do desenvolvimento do Geo-Explorer com o Bob. Não é uma referência exaustiva — é um registro do que funciona e do que pode sair errado.

---

## 1. Como estruturar pedidos ao agente para obter bom resultado

O Bob é um agente de código, não um intérprete de intenções. Pedidos vagos produzem resultados vagos. Pedidos precisos produzem resultados precisos.

### Diga o que existe, não só o que quer

Ruim:
> "Cria a documentação do projeto."

Bom:
> "Cria README.md na raiz com estas seções nesta ordem: [lista]. Escreve em português. Não inventa funcionalidade que não existe — confere no código antes de descrever."

A segunda versão elimina ambiguidade sobre formato, idioma e o risco mais comum em LLMs: inventar comportamento que não existe.

### Ancore os pedidos no código real

Quando você pede algo sobre o comportamento do sistema, mencione o arquivo relevante:

> "Lê `commands/certificado.ts` e descreve no README o que `parseArgs` realmente faz com a entrada posicional."

Isso força o agente a consultar a fonte antes de escrever. Sem essa âncora, ele pode descrever o que *parece* razoável em vez do que o código *faz*.

### Separe tarefas com naturezas diferentes

Misturar "cria o arquivo X" com "refatora o módulo Y" em um único pedido aumenta a chance de o agente priorizar mal ou perder escopo. Prefira pedidos com uma responsabilidade principal.

### Seja explícito sobre restrições

Se há algo que o agente *não* deve fazer, diga:

> "Não adiciona tratamento de erro para casos que não existem no código atual."  
> "Não refatora nada fora do escopo da correção pedida."

O Bob segue o princípio da mudança mínima, mas é mais seguro enunciar as restrições quando o risco de extrapolação é alto.

---

## 2. Por que verificar antes de criar

O Bob usa ferramentas de leitura de código (`read_file`, `grep`, `FindSymbol`) antes de escrever. Quando essas ferramentas são usadas corretamente, o resultado reflete o estado real do projeto. Quando não são, o agente extrapola — e extrapola com confiança.

### O risco concreto: inventar o que parece razoável

Neste projeto aconteceu: o agente documentou `findTrilha("")` como "comportamento esperado, a CLI valida antes" — sem verificar que o MCP server também chama `findTrilha` e *não* valida a entrada. A justificativa era plausível, mas estava errada.

A correção exigiu: (1) identificar a inconsistência, (2) corrigir a função, (3) corrigir os testes, (4) reescrever a documentação. Tudo isso por uma suposição não verificada.

### O que revisar antes de aprovar uma geração

- **Números**: contagens (quantas trilhas, quantos testes) ficam desatualizadas se o agente não releu o arquivo antes de escrever.
- **Comportamento descrito**: confira se o que o agente escreveu corresponde ao que o código faz — especialmente em documentação técnica e READMEs.
- **Arquivos sobrescritos**: `write_file` substitui o conteúdo existente integralmente. Se você tinha notas ou seções manuais no arquivo, elas somem.
- **Escopo rastejante**: verifique se o agente não tocou em arquivos além dos pedidos.

### Antes de pedir geração de um arquivo que pode já existir

Pergunte ou verifique. Um `read_file` rápido no arquivo-alvo antes de pedir a geração evita sobrescrever trabalho existente. O Bob faz isso automaticamente quando o pedido é explícito ("confere se existe antes de criar"), mas nem sempre faz por iniciativa própria.

---

## 3. Por que revisar o que o agente gera antes de commitar

O agente produz código que compila e testa — mas compilar e testar não é o mesmo que estar correto.

### O que os testes não pegam

Testes verificam contratos que você especificou. Eles não detectam:

- Documentação que descreve comportamento errado (como aconteceu com o modo posicional do `/certificado`).
- Justificativas técnicas incorretas em comentários ou docs.
- Código correto hoje que se tornará problema depois (ex: campo `numero_de_modulos` redundante sem nota de que `modulos.length` é a fonte confiável).

### O que revisar especificamente

**Em código gerado:**
- A lógica resolve o problema ou apenas parece resolver?
- Há efeito colateral não solicitado (renomeação, reorganização, remoção)?
- Os comentários `/* istanbul ignore next */` estão justificados ou estão escondendo código não testado sem razão?

**Em documentação gerada:**
- Cada número bate com o estado real do código?
- O comportamento descrito foi verificado no código ou deduzido?
- Há seções que o agente preencheu com informação que você deveria ter fornecido?

**Antes do commit:**
```bash
git diff          # revise cada linha alterada
npm test          # confirme que os testes passam
npm run build     # confirme que os tipos estão corretos
```

---

## 4. Uso do `.bobignore` para controlar contexto

O arquivo [`.bobignore`](../.bobignore) funciona de forma análoga ao `.gitignore`: lista padrões de arquivos e diretórios que o Bob deve ignorar ao construir contexto sobre o projeto.

### O que está ignorado neste projeto e por quê

```
node_modules          # dependências instaladas — volumosas e irrelevantes para o agente
.env / .env.*         # segredos — nunca devem entrar no contexto
data/cache-progresso/ # dados de runtime — não descrevem a estrutura do código
docs/certificados-emitidos/  # saída gerada pelo sistema — idem
dist/ / build/        # artefatos de compilação — gerados, não fonte
*.log                 # logs de execução
```

### Por que isso importa

O Bob usa o conteúdo dos arquivos para entender o projeto e tomar decisões. Arquivos desnecessários no contexto:

1. **Aumentam o ruído**: o agente pode citar ou referenciar conteúdo irrelevante.
2. **Consomem janela de contexto**: menos espaço para o código que realmente importa.
3. **Criam risco de segredo exposto**: arquivos `.env` no contexto podem ser citados em respostas ou logs.

### Quando atualizar o `.bobignore`

- Ao adicionar um diretório de dados de runtime que o agente não precisa ler.
- Ao adicionar qualquer arquivo com credenciais ou tokens.
- Ao criar diretórios de saída gerada (relatórios, exports, artefatos de build).

A regra prática: se um arquivo *descreve* o sistema, ele pertence ao contexto. Se ele é *produzido* pelo sistema, provavelmente não pertence.

---

## 5. Registro de slash commands locais

Slash commands locais são atalhos de chat que o Bob reconhece quando o projeto está aberto. Eles vivem em [`.bob/commands/`](../.bob/commands/) como arquivos Markdown com um frontmatter YAML.

### Estrutura de um arquivo de comando

```
.bob/commands/<nome>.md
```

```markdown
---
description: <frase curta exibida na lista de comandos>
argument-hint: <sintaxe dos argumentos, exibida como dica>
---
<instruções para o Bob executar quando o comando for invocado>
```

O `$1` nas instruções é substituído pelos argumentos que o usuário digitou após o nome do comando.

### Os três comandos deste projeto

**`/trilha`** — instrui o Bob a executar o script e exibir a saída sem modificação:

```markdown
---
description: Exibe o plano de estudos de uma trilha DIO pela tecnologia
argument-hint: <tecnologia>
---
Execute o seguinte comando no terminal e exiba a saída completa no chat:

npx tsx commands/trilha.ts $1

Mostre o resultado exatamente como retornado pelo comando, preservando a formatação de texto.
```

**`/desafio`** — inclui instruções de interpretação de argumentos porque o nível é opcional e ambíguo:

```markdown
---
description: Gera um desafio de código aleatório para a tecnologia e nível escolhidos
argument-hint: <tecnologia> [nivel]
---
O usuário forneceu os seguintes argumentos: "$1"

Interprete assim:
- O primeiro token é a tecnologia (pode ter múltiplas palavras se estiver entre aspas).
- O último token, se for "básico", "intermediário" ou "avançado" (ou sem acento), é o nível.

Monte e execute o comando abaixo no terminal passando os argumentos separados corretamente:

npx tsx commands/desafio.ts $1
```

**`/certificado`** — instrui o Bob a extrair os valores das aspas antes de montar o comando com flags:

```markdown
---
description: Gera um certificado fictício em markdown com nome do usuário e trilha concluída
argument-hint: "<nome>" "<tecnologia>"
---
O usuário forneceu os seguintes argumentos: $1

Extraia o nome completo entre as primeiras aspas e a tecnologia entre as segundas aspas.
Em seguida, execute o comando abaixo no terminal:

npx tsx commands/certificado.ts --nome "<nome extraído>" --tech "<tecnologia extraída>"
```

### Decisões de design dos comandos

**Por que as instruções variam entre os comandos?**  
Cada comando tem uma superfície de argumentos diferente. `/trilha` tem um único argumento direto — a instrução é simples. `/desafio` tem um argumento opcional ambíguo (o nível pode ser confundido com parte do nome da tecnologia) — a instrução precisa guiar o agente na interpretação. `/certificado` usa flags na chamada real do script, mas o usuário digita com aspas no chat — a instrução faz a conversão.

**Por que usar `npx tsx` em vez de `npm run`?**  
Os slash commands são invocados pelo agente no terminal do projeto. `npx tsx` executa o arquivo TypeScript diretamente, sem depender de um script definido no `package.json`. Isso torna o comando portátil e independente de como o `package.json` evolui.

### Como criar um novo slash command

1. Crie `.bob/commands/<nome>.md`.
2. Adicione o frontmatter com `description` e `argument-hint`.
3. Escreva as instruções — pense no agente como executor: o que ele precisa saber para montar e rodar o comando corretamente?
4. Teste digitando `/<nome> <argumentos>` no chat do Bob com o projeto aberto.

Não há etapa de registro ou reinicialização — o Bob lê os arquivos de `.bob/commands/` automaticamente.
