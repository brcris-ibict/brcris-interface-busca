/* ==========================================================================
   Módulo de Dados V2 — Geração Determinística e Plausível
   ========================================================================== */

window.PainelDados = (function () {
  "use strict";

  const isDemoData = true;

  // LCG (Linear Congruential Generator) simples para determinismo
  let _seed = 123456789;
  function random() {
    _seed = (_seed * 9301 + 49297) % 233280;
    return _seed / 233280;
  }

  // Helper para distribuição baseada em peso
  function weightedRandom(weights) {
    let sum = weights.reduce((a, b) => a + b.weight, 0);
    let r = random() * sum;
    for (let i = 0; i < weights.length; i++) {
      if (r < weights[i].weight) return weights[i].value;
      r -= weights[i].weight;
    }
    return weights[0].value;
  }

  function gerarDadosFicticios(quantidade = 5000) {
    const dados = [];

    const weightTypes = [
      { value: "Artigo", weight: 60 },
      { value: "Trabalho em Evento", weight: 20 },
      { value: "Dissertação", weight: 10 },
      { value: "Tese", weight: 5 },
      { value: "Capítulo de Livro", weight: 3 },
      { value: "Livro", weight: 2 },
    ];

    const weightLangs = [
      { value: "Português", weight: 75 },
      { value: "Inglês", weight: 20 },
      { value: "Espanhol", weight: 5 },
    ];

    const weightInsts = [
      { value: "Universidade de São Paulo (USP)", weight: 15 },
      { value: "Universidade Estadual de Campinas (UNICAMP)", weight: 8 },
      { value: "Universidade Federal do Rio de Janeiro (UFRJ)", weight: 7 },
      { value: "Fundação Oswaldo Cruz (FIOCRUZ)", weight: 7 },
      { value: "Universidade Estadual Paulista (UNESP)", weight: 6 },
      { value: "Universidade Federal de Minas Gerais (UFMG)", weight: 5 },
      { value: "Universidade de Brasília (UnB)", weight: 4 },
      { value: "Universidade Federal do Rio Grande do Sul (UFRGS)", weight: 4 },
      { value: "Universidade Federal de Santa Catarina (UFSC)", weight: 3 },
      { value: "Universidade Federal do Paraná (UFPR)", weight: 3 },
      { value: "Universidade Federal de Pernambuco (UFPE)", weight: 2 },
      {
        value: "Empresa Brasileira de Pesquisa Agropecuária (EMBRAPA)",
        weight: 2,
      },
      { value: "Instituto Tecnológico de Aeronáutica (ITA)", weight: 1 },
    ];

    const weightJournals = [
      { value: "Revista Brasileira de Ensino de Física", weight: 10 },
      { value: "Ciência & Saúde Coletiva", weight: 9 },
      { value: "Revista de Saúde Pública", weight: 8 },
      { value: "Cadernos de Saúde Pública", weight: 7 },
      { value: "Revista Brasileira de Enfermagem", weight: 6 },
      { value: "Química Nova", weight: 5 },
      {
        value: "Revista da Sociedade Brasileira de Medicina Tropical",
        weight: 5,
      },
      { value: "Educação em Revista", weight: 4 },
      { value: "Revista Brasileira de Educação", weight: 4 },
      { value: "Pesquisa Agropecuária Brasileira", weight: 3 },
    ];

    // Distribuição de anos plausível
    const yearsDistribution = [
      { value: 2018, weight: 5 },
      { value: 2019, weight: 7 },
      { value: 2020, weight: 9 }, // pandemia (queda pequena ou estabilidade)
      { value: 2021, weight: 12 },
      { value: 2022, weight: 25 },
      { value: 2023, weight: 28 }, // pico
      { value: 2024, weight: 14 }, // queda natural do atraso de indexação (delay)
    ];

    for (let i = 1; i <= quantidade; i++) {
      let type = weightedRandom(weightTypes);
      let year = weightedRandom(yearsDistribution);

      let numLangs = random() > 0.95 ? 2 : 1;
      let langs = [];
      while (langs.length < numLangs) {
        let l = weightedRandom(weightLangs);
        if (!langs.includes(l)) langs.push(l);
      }

      let numInsts = random() > 0.8 ? (random() > 0.5 ? 3 : 2) : 1;
      let insts = [];
      while (insts.length < numInsts) {
        let ins = weightedRandom(weightInsts);
        if (!insts.includes(ins)) insts.push(ins);
      }

      let journal = null;
      if (type === "Artigo") {
        if (random() > 0.4) {
          journal = weightedRandom(weightJournals);
        } else {
          journal = "Outros Periódicos Diversos";
        }
      }

      dados.push({
        id: `PUB-${year}-${i}`,
        year: year,
        type: type,
        languages: langs,
        institutions: insts,
        journal: journal,
      });
    }

    return dados;
  }

  let cache = null;

  function getAll() {
    if (!cache) {
      cache = gerarDadosFicticios(5000);
    }
    return cache;
  }

  return { getAll, isDemoData };
})();
