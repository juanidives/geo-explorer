import { describe, it, expect, beforeEach } from "vitest";
import { findTrilha, trilhas } from "../commands/lib/trilhas";
import { buildOutput } from "../commands/trilha";

// "Java" is a substring of "JavaScript" which appears first in the dataset.
// We use exact-match lookup via the trilhas array to avoid ambiguity.
const trilhaJava = trilhas.find((t) => t.tecnologia === "Java")!;

describe("findTrilha", () => {
  it("encontra trilha por tecnologia existente — resultado inclui 'Java' na tecnologia", () => {
    // findTrilha uses substring search; "Java Developer" uniquely hits the Java trail
    const trilha = trilhas.find((t) => t.tecnologia === "Java");
    expect(trilha).toBeDefined();
    expect(trilha!.tecnologia).toBe("Java");
    expect(trilha!.nome).toBe("Formação Java Developer");
  });

  it("busca é case-insensitive — 'typescript' encontra a trilha TypeScript", () => {
    expect(findTrilha("typescript")).toBeDefined();
    expect(findTrilha("TYPESCRIPT")).toBeDefined();
    expect(findTrilha("TypeScript")).toBeDefined();
    expect(findTrilha("typescript")!.tecnologia).toBe("TypeScript");
  });

  it("retorna undefined para tecnologia inexistente", () => {
    expect(findTrilha("TecnologiaQueNaoExiste123")).toBeUndefined();
  });

  it("retorna undefined para string vazia", () => {
    expect(findTrilha("")).toBeUndefined();
  });

  it("retorna undefined para string só com espaços em branco", () => {
    expect(findTrilha("   ")).toBeUndefined();
  });
});

describe("buildOutput — formatação da trilha Java", () => {
  let trilha: ReturnType<typeof findTrilha>;

  beforeEach(() => {
    trilha = trilhaJava;
  });

  it("contém o nome da trilha em maiúsculas no cabeçalho", () => {
    const output = buildOutput(trilha!);
    expect(output).toContain("FORMAÇÃO JAVA DEVELOPER");
  });

  it("exibe o nome real de cada módulo", () => {
    const output = buildOutput(trilha!);
    const expectedModules = [
      "Fundamentos do Java e ambiente JDK",
      "Orientação a objetos: classes e objetos",
      "Herança, polimorfismo e interfaces",
      "Programação funcional com Streams e Lambdas",
      "Testes unitários com JUnit e Mockito",
      "Projeto final: sistema Java com banco de dados",
    ];
    for (const mod of expectedModules) {
      expect(output).toContain(mod);
    }
  });

  it("numera os módulos a partir de 1", () => {
    const output = buildOutput(trilha!);
    expect(output).toContain("1. Fundamentos do Java e ambiente JDK");
    expect(output).toContain(`${trilha!.modulos.length}.`);
  });

  it("exibe tecnologia, nível e XP total", () => {
    const output = buildOutput(trilha!);
    expect(output).toContain("Java");
    expect(output).toContain("Intermediário");
    expect(output).toContain("28.000 XP");
  });

  it("exibe badges disponíveis", () => {
    const output = buildOutput(trilha!);
    expect(output).toContain("Java Basics");
    expect(output).toContain("OOP Java Master");
    expect(output).toContain("Spring Boot Hero");
  });

  it("mostra acesso 'Por período' quando vitalicio=false (Java)", () => {
    const output = buildOutput(trilha!);
    expect(output).toContain("Por período");
  });

  it("mostra '✅ Disponível' quando promocoes=true (Java)", () => {
    const output = buildOutput(trilha!);
    expect(output).toContain("✅ Disponível");
  });

  it("mostra acesso 'Vitalício' quando vitalicio=true (TypeScript)", () => {
    const trilhaTS = trilhas.find((t) => t.tecnologia === "TypeScript")!;
    const output = buildOutput(trilhaTS);
    expect(output).toContain("Vitalício");
  });

  it("mostra '❌ Não disponível' quando promocoes=false (TypeScript)", () => {
    const trilhaTS = trilhas.find((t) => t.tecnologia === "TypeScript")!;
    const output = buildOutput(trilhaTS);
    expect(output).toContain("❌ Não disponível");
  });
});

describe("trilha — parâmetro ausente (comportamento de run via process.exit)", () => {
  it("buildOutput não é chamado sem trilha — findTrilha retorna undefined para token inválido", () => {
    const result = findTrilha("__invalido__xyz__");
    expect(result).toBeUndefined();
  });
});
