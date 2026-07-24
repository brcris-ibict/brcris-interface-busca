/* ==========================================================================
   Gráficos V2 — Painel de Indicadores de Publicações (100% Stacked & Insights)
   ========================================================================== */

window.PainelGraficos = (function () {
  "use strict";

  const chartInstances = new Map();
  let resizeObservers = new Map();

  function init() {
    if (window.PainelFiltros) {
      window.PainelFiltros.onChange((filteredData, state) => {
        render(filteredData);
      });
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-theme") {
          recreateCharts();
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
  }

  function getTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }
  
  function getPalette() {
    const isDark = getTheme() === "dark";
    return {
      text: isDark ? "#dee2e6" : "#212529",
      muted: isDark ? "#adb5bd" : "#6c757d",
      border: isDark ? "#495057" : "#dee2e6",
      institutions: isDark ? "#4892c5" : "#0f619e",
      languages: isDark ? "#a78bfa" : "#6f42c1",
      evolution: isDark ? "#6ea8fe" : "#0d6efd",
      types: {
        "Artigo": isDark ? "#6ea8fe" : "#0d6efd",
        "Trabalho em Evento": isDark ? "#75b798" : "#198754",
        "Dissertação": isDark ? "#ffb347" : "#fd7e14",
        "Tese": isDark ? "#a78bfa" : "#6f42c1",
        "Capítulo de Livro": isDark ? "#6edff6" : "#0dcaf0",
        "Livro": isDark ? "#e83e8c" : "#d63384",
        "Outros": isDark ? "#ced4da" : "#6c757d"
      }
    };
  }

  function getTypeColor(type) {
    const p = getPalette().types;
    return p[type] || p["Outros"];
  }

  function getChart(id) {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Contêiner ${id} não encontrado.`);
    let chart = echarts.getInstanceByDom(element);
    if (!chart) {
      chart = echarts.init(element, getTheme() === "dark" ? "dark" : null, { renderer: "svg" });
    }
    chartInstances.set(id, chart);

    if (!resizeObservers.has(id)) {
      const ro = new ResizeObserver(() => chart.resize());
      ro.observe(element);
      resizeObservers.set(id, ro);
    }
    return chart;
  }
  
  function showComponentError(componentName) {
    const el = document.getElementById(componentName);
    if (el) {
      el.innerHTML = `<div class="d-flex align-items-center justify-content-center h-100 w-100 text-muted p-3 text-center" style="border: 1px dashed var(--painel-border); border-radius: 4px;">Não foi possível carregar este gráfico.</div>`;
    }
  }

  function safeRender(componentName, callback) {
    try { callback(); } catch (error) {
      console.error(`[Painel Publicações] Falha em ${componentName}:`, error);
      showComponentError(componentName);
    }
  }

  // Helpers for Insights
  function setInsight(chartId, text) {
    const chartDiv = document.getElementById(chartId);
    if (!chartDiv) return;
    let insightDiv = chartDiv.parentElement.querySelector('.painel-insight');
    if (!insightDiv) {
      insightDiv = document.createElement('p');
      insightDiv.className = 'painel-insight';
      chartDiv.parentElement.appendChild(insightDiv);
    }
    insightDiv.innerHTML = text;
  }

  function clearInsight(chartId) {
    const chartDiv = document.getElementById(chartId);
    if (!chartDiv) return;
    const insightDiv = chartDiv.parentElement.querySelector('.painel-insight');
    if (insightDiv) insightDiv.remove();
  }

  let lastData = [];
  function render(data) {
    lastData = data;
    const gSection = document.getElementById("graficos-section");
    if (!gSection) return;

    if (data.length === 0) {
      chartInstances.forEach((chart, id) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<div class="d-flex align-items-center justify-content-center h-100 w-100 text-muted">Sem dados para exibir</div>`;
        clearInsight(id);
      });
      const tbody = document.querySelector("#journal-table tbody");
      if (tbody) tbody.innerHTML = `<tr><td colspan="2" class="text-center text-muted p-3">Nenhuma publicação encontrada.</td></tr>`;
      return;
    } else {
      gSection.hidden = false;
    }

    safeRender('chart-evolution', () => renderG1_EvolucaoAnual(data));
    safeRender('chart-type-evolution', () => renderG5_EvolucaoTipo100(data));
    safeRender('chart-types', () => renderG2_ComposicaoTipo(data));
    safeRender('chart-languages', () => renderG3_Idioma(data));
    safeRender('chart-institutions', () => renderG4_InstituicoesTop10(data));
    safeRender('journal-table', () => renderTabelaPeriodicos(data));
  }

  function recreateCharts() {
    chartInstances.forEach(chart => chart.dispose());
    chartInstances.clear();
    resizeObservers.forEach(ro => ro.disconnect());
    resizeObservers.clear();
    if (lastData.length > 0) render(lastData);
  }

  function renderG1_EvolucaoAnual(data) {
    const chart = getChart("chart-evolution");
    chart.clear();

    const countsByYear = data.reduce((acc, d) => {
      acc[d.year] = (acc[d.year] || 0) + 1;
      return acc;
    }, {});
    const years = Object.keys(countsByYear).sort((a,b) => a - b);
    const counts = years.map(y => countsByYear[y]);
    const palette = getPalette();

    chart.setOption({
      backgroundColor: 'transparent',
      color: [palette.evolution],
      tooltip: { trigger: "axis" },
      grid: { left: 50, right: 20, top: 20, bottom: 30 },
      xAxis: { type: "category", data: years, axisLine: { lineStyle: { color: palette.border } }, axisLabel: { color: palette.muted } },
      yAxis: { type: "value", axisLine: { show: false }, splitLine: { lineStyle: { color: palette.border } }, axisLabel: { color: palette.muted } },
      series: [{ type: "line", data: counts, symbol: "circle", symbolSize: 6, lineStyle: { width: 3 }, areaStyle: { opacity: 0.1 } }]
    }, true);
    chart.resize();

    // Insight
    const maxYear = years[counts.indexOf(Math.max(...counts))];
    const maxCount = Math.max(...counts);
    setInsight("chart-evolution", `O maior volume no período selecionado ocorreu em <strong>${maxYear}</strong>, com ${maxCount.toLocaleString('pt-BR')} registros disponiveis.`);
  }

  function renderG5_EvolucaoTipo100(data) {
    const chart = getChart("chart-type-evolution");
    chart.clear();

    const aggr = {};
    const typeSet = new Set();
    const yearTotals = {};

    data.forEach(d => {
      if (!aggr[d.year]) {
        aggr[d.year] = {};
        yearTotals[d.year] = 0;
      }
      aggr[d.year][d.type] = (aggr[d.year][d.type] || 0) + 1;
      yearTotals[d.year]++;
      typeSet.add(d.type);
    });

    const years = Object.keys(aggr).sort((a,b) => a - b);
    const types = Array.from(typeSet).sort();
    const palette = getPalette();

    const series = types.map(t => {
      const dataArr = years.map(y => {
        const absolute = aggr[y][t] || 0;
        const total = yearTotals[y];
        return {
          value: total > 0 ? ((absolute / total) * 100) : 0,
          absoluteValue: absolute,
          yearTotal: total
        };
      });
      return {
        name: t,
        type: 'bar',
        stack: 'total',
        barWidth: '60%',
        itemStyle: { color: getTypeColor(t) },
        data: dataArr
      };
    });

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: { 
        trigger: "axis", 
        axisPointer: { type: "shadow" },
        formatter: function(params) {
          let html = `<strong>${params[0].axisValueLabel}</strong><br/>`;
          params.forEach(p => {
            if (p.data.value > 0) {
              const valPct = p.data.value.toLocaleString('pt-BR', {maximumFractionDigits: 1});
              const valAbs = p.data.absoluteValue.toLocaleString('pt-BR');
              html += `<div style="display:flex; justify-content:space-between; gap:15px;">
                         <span>${p.marker} ${p.seriesName}</span>
                         <span style="font-weight:bold;">${valPct}% (${valAbs})</span>
                       </div>`;
            }
          });
          return html;
        }
      },
      legend: { bottom: 0, textStyle: { color: palette.muted } },
      grid: { left: 50, right: 20, top: 20, bottom: 60 },
      xAxis: { type: "category", data: years, axisLine: { lineStyle: { color: palette.border } }, axisLabel: { color: palette.muted } },
      yAxis: { 
        type: "value", 
        max: 100, 
        axisLabel: { formatter: '{value} %', color: palette.muted },
        splitLine: { lineStyle: { color: palette.border } } 
      },
      series: series
    }, true);
    chart.resize();
    
    setInsight("chart-type-evolution", `A visualização em % permite entender como a proporção dos tipos de documentos mudou ao longo do tempo, isolando o crescimento do volume total.`);
  }

  function renderG2_ComposicaoTipo(data) {
    const chart = getChart("chart-types");
    chart.clear();

    const counts = data.reduce((acc, d) => { acc[d.type] = (acc[d.type] || 0) + 1; return acc; }, {});
    const sorted = Object.entries(counts).sort((a,b) => a[1] - b[1]); 
    const types = sorted.map(i => i[0]);
    const vals = sorted.map(i => i[1]);
    const palette = getPalette();

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { left: 140, right: 30, top: 10, bottom: 30 },
      xAxis: { type: "value", splitLine: { lineStyle: { color: palette.border } }, axisLabel: { color: palette.muted } },
      yAxis: { type: "category", data: types, axisLine: { lineStyle: { color: palette.border } }, axisLabel: { color: palette.muted, width: 130, overflow: 'truncate' } },
      series: [{ 
        type: "bar", 
        data: vals.map((v, idx) => ({ value: v, itemStyle: { color: getTypeColor(types[idx]) } })),
        label: { show: true, position: 'right', color: palette.muted } 
      }]
    }, true);
    chart.resize();

    const topT = sorted[sorted.length-1];
    if (topT) {
      const pct = ((topT[1] / data.length) * 100).toLocaleString('pt-BR', {maximumFractionDigits:1});
      setInsight("chart-types", `<strong>${topT[0]}s</strong> representam ${pct}% das publicações no recorte selecionado.`);
    }
  }

  function renderG3_Idioma(data) {
    const chart = getChart("chart-languages");
    chart.clear();

    const counts = data.reduce((acc, d) => { d.languages.forEach(l => acc[l] = (acc[l] || 0) + 1); return acc; }, {});
    const sorted = Object.entries(counts).sort((a,b) => a[1] - b[1]);
    const langs = sorted.map(i => i[0]);
    const vals = sorted.map(i => i[1]);
    const palette = getPalette();

    chart.setOption({
      backgroundColor: 'transparent',
      color: [palette.languages],
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { left: 80, right: 30, top: 10, bottom: 30 },
      xAxis: { type: "value", splitLine: { lineStyle: { color: palette.border } }, axisLabel: { color: palette.muted } },
      yAxis: { type: "category", data: langs, axisLine: { lineStyle: { color: palette.border } }, axisLabel: { color: palette.muted } },
      series: [{ type: "bar", data: vals, label: { show: true, position: 'right', color: palette.muted } }]
    }, true);
    chart.resize();
  }

  function renderG4_InstituicoesTop10(data) {
    const chart = getChart("chart-institutions");
    chart.clear();

    const counts = data.reduce((acc, d) => { d.institutions.forEach(inst => acc[inst] = (acc[inst] || 0) + 1); return acc; }, {});
    const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 10);
    const reverseSorted = [...sorted].reverse();
    const insts = reverseSorted.map(i => i[0].split('(')[1] ? i[0].split('(')[1].replace(')', '') : i[0].substring(0,25));
    const vals = reverseSorted.map(i => i[1]);
    const palette = getPalette();

    chart.setOption({
      backgroundColor: 'transparent',
      color: [palette.institutions],
      tooltip: { 
        trigger: "axis", 
        axisPointer: { type: "shadow" },
        formatter: (params) => `<strong>${reverseSorted[params[0].dataIndex][0]}</strong><br/>Associações: ${params[0].value}`
      },
      grid: { left: 120, right: 30, top: 10, bottom: 30 },
      xAxis: { type: "value", splitLine: { lineStyle: { color: palette.border } }, axisLabel: { color: palette.muted } },
      yAxis: { type: "category", data: insts, axisLine: { lineStyle: { color: palette.border } }, axisLabel: { color: palette.muted, width: 110, overflow: 'truncate' } },
      series: [{ type: "bar", data: vals, label: { show: true, position: 'right', color: palette.muted } }]
    }, true);
    chart.resize();

    const top5Total = sorted.slice(0, 5).reduce((sum, item) => sum + item[1], 0);
    const allAssoc = Object.values(counts).reduce((sum, item) => sum + item, 0);
    const top5Pct = ((top5Total / allAssoc) * 100).toLocaleString('pt-BR', {maximumFractionDigits:1});
    setInsight("chart-institutions", `As cinco instituições com maior presença concentram <strong>${top5Pct}%</strong> das ${allAssoc.toLocaleString('pt-BR')} associações do recorte.`);
  }

  function renderTabelaPeriodicos(data) {
    const tbody = document.querySelector("#journal-table tbody");
    if (!tbody) throw new Error("tbody da tabela de periódicos não encontrado.");

    const artigos = data.filter(d => d.type === "Artigo" && d.journal);
    const counts = artigos.reduce((acc, d) => { acc[d.journal] = (acc[d.journal] || 0) + 1; return acc; }, {});
    const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 10);
    const allArticles = artigos.length;
    
    if (sorted.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-muted p-3">Nenhum periódico no recorte atual.</td></tr>`;
      return;
    }

    tbody.innerHTML = sorted.map(([journal, count], index) => {
      const pct = ((count / allArticles) * 100).toLocaleString('pt-BR', {maximumFractionDigits: 1}) + '%';
      return `<tr>
        <td style="width: 40px;" class="text-muted">${index + 1}º</td>
        <td>${journal}</td>
        <td class="text-end fw-semibold">${count.toLocaleString('pt-BR')}</td>
        <td class="text-end text-muted">${pct}</td>
      </tr>`;
    }).join('');
  }

  return { init, render };
})();
