import { describe, it, expect } from "vitest";
import {
  parseArgs,
  generateCertId,
  formatDate,
  buildCertificate,
} from "../commands/certificado";
import { findTrilha, trilhas } from "../commands/lib/trilhas";

// Exact-match helpers to avoid "Java" matching "JavaScript" (substring search)
const trilhaJava = trilhas.find((t) => t.tecnologia === "Java")!;
const trilhaDataScience = trilhas.find((t) =>
  t.tecnologia.includes("Data Science")
)!;

describe("parseArgs", () => {
  it("extrai nome e tecnologia com flags --nome e --tech", () => {
    const result = parseArgs(["--nome", "Maria Silva", "--tech", "TypeScript"]);
    expect(result).toEqual({ nome: "Maria Silva", tecnologia: "TypeScript" });
  });

  it("suporta tecnologia com espaço no nome (ex: 'Data Science')", () => {
    const result = parseArgs(["--nome", "João", "--tech", "Data", "Science"]);
    // --tech collects all tokens after it until end (--nome comes before here, so no cut-off)
    expect(result).toEqual({ nome: "João", tecnologia: "Data Science" });
  });

  it("suporta nome multi-palavra quando --nome vem antes de --tech", () => {
    const result = parseArgs([
      "--nome",
      "Ana",
      "Paula",
      "--tech",
      "JavaScript",
    ]);
    expect(result).toEqual({ nome: "Ana Paula", tecnologia: "JavaScript" });
  });

  it("retorna null quando --nome está ausente e não há posicional suficiente", () => {
    expect(parseArgs(["--tech", "Java"])).toBeNull();
  });

  it("retorna null quando --tech está ausente e não há posicional suficiente", () => {
    expect(parseArgs(["--nome", "Carlos"])).toBeNull();
  });

  it("retorna null para array vazio", () => {
    expect(parseArgs([])).toBeNull();
  });

  it("retorna null para apenas um argumento posicional", () => {
    expect(parseArgs(["Maria"])).toBeNull();
  });

  it("fallback posicional com dois args", () => {
    const result = parseArgs(["Maria", "TypeScript"]);
    expect(result).toEqual({ nome: "Maria", tecnologia: "TypeScript" });
  });
});

describe("generateCertId", () => {
  it("gera ID com prefixo DIO-", () => {
    const id = generateCertId("Maria", 9);
    expect(id).toMatch(/^DIO-/);
  });

  it("inclui o id da trilha com padding de 3 dígitos", () => {
    expect(generateCertId("X", 1)).toContain("DIO-001-");
    expect(generateCertId("X", 9)).toContain("DIO-009-");
  });

  it("é determinístico: mesma entrada gera mesmo ID", () => {
    const a = generateCertId("Maria Silva", 9);
    const b = generateCertId("Maria Silva", 9);
    expect(a).toBe(b);
  });

  it("entradas diferentes geram IDs diferentes", () => {
    const a = generateCertId("Maria", 9);
    const b = generateCertId("João", 9);
    expect(a).not.toBe(b);
  });
});

describe("formatDate", () => {
  it("formata no padrão pt-BR (dia extenso, mês por extenso, ano)", () => {
    const date = new Date(2024, 0, 15); // 15 de janeiro de 2024
    const formatted = formatDate(date);
    expect(formatted).toMatch(/15/);
    expect(formatted).toMatch(/2024/);
    // Deve conter algum mês em português
    expect(formatted).toMatch(/janeiro/i);
  });
});

describe("buildCertificate — geração com nome e tecnologia", () => {
  it("inclui o nome do usuário no certificado", () => {
    const cert = buildCertificate("Maria Silva", trilhaJava);
    expect(cert).toContain("Maria Silva");
  });

  it("inclui o nome da trilha", () => {
    const cert = buildCertificate("Maria Silva", trilhaJava);
    expect(cert).toContain("Formação Java Developer");
  });

  it("inclui a tecnologia da trilha", () => {
    const cert = buildCertificate("Maria Silva", trilhaJava);
    expect(cert).toContain("Java");
  });

  it("inclui o nível da trilha", () => {
    const cert = buildCertificate("Maria Silva", trilhaJava);
    expect(cert).toContain("Intermediário");
  });

  it("inclui o ID do certificado (DIO-XXX-XXXXXXXX)", () => {
    const cert = buildCertificate("Maria Silva", trilhaJava);
    expect(cert).toMatch(/DIO-\d{3}-[0-9A-F]{8}/);
  });

  it("tecnologia com espaço no nome: 'Data Science' (Python / Data Science)", () => {
    expect(trilhaDataScience).toBeDefined();
    expect(trilhaDataScience.tecnologia).toContain("Data Science");
    const cert = buildCertificate("Ana Lima", trilhaDataScience);
    expect(cert).toContain("Ana Lima");
    expect(cert).toContain("Formação Data Science");
    expect(cert).toContain("Python / Data Science");
  });

  it("inclui as badges da trilha Data Science", () => {
    const cert = buildCertificate("Ana Lima", trilhaDataScience);
    expect(cert).toContain("Data Analyst");
    expect(cert).toContain("Pandas Expert");
    expect(cert).toContain("Data Scientist");
  });

  it("inclui o XP total formatado (Java: 28.000 XP)", () => {
    const cert = buildCertificate("Teste", trilhaJava); // xp_total: 28000
    expect(cert).toContain("28.000 XP");
  });
});

describe("certificado — parâmetros ausentes ou incompletos", () => {
  it("parseArgs retorna null para flags presentes mas valores vazios (--nome sem valor antes de --tech)", () => {
    // ["--nome", "--tech", "Java"] → nome coletado = "" (vazio), retorna null
    const result = parseArgs(["--nome", "--tech", "Java"]);
    expect(result).toBeNull();
  });

  it("parseArgs retorna null para apenas --tech sem --nome e sem posicional suficiente", () => {
    expect(parseArgs(["--tech"])).toBeNull();
  });

  it("parseArgs retorna null para apenas --nome sem --tech e sem posicional suficiente", () => {
    expect(parseArgs(["--nome", "Maria"])).toBeNull();
  });
});
