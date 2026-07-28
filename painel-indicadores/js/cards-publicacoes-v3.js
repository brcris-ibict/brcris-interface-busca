/* ==========================================================================
   Cards de Síntese (KPIs) V2 — Painel de Indicadores de Publicações
   ========================================================================== */

window.PainelCards = (function () {
  "use strict";

  function init() {
    if (window.PainelFiltros) {
      window.PainelFiltros.onChange((filteredData, state) => {
        render(filteredData, state);
      });
    }
  }

  function calculateMetrics(data) {
    const total = data.length;
    if (total === 0) {
      return {
        total: 0,
        lastYearCount: 0,
        lastYear: "-",
        prevYearCount: 0,
        variation: 0,
        topInst: "-",
        topInstPct: 0,
        topType: "-",
        topTypePct: 0,
        totalInsts: 0,
      };
    }

    const years = data.map((d) => d.year);
    const lastYear = Math.max(...years);
    const prevYear = lastYear - 1;
    const lastYearCount = data.filter((d) => d.year === lastYear).length;
    const prevYearCount = data.filter((d) => d.year === prevYear).length;

    let variation = null;
    if (prevYearCount > 0) {
      variation = ((lastYearCount - prevYearCount) / prevYearCount) * 100;
    } else if (
      lastYearCount > 0 &&
      prevYearCount === 0 &&
      years.includes(prevYear)
    ) {
      variation = Infinity;
    }

    // Instituição Principal e Contagem Única
    const instSet = new Set();
    const instCounts = {};

    data.forEach((d) => {
      d.institutions.forEach((inst) => {
        instSet.add(inst);
        instCounts[inst] = (instCounts[inst] || 0) + 1;
      });
    });

    const totalInsts = instSet.size;

    let topInst = "-";
    let topInstCount = 0;
    for (let inst in instCounts) {
      if (instCounts[inst] > topInstCount) {
        topInstCount = instCounts[inst];
        topInst = inst;
      }
    }
    const topInstPct = (topInstCount / total) * 100;

    // Tipo Predominante
    const typesCounts = data.reduce((acc, d) => {
      acc[d.type] = (acc[d.type] || 0) + 1;
      return acc;
    }, {});
    let topType = "-";
    let topTypeCount = 0;
    for (let t in typesCounts) {
      if (typesCounts[t] > topTypeCount) {
        topTypeCount = typesCounts[t];
        topType = t;
      }
    }
    const topTypePct = (topTypeCount / total) * 100;

    return {
      total,
      lastYear,
      lastYearCount,
      prevYear,
      prevYearCount,
      variation,
      topInst,
      topInstPct,
      topType,
      topTypePct,
      topInstCount,
      totalInsts,
    };
  }

  function render(data, state) {
    const container = document.querySelector("[data-summary-cards]");
    if (!container)
      throw new Error("Contêiner [data-summary-cards] não encontrado.");

    if (data.length === 0) {
      container.innerHTML = `
        <div class="alert alert-warning" role="alert" style="grid-column: 1 / -1;">
          Nenhuma publicação foi encontrada para os filtros selecionados.
        </div>
      `;
      return;
    }

    const m = calculateMetrics(data);
    const fNum = (n) => n.toLocaleString("pt-BR");
    const fPct = (n) =>
      n.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%";
    const shorten = (str, max) =>
      str.length > max ? str.substring(0, max) + "..." : str;

    const yearLabel =
      m.lastYear !== "-" ? `Publicações em ${m.lastYear}` : `Último Ano`;

    let variationVal = "-";
    let variationContext = `Em relação a ${m.prevYear}`;
    let variationColor = "var(--painel-text)";

    if (m.variation === null) {
      variationVal = "-";
      variationContext = "Sem ano anterior para comparar";
    } else if (m.variation === Infinity) {
      variationVal = "N/A";
      variationContext = "Ano anterior era zero";
    } else {
      const isPositive = m.variation > 0;
      const isNegative = m.variation < 0;
      const sign = isPositive ? "+" : "";
      variationVal = `${sign}${fPct(m.variation)}`;

      if (isPositive) variationColor = "#198754"; // Bootstrap Success
      if (isNegative) variationColor = "#dc3545"; // Bootstrap Danger
    }

    const metrics = [
      {
        label: "Total de Publicações",
        value: fNum(m.total),
        context: "No recorte selecionado",
        color: null,
      },
      {
        label: yearLabel,
        value: fNum(m.lastYearCount),
        context: "Último ano do recorte",
        color: null,
      },
      {
        label: "Variação Anual",
        value: variationVal,
        context: variationContext,
        color: variationColor,
      },
      {
        label: "Instituições Representadas",
        value: fNum(m.totalInsts),
        context: "Quantidade de instituições associadas",
        color: null,
      },
      {
        label: "Tipo Predominante",
        value: m.topType,
        context: `${fPct(m.topTypePct)} das publicações`,
        color: null,
      },
    ];

    container.innerHTML = metrics
      .map(
        (metric) => `
      <article class="painel-publicacoes__kpi painel-kpi-card" tabindex="0">
        <p class="painel-publicacoes__kpi-label painel-kpi-title">${metric.label}</p>
        <p class="painel-publicacoes__kpi-value painel-kpi-value" ${metric.color ? `style="color: ${metric.color};"` : ""}>${metric.value}</p>
        <p class="painel-publicacoes__kpi-context painel-kpi-meta">${metric.context}</p>
      </article>
    `,
      )
      .join("");
  }

  return { init, render };
})();
