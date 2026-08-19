---
description: Gera um desafio de código aleatório para a tecnologia e nível escolhidos
argument-hint: <tecnologia> [nivel]
---
O usuário forneceu os seguintes argumentos: "$1"

Interprete assim:
- O primeiro token é a tecnologia (pode ter múltiplas palavras se estiver entre aspas).
- O último token, se for "básico", "intermediário" ou "avançado" (ou sem acento), é o nível.

Monte e execute o comando abaixo no terminal passando os argumentos separados corretamente:

```
npx tsx commands/desafio.ts $1
```

Exiba a saída completa no chat, preservando a formatação de texto.
