/* ==========================================================================
   Filtros — Painel de Indicadores de Publicações
   ========================================================================== */

window.PainelFiltros = (function () {
  "use strict";

  let _listeners = [];
  let _baseData = [];

  // Estado dos filtros: chaves podem ter array de valores selecionados (múltipla escolha)
  let _state = {
    yearFrom: null,
    yearTo: null,
    types: [],
    languages: [],
  };

  function init(data) {
    _baseData = data;
    renderFiltrosUI();
    bindEvents();
    updateUI();
  }

  function renderFiltrosUI() {
    const container = document.getElementById("filtros-section");
    if (!container) return;

    // Extrai valores únicos
    const anos = [...new Set(_baseData.map((d) => d.year))].sort(
      (a, b) => a - b,
    );
    const tipos = [...new Set(_baseData.map((d) => d.type))].sort();

    // Idiomas estão em array dentro de cada reg
    const allLangs = _baseData.reduce((acc, d) => acc.concat(d.languages), []);
    const idiomas = [...new Set(allLangs)].sort();

    container.innerHTML = `
      <div class="painel-filtros">
        <div class="painel-filtros-grid">
          
          <div class="painel-filtro-item">
            <label class="painel-filtro-label" for="filter-year-from">Período De</label>
            <select id="filter-year-from" class="form-select form-select-sm">
              <option value="">Todos os anos</option>
              ${anos.map((a) => `<option value="${a}">${a}</option>`).join("")}
            </select>
          </div>

          <div class="painel-filtro-item">
            <label class="painel-filtro-label" for="filter-year-to">Período Até</label>
            <select id="filter-year-to" class="form-select form-select-sm">
              <option value="">Todos os anos</option>
              ${anos.map((a) => `<option value="${a}">${a}</option>`).join("")}
            </select>
          </div>

          <div class="painel-filtro-item">
            <label class="painel-filtro-label" for="filter-type">Tipo de Publicação</label>
            <select id="filter-type" class="form-select form-select-sm">
              <option value="">Todos os tipos</option>
              ${tipos.map((t) => `<option value="${t}">${t}</option>`).join("")}
            </select>
          </div>

          <div class="painel-filtro-item">
            <label class="painel-filtro-label" for="filter-lang">Idioma</label>
            <select id="filter-lang" class="form-select form-select-sm">
              <option value="">Todos os idiomas</option>
              ${idiomas.map((l) => `<option value="${l}">${l}</option>`).join("")}
            </select>
          </div>
          
          <div class="painel-filtro-item ms-auto">
            <button type="button" id="btn-clear-filters" class="btn btn-outline-secondary btn-sm w-100" hidden>Limpar Filtros</button>
          </div>
        </div>

        <!-- Feedback e Tags -->
        <div class="mt-3 d-flex flex-wrap align-items-center gap-3">
          <div id="filter-summary" class="small fw-semibold text-primary">
            <!-- Mostrando X de Y publicações totais -->
          </div>
          <div id="active-filters-tags" class="painel-tags-ativos mt-0"></div>
        </div>
      </div>
    `;
  }

  function bindEvents() {
    const yFrom = document.getElementById("filter-year-from");
    const yTo = document.getElementById("filter-year-to");
    const tSel = document.getElementById("filter-type");
    const lSel = document.getElementById("filter-lang");
    const btnClear = document.getElementById("btn-clear-filters");

    if (yFrom) {
      yFrom.addEventListener("change", function () {
        _state.yearFrom = this.value ? parseInt(this.value, 10) : null;
        applyAndNotify();
      });
    }

    if (yTo) {
      yTo.addEventListener("change", function () {
        _state.yearTo = this.value ? parseInt(this.value, 10) : null;
        applyAndNotify();
      });
    }

    // Para select single agindo como adicionador de tags
    const handleArrayFilter = (selectEl, stateArray) => {
      if (!selectEl) return;
      selectEl.addEventListener("change", function () {
        if (this.value && !stateArray.includes(this.value)) {
          stateArray.push(this.value);
        }
        this.value = ""; // Reseta o select
        applyAndNotify();
      });
    };

    handleArrayFilter(tSel, _state.types);
    handleArrayFilter(lSel, _state.languages);

    if (btnClear) {
      btnClear.addEventListener("click", clearAll);
    }
  }

  function removeFilterTag(type, val) {
    if (type === "yearFrom") _state.yearFrom = null;
    else if (type === "yearTo") _state.yearTo = null;
    else if (type === "type")
      _state.types = _state.types.filter((t) => t !== val);
    else if (type === "lang")
      _state.languages = _state.languages.filter((l) => l !== val);

    // Atualiza selects visuais para período
    if (type === "yearFrom")
      document.getElementById("filter-year-from").value = "";
    if (type === "yearTo") document.getElementById("filter-year-to").value = "";

    applyAndNotify();
  }

  function clearAll() {
    _state = { yearFrom: null, yearTo: null, types: [], languages: [] };
    const yFrom = document.getElementById("filter-year-from");
    const yTo = document.getElementById("filter-year-to");
    if (yFrom) yFrom.value = "";
    if (yTo) yTo.value = "";
    applyAndNotify();
  }

  function applyAndNotify() {
    // 1. Executar a filtragem (AND entre categorias, OR dentro da categoria)
    const filtered = _baseData.filter((d) => {
      // AND yearFrom
      if (_state.yearFrom !== null && d.year < _state.yearFrom) return false;
      // AND yearTo
      if (_state.yearTo !== null && d.year > _state.yearTo) return false;
      // AND (OR types)
      if (_state.types.length > 0 && !_state.types.includes(d.type))
        return false;
      // AND (OR languages) - intersecção entre idiomas selecionados e idiomas do registro
      if (
        _state.languages.length > 0 &&
        !d.languages.some((l) => _state.languages.includes(l))
      )
        return false;

      return true;
    });

    // 2. Atualizar UI
    updateUI(filtered.length);

    // 3. Notificar listeners
    _listeners.forEach((cb) => cb(filtered, _state));
  }

  function updateUI(filteredCount) {
    const hasFilters =
      _state.yearFrom !== null ||
      _state.yearTo !== null ||
      _state.types.length > 0 ||
      _state.languages.length > 0;

    // Botão Limpar
    const btnClear = document.getElementById("btn-clear-filters");
    if (btnClear) btnClear.hidden = !hasFilters;

    // Resumo
    const summary = document.getElementById("filter-summary");
    if (summary) {
      const total = _baseData.length;
      const cnt = filteredCount !== undefined ? filteredCount : total;
      summary.textContent = `Mostrando ${cnt.toLocaleString("pt-BR")} de ${total.toLocaleString("pt-BR")} publicações totais no BrCris`;
    }

    // Tags
    const tagsContainer = document.getElementById("active-filters-tags");
    if (tagsContainer) {
      tagsContainer.innerHTML = "";

      const createTag = (label, type, val) => {
        const div = document.createElement("div");
        div.className = "painel-tag";
        div.innerHTML = `
          <span>${label}</span>
          <button type="button" class="painel-tag-remove" aria-label="Remover filtro ${label}">&times;</button>
        `;
        div
          .querySelector("button")
          .addEventListener("click", () => removeFilterTag(type, val));
        return div;
      };

      if (_state.yearFrom !== null)
        tagsContainer.appendChild(
          createTag(`De: ${_state.yearFrom}`, "yearFrom", _state.yearFrom),
        );
      if (_state.yearTo !== null)
        tagsContainer.appendChild(
          createTag(`Até: ${_state.yearTo}`, "yearTo", _state.yearTo),
        );
      _state.types.forEach((t) =>
        tagsContainer.appendChild(createTag(`${t}`, "type", t)),
      );
      _state.languages.forEach((l) =>
        tagsContainer.appendChild(createTag(`${l}`, "lang", l)),
      );

      const hasFilters =
        _state.yearFrom !== null ||
        _state.yearTo !== null ||
        _state.types.length > 0 ||
        _state.languages.length > 0;
      if (hasFilters) {
        const clearBtn = document.createElement("button");
        clearBtn.type = "button";
        clearBtn.className = "btn btn-sm btn-link text-decoration-none";
        clearBtn.textContent = "Limpar filtros";
        clearBtn.style.color = "var(--painel-accent)";
        clearBtn.addEventListener("click", () => {
          _state = { yearFrom: null, yearTo: null, types: [], languages: [] };
          document.getElementById("filter-year-from").value = "";
          document.getElementById("filter-year-to").value = "";
          document.getElementById("filter-types").value = "";
          document.getElementById("filter-langs").value = "";
          applyAndNotify();
        });
        tagsContainer.appendChild(clearBtn);
      }
    }
  }

  function onChange(callback) {
    _listeners.push(callback);
  }

  return {
    init: init,
    onChange: onChange,
  };
})();
