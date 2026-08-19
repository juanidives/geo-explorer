#!/usr/bin/env node
/**
 * Geo-Explorer MCP Server
 *
 * Exposes the Geo-Explorer learning platform as MCP tools so that any
 * MCP-compatible client (Bob, Claude Desktop, etc.) can invoke them.
 *
 * Tools:
 *   - listar_tecnologias  — lists all available technologies
 *   - buscar_trilha       — returns the study plan for a technology
 *   - gerar_desafio       — generates a coding challenge by technology and level
 *   - gerar_certificado   — issues a Markdown certificate
 *
 * Transport: stdio (spawned as a child process by the MCP host).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ── Reuse existing command logic ──────────────────────────────────────────────
import { findTrilha, trilhas } from "../../commands/lib/trilhas";
import { buildOutput as buildTrilhaOutput } from "../../commands/trilha";
import {
  NIVEIS,
  DESAFIOS,
  normaliseNivel,
  pickRandom,
  buildOutput as buildDesafioOutput,
} from "../../commands/desafio";
import { buildCertificate } from "../../commands/certificado";

// ── Server setup ──────────────────────────────────────────────────────────────
const server = new McpServer({
  name: "geo-explorer",
  version: "0.1.0",
});

/**
 * Typed helper that wraps McpServer.tool() and accepts raw Zod shape objects.
 * The `as any` cast avoids TS2589 (type instantiation too deep) triggered by
 * the SDK's complex ZodRawShapeCompat union type when combined with Zod v3.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registerTool = (server.tool as any).bind(server) as (
  name: string,
  description: string,
  schema: Record<string, z.ZodTypeAny>,
  handler: (args: Record<string, unknown>) => Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }>
) => void;

// ── Tool: listar_tecnologias ───────────────────────────────────────────────────
server.tool(
  "listar_tecnologias",
  "Lista todas as tecnologias disponíveis no Geo-Explorer com seu nível e XP total.",
  async () => {
    const lines = trilhas.map(
      (t) =>
        `• ${t.tecnologia} — ${t.nivel} — ${t.xp_total.toLocaleString("pt-BR")} XP`
    );
    const text =
      `Tecnologias disponíveis (${trilhas.length}):\n\n` + lines.join("\n");
    return { content: [{ type: "text" as const, text }] };
  }
);

// ── Tool: buscar_trilha ───────────────────────────────────────────────────────
registerTool(
  "buscar_trilha",
  "Retorna o plano de estudos completo de uma tecnologia (módulos, badges, XP, nível).",
  {
    tecnologia: z
      .string()
      .min(1)
      .describe("Nome (ou parte do nome) da tecnologia. Ex: 'javascript', 'python'."),
  },
  async ({ tecnologia }) => {
    const trilha = findTrilha(String(tecnologia));
    if (!trilha) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Nenhuma trilha encontrada para "${tecnologia}". Use listar_tecnologias para ver as opções disponíveis.`,
          },
        ],
        isError: true,
      };
    }
    return {
      content: [{ type: "text" as const, text: buildTrilhaOutput(trilha) }],
    };
  }
);

// ── Tool: gerar_desafio ───────────────────────────────────────────────────────
registerTool(
  "gerar_desafio",
  "Gera um desafio de código aleatório para uma tecnologia e nível. O nível é opcional — se omitido, usa o nível da trilha.",
  {
    tecnologia: z
      .string()
      .min(1)
      .describe("Nome da tecnologia. Ex: 'typescript', 'java'."),
    nivel: z
      .enum(["Básico", "Intermediário", "Avançado", "basico", "intermediario", "avancado"])
      .optional()
      .describe("Nível de dificuldade: Básico | Intermediário | Avançado (com ou sem acento)."),
  },
  async ({ tecnologia, nivel }) => {
    const trilha = findTrilha(String(tecnologia));
    if (!trilha) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Nenhuma trilha encontrada para "${tecnologia}". Use listar_tecnologias para ver as opções disponíveis.`,
          },
        ],
        isError: true,
      };
    }

    let nivelFinal = nivel ? normaliseNivel(String(nivel)) : null;
    if (!nivelFinal) {
      nivelFinal = NIVEIS.includes(trilha.nivel as (typeof NIVEIS)[number])
        ? (trilha.nivel as (typeof NIVEIS)[number])
        : "Intermediário";
    }

    const desafio = pickRandom(DESAFIOS[nivelFinal]);
    return {
      content: [
        {
          type: "text" as const,
          text: buildDesafioOutput(nivelFinal, trilha, desafio),
        },
      ],
    };
  }
);

// ── Tool: gerar_certificado ───────────────────────────────────────────────────
registerTool(
  "gerar_certificado",
  "Emite um certificado em Markdown para o estudante que concluiu uma trilha.",
  {
    nome: z
      .string()
      .min(1)
      .describe("Nome completo do estudante. Ex: 'Ana Lima'."),
    tecnologia: z
      .string()
      .min(1)
      .describe("Tecnologia da trilha concluída. Ex: 'TypeScript'."),
  },
  async ({ nome, tecnologia }) => {
    const trilha = findTrilha(String(tecnologia));
    if (!trilha) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Nenhuma trilha encontrada para "${tecnologia}". Use listar_tecnologias para ver as opções disponíveis.`,
          },
        ],
        isError: true,
      };
    }
    return {
      content: [
        { type: "text" as const, text: buildCertificate(String(nome), trilha) },
      ],
    };
  }
);

// ── Start ─────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("geo-explorer MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
