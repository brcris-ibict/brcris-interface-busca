/* ==========================================================================
   Acessibilidade — Painel de Indicadores de Publicações
   Geração de tabelas alternativas, ARIA Live e tratamento de cores.
   ========================================================================== */

window.PainelA11y = (function () {
  "use strict";

  // Cria uma região aria-live se não existir
  let ariaLiveRegion;

  function init() {
    ariaLiveRegion = document.createElement("div");
    ariaLiveRegion.setAttribute("aria-live", "polite");
    ariaLiveRegion.setAttribute("aria-atomic", "true");
    ariaLiveRegion.className = "visually-hidden";
    document.body.appendChild(ariaLiveRegion);
  }

  function announce(message) {
    if (ariaLiveRegion) {
      ariaLiveRegion.textContent = message;
    }
  }

  // Gera uma tabela de dados a partir de labels (headers) e datasets (rows)
  function createAltTable(containerId, title, headers, rows) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Remove tabela anterior se houver
    container.innerHTML = "";

    const details = document.createElement("details");
    details.className = "painel-tabela-alt";

    const summary = document.createElement("summary");
    summary.textContent = `Visualizar dados em tabela: ${title}`;
    details.appendChild(summary);

    const wrapper = document.createElement("div");
    wrapper.className = "table-responsive";

    const table = document.createElement("table");
    table.className = "painel-table";

    // Thead
    const thead = document.createElement("thead");
    const trHead = document.createElement("tr");
    headers.forEach((h) => {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = h;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    table.appendChild(thead);

    // Tbody
    const tbody = document.createElement("tbody");
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      row.forEach((cell) => {
        const td = document.createElement("td");
        td.textContent = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    wrapper.appendChild(table);
    details.appendChild(wrapper);
    container.appendChild(details);
  }

  return {
    init: init,
    announce: announce,
    createAltTable: createAltTable,
  };
})();
