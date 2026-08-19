import { describe, it, expect } from "vitest";
import {
  normaliseNivel,
  pickRandom,
  DESAFIOS,
  NIVEIS,
  buildOutput,
  Nivel,
} from "../commands/desafio";
import { findTrilha, trilhas } from "../commands/lib/trilhas";

describe("normaliseNivel", () => {
  it("reconhece 'básico' com e sem acento", () => {
    expect(normaliseNivel("básico")).toBe("Básico");
    expect(normaliseNivel("basico")).toBe("Básico");
    expect(normaliseNivel("BÁSICO")).toBe("Básico");
    expect(normaliseNivel("BASICO")).toBe("Básico");
  });

  it("reconhece 'intermediário' com e sem acento", () => {
    expect(normaliseNivel("intermediário")).toBe("Intermediário");
    expect(normaliseNivel("intermediario")).toBe("Intermediário");
    expect(normaliseNivel("INTERMEDIÁRIO")).toBe("Intermediário");
  });

  it("reconhece 'avançado' com e sem acento", () => {
    expect(normaliseNivel("avançado")).toBe("Avançado");
    expect(normaliseNivel("avancado")).toBe("Avançado");
    expect(normaliseNivel("AVANÇADO")).toBe("Avançado");
  });

  it("retorna null para valor inválido", () => {
    expect(normaliseNivel("master")).toBeNull();
    expect(normaliseNivel("")).toBeNull();
    expect(normaliseNivel("senior")).toBeNull();
  });
});

describe("DESAFIOS — pool de desafios", () => {
  it("cada nível tem pelo menos 6 desafios", () => {
    for (const nivel of NIVEIS) {
      expect(DESAFIOS[nivel].length).toBeGreaterThanOrEqual(6);
    }
  });

  it("todos os NIVEIS estão definidos em DESAFIOS", () => {
    for (const nivel of NIVEIS) {
      expect(DESAFIOS).toHaveProperty(nivel);
    }
  });
});

describe("pickRandom", () => {
  it("sempre retorna um elemento do array", () => {
    const arr = [1, 2, 3, 4, 5];
    for (let i = 0; i < 20; i++) {
      expect(arr).toContain(pickRandom(arr));
    }
  });

  it("retorna o único elemento de um array unitário", () => {
    expect(pickRandom(["único"])).toBe("único");
  });
});

describe("buildOutput — geração por tecnologia e nível", () => {
  const trilha = trilhas.find((t) => t.tecnologia === "Java")!;

  it("inclui a tecnologia no cabeçalho (maiúsculas)", () => {
    const output = buildOutput("Intermediário", trilha, "desafio teste");
    expect(output).toContain("JAVA");
  });

  it("inclui o nível informado", () => {
    const output = buildOutput("Básico", trilha, "desafio teste");
    expect(output).toContain("Básico");
  });

  it("inclui o nome da trilha base", () => {
    const output = buildOutput("Intermediário", trilha, "desafio teste");
    expect(output).toContain("Formação Java Developer");
  });

  it("inclui o texto do desafio no enunciado", () => {
    const texto = "Implemente um algoritmo de busca binária.";
    const output = buildOutput("Avançado", trilha, texto);
    expect(output).toContain(texto);
  });

  it("inclui os critérios de avaliação", () => {
    const output = buildOutput("Básico", trilha, "qualquer");
    expect(output).toContain("Código legível e bem estruturado");
    expect(output).toContain("Tratamento de casos extremos");
  });

  it("nível Básico: desafio sorteado está no pool Básico", () => {
    const desafio = pickRandom(DESAFIOS["Básico"]);
    expect(DESAFIOS["Básico"]).toContain(desafio);
  });

  it("nível Intermediário: desafio sorteado está no pool Intermediário", () => {
    const desafio = pickRandom(DESAFIOS["Intermediário"]);
    expect(DESAFIOS["Intermediário"]).toContain(desafio);
  });

  it("nível Avançado: desafio sorteado está no pool Avançado", () => {
    const desafio = pickRandom(DESAFIOS["Avançado"]);
    expect(DESAFIOS["Avançado"]).toContain(desafio);
  });
});

describe("desafio — nível omitido cai no nível da trilha", () => {
  it("trilha JavaScript tem nível Básico quando nível não é informado", () => {
    const trilha = findTrilha("JavaScript")!;
    // Simula o fallback: quando nivel===null usa trilha.nivel
    const nivelFallback = trilha.nivel as Nivel;
    expect(NIVEIS).toContain(nivelFallback);
    expect(nivelFallback).toBe("Básico");
  });

  it("trilha TypeScript tem nível Intermediário quando nível não é informado", () => {
    const trilha = findTrilha("TypeScript")!;
    const nivelFallback = trilha.nivel as Nivel;
    expect(nivelFallback).toBe("Intermediário");
  });
});

describe("desafio — parâmetro ausente", () => {
  it("findTrilha retorna undefined para tecnologia inexistente", () => {
    expect(findTrilha("TechInexistente999")).toBeUndefined();
  });

  it("normaliseNivel retorna null quando nenhum nível é passado (string vazia)", () => {
    expect(normaliseNivel("")).toBeNull();
  });
});
