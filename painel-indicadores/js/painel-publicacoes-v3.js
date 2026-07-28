/* ==========================================================================
   Orquestrador — Painel de Indicadores de Publicações
   ========================================================================== */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    // 1. Verificação de Dependência Crítica (ECharts)
    if (typeof window.echarts === "undefined") {
      console.error("A biblioteca ECharts não foi carregada.");
      showDashboardError(
        "Falha crítica: ECharts ausente. Verifique a conexão com a internet ou adblockers.",
      );
      return;
    }

    try {
      // 2. Acessibilidade
      if (window.PainelA11y) {
        window.PainelA11y.init();
      }

      // 3. Transparência / Dados Demonstrativos
      if (window.PainelDados && window.PainelDados.isDemoData) {
        const alert = document.getElementById("demo-data-alert");
        if (alert) alert.hidden = false;
      }

      // 4. Carregar Dados Fictícios (Locais)
      if (!window.PainelDados) {
        throw new Error("Módulo de dados (PainelDados) não carregado.");
      }
      const records = window.PainelDados.getAll();

      if (!records || records.length === 0) {
        throw new Error("Nenhum dado retornado pela base.");
      }

      // 5. Registrar ouvintes (Gráficos e Cards)
      if (window.PainelGraficos) {
        window.PainelGraficos.init();
      }
      if (window.PainelCards) {
        window.PainelCards.init();
      }

      // 6. Montar Filtros (cadastra eventos internos)
      if (window.PainelFiltros) {
        window.PainelFiltros.init(records);
      }

      // 7. Renderização Inicial OBRIGATÓRIA
      const state = { yearFrom: null, yearTo: null, types: [], languages: [] };
      if (window.PainelCards) window.PainelCards.render(records, state);
      if (window.PainelGraficos) window.PainelGraficos.render(records, state);

      // 8. Remover placeholder de carregamento
      const filtrosPlaceholder = document.querySelector(
        ".painel-filtros-placeholder",
      );
      if (filtrosPlaceholder) {
        filtrosPlaceholder.remove(); // Os filtros verdadeiros já foram injetados
      }

      setupThemeDropdown();
    } catch (error) {
      console.error("Falha ao inicializar o painel:", error);
      showDashboardError(error.message);
    }
  });

  function showDashboardError(msg) {
    const main = document.getElementById("main-content");
    if (main) {
      main.innerHTML = `
        <div class="container-fluid px-4 px-md-5 mt-5">
          <div class="alert alert-danger" role="alert">
            <h4 class="alert-heading">Erro de Inicialização</h4>
            <p>Não foi possível carregar os dados deste painel.</p>
            <hr>
            <p class="mb-0 text-break"><code>${msg}</code></p>
          </div>
        </div>
      `;
    }
  }

  function setupThemeDropdown() {
    const themeBtn = document.getElementById("theme-btn");
    const themeMenu = document.getElementById("theme-menu");

    if (themeBtn && themeMenu) {
      // Toggle menu
      themeBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        themeMenu.style.display =
          themeMenu.style.display === "none" ? "block" : "none";
      });

      // Fechar ao clicar fora
      document.addEventListener("click", function (e) {
        if (!themeMenu.contains(e.target) && !themeBtn.contains(e.target)) {
          themeMenu.style.display = "none";
        }
      });
    }

    const themeDropdownItems = document.querySelectorAll("[data-theme-value]");
    themeDropdownItems.forEach((item) => {
      item.addEventListener("click", () => {
        const theme = item.getAttribute("data-theme-value");
        let resolvedTheme = theme;

        if (theme === "auto") {
          resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)")
            .matches
            ? "dark"
            : "light";
          localStorage.removeItem("brcris-theme");
        } else {
          localStorage.setItem("brcris-theme", theme);
        }

        document.documentElement.setAttribute("data-theme", resolvedTheme);
        document.documentElement.setAttribute("data-bs-theme", resolvedTheme);

        // Atualiza UI do dropdown
        themeDropdownItems.forEach((i) =>
          i.classList.remove("Dropdown_activeItem__ozQsU"),
        );
        item.classList.add("Dropdown_activeItem__ozQsU");

        const themeText = document.getElementById("theme-text");
        if (themeText) {
          const map = { light: "Claro", dark: "Escuro", auto: "Sistema" };
          themeText.textContent = map[theme];
        }

        if (themeMenu) themeMenu.style.display = "none";
      });
    });
  }
})();
