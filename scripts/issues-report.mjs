// Gera um relatório HTML estático das atualizações do repositório (issues e pull requests).
// Uso: GITHUB_TOKEN=... GITHUB_REPOSITORY=owner/repo node scripts/issues-report.mjs [saida]
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

const repo = process.env.GITHUB_REPOSITORY
const token = process.env.GITHUB_TOKEN
const output = process.argv[2] || 'report/index.html'
const TZ = 'America/Sao_Paulo'

if (!repo) {
  console.error('Defina GITHUB_REPOSITORY (ex.: brcris-ibict/brcris-interface-busca)')
  process.exit(1)
}

async function fetchAll() {
  const items = []
  for (let page = 1; ; page++) {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/issues?state=all&per_page=100&page=${page}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    )
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`)
    const batch = await res.json()
    items.push(...batch)
    if (batch.length < 100) break
  }
  // O endpoint de issues também retorna pull requests
  return {
    issues: items.filter((i) => !i.pull_request),
    pulls: items.filter((i) => i.pull_request),
  }
}

const escape = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: TZ }) : '—')
const formatShort = (d) =>
  new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: TZ }).replace('.', '')
const monthKey = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: TZ }).slice(0, 7)

function countBy(items, keyFn) {
  const counts = {}
  for (const item of items) for (const key of keyFn(item)) counts[key] = (counts[key] || 0) + 1
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
}

function lastMonths(n) {
  const now = new Date()
  const months = []
  for (let k = n - 1; k >= 0; k--) {
    const d = new Date(now.getFullYear(), now.getMonth() - k, 15)
    months.push({
      key: monthKey(d),
      label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      year: d.getFullYear(),
    })
  }
  return months
}

function render({ issues, pulls }) {
  const open = issues.filter((i) => i.state === 'open')
  const closed = issues.filter((i) => i.state === 'closed')
  const merged = pulls.filter((p) => p.pull_request.merged_at)
  const pct = issues.length ? Math.round((closed.length / issues.length) * 100) : 0
  const now = Date.now()
  const last30 = (d) => d && now - new Date(d).getTime() <= 30 * 864e5
  const closed30 = closed.filter((i) => last30(i.closed_at)).length
  const merged30 = merged.filter((p) => last30(p.pull_request.merged_at)).length
  const opened30 = issues.filter((i) => last30(i.created_at)).length

  // Atividade mensal
  const months = lastMonths(12)
  const createdBy = Object.fromEntries(countBy(issues, (i) => [monthKey(i.created_at)]))
  const closedBy = Object.fromEntries(countBy(closed, (i) => [monthKey(i.closed_at)]))
  const max = Math.max(1, ...months.map((m) => Math.max(createdBy[m.key] || 0, closedBy[m.key] || 0)))
  const bars = months
    .map((m) => {
      const c = createdBy[m.key] || 0
      const f = closedBy[m.key] || 0
      return `
        <div class="month" title="${m.label}/${m.year}: ${c} abertas, ${f} concluídas">
          <div class="bars">
            <span class="bar created" style="height:${(c / max) * 100}%"><i>${c || ''}</i></span>
            <span class="bar done" style="height:${(f / max) * 100}%"><i>${f || ''}</i></span>
          </div>
          <span class="mlabel">${m.label}</span>
        </div>`
    })
    .join('')

  // Linha do tempo das entregas recentes (issues concluídas + PRs integrados)
  const timeline = [
    ...closed.map((i) => ({ kind: 'issue', date: i.closed_at, item: i })),
    ...merged.map((p) => ({ kind: 'pr', date: p.pull_request.merged_at, item: p })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 12)
    .map(
      ({ kind, date, item }) => `
        <li class="tl-item">
          <span class="tl-dot k-${kind}" aria-hidden="true"></span>
          <div>
            <div class="tl-meta">
              <span class="tag k-${kind}">${kind === 'pr' ? 'PR integrado' : 'Issue concluída'}</span>
              <time>${formatShort(date)}</time>
            </div>
            <a href="${item.html_url}" class="tl-title">${escape(item.title)}</a>
            <span class="tl-sub">#${item.number}${item.user ? ` · ${escape(item.user.login)}` : ''}</span>
          </div>
        </li>`
    )
    .join('')

  // Em andamento por responsável
  const assignees = countBy(open, (i) => (i.assignees.length ? i.assignees.map((a) => a.login) : ['Sem responsável']))
  const maxA = Math.max(1, ...assignees.map(([, v]) => v))
  const people = assignees
    .map(
      ([name, v]) => `
        <li class="person">
          <span class="avatar" aria-hidden="true">${escape(name === 'Sem responsável' ? '?' : name[0].toUpperCase())}</span>
          <div class="person-body">
            <div class="person-row"><span>${escape(name)}</span><b>${v}</b></div>
            <div class="meter"><span style="width:${(v / maxA) * 100}%"></span></div>
          </div>
        </li>`
    )
    .join('')

  const labels = countBy(open, (i) => i.labels.map((l) => l.name))
  const labelChips = labels.length
    ? `<div class="chips">${labels.map(([k, v]) => `<span class="chip">${escape(k)} <b>${v}</b></span>`).join('')}</div>`
    : ''

  // Lista completa
  const row = (i) => `
      <li class="issue" data-state="${i.state}">
        <span class="status ${i.state}" aria-label="${i.state === 'open' ? 'Aberta' : 'Concluída'}">${
          i.state === 'open'
            ? '<svg viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="1.75" fill="currentColor"/></svg>'
            : '<svg viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="7" fill="currentColor"/><path d="M5 8.2l2 2 4-4.2" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        }</span>
        <div class="issue-main">
          <a href="${i.html_url}" class="issue-title">${escape(i.title)}</a>
          <div class="issue-meta">
            <span>#${i.number}</span>
            <span>aberta em ${formatDate(i.created_at)}</span>
            ${i.closed_at ? `<span>concluída em ${formatDate(i.closed_at)}</span>` : ''}
            ${i.labels.map((l) => `<span class="label" style="--c:#${l.color}">${escape(l.name)}</span>`).join('')}
          </div>
        </div>
        <span class="issue-who">${i.assignees.map((a) => escape(a.login)).join(', ') || '—'}</span>
      </li>`

  const generated = new Date().toLocaleString('pt-BR', { timeZone: TZ, dateStyle: 'long', timeStyle: 'short' })

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Relatório de Atualizações · BrCris</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    color-scheme: light;
    --bg: #ffffff; --surface: #ffffff; --soft: #f7f8fa; --fg: #0f172a; --muted: #5b6475;
    --border: #e5e7eb; --accent: #2563eb; --accent-soft: #eff4ff;
    --open: #15803d; --open-soft: #ecfdf3; --done: #6d28d9; --done-soft: #f4f0ff;
    --radius: 14px; --shadow: 0 1px 2px rgba(15,23,42,.04), 0 4px 16px rgba(15,23,42,.04);
  }
  * { box-sizing: border-box; }
  [hidden] { display: none !important; }
  body { margin: 0; background: var(--bg); color: var(--fg); font: 15px/1.55 Inter, system-ui, -apple-system, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; }
  a { color: inherit; text-decoration: none; }
  a:hover { color: var(--accent); }
  a:focus-visible, button:focus-visible, input:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 6px; }
  .wrap { max-width: 1120px; margin: 0 auto; padding: 0 16px; }

  /* Cabeçalho */
  .topbar { border-bottom: 1px solid var(--border); position: sticky; top: 0; background: rgba(255,255,255,.88); backdrop-filter: saturate(180%) blur(10px); z-index: 10; }
  .topbar .wrap { display: flex; align-items: center; justify-content: space-between; height: 60px; gap: 16px; }
  .brand { display: flex; align-items: center; gap: 10px; font-weight: 600; }
  .logo { width: 30px; height: 30px; border-radius: 8px; background: linear-gradient(135deg, #2563eb, #7c3aed); display: grid; place-items: center; color: #fff; font-size: 14px; font-weight: 700; }
  .repo-link { font-size: 13px; color: var(--muted); border: 1px solid var(--border); padding: 6px 12px; border-radius: 999px; white-space: nowrap; }

  .hero { padding: 48px 0 32px; }
  .eyebrow { display: inline-block; font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--accent); background: var(--accent-soft); padding: 4px 10px; border-radius: 999px; }
  .hero h1 { font-size: clamp(28px, 4.5vw, 42px); line-height: 1.15; letter-spacing: -.02em; margin: 16px 0 8px; }
  .hero p { color: var(--muted); margin: 0; max-width: 640px; }
  .progress { margin-top: 28px; max-width: 640px; }
  .progress-head { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px; }
  .progress-head b { font-size: 14px; }
  .track { height: 10px; background: var(--soft); border: 1px solid var(--border); border-radius: 999px; overflow: hidden; }
  .track span { display: block; height: 100%; background: linear-gradient(90deg, #2563eb, #7c3aed); border-radius: 999px; }

  /* KPIs */
  .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 16px; margin-bottom: 40px; }
  .kpi { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow); }
  .kpi span { color: var(--muted); font-size: 13px; font-weight: 500; }
  .kpi b { display: block; font-size: 32px; letter-spacing: -.02em; margin: 4px 0 2px; font-variant-numeric: tabular-nums; }
  .kpi small { font-size: 12px; color: var(--muted); }
  .kpi small em { font-style: normal; color: var(--open); font-weight: 600; }

  /* Seções */
  section { margin-bottom: 40px; }
  .panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; box-shadow: var(--shadow); min-width: 0; }
  .panel-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
  h2 { font-size: 18px; letter-spacing: -.01em; margin: 0; }
  .panel-head p { margin: 0; color: var(--muted); font-size: 13px; }
  .cols { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; }
  @media (max-width: 860px) { .cols { grid-template-columns: 1fr; } }

  /* Gráfico mensal */
  .legend { display: flex; gap: 16px; font-size: 13px; color: var(--muted); }
  .legend i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 6px; vertical-align: -1px; }
  .chart { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 6px; height: 220px; align-items: end; }
  .month { display: flex; flex-direction: column; align-items: center; height: 100%; gap: 8px; min-width: 0; }
  .bars { flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center; gap: 3px; border-bottom: 1px solid var(--border); }
  .bar { width: min(14px, 40%); border-radius: 4px 4px 0 0; position: relative; min-height: 0; }
  .bar i { position: absolute; top: -18px; left: 50%; transform: translateX(-50%); font-style: normal; font-size: 11px; color: var(--muted); font-variant-numeric: tabular-nums; }
  .bar.created { background: #93c5fd; }
  .bar.done { background: var(--done); }
  .mlabel { font-size: 12px; color: var(--muted); text-transform: capitalize; }
  @media (max-width: 560px) { .bar i { display: none; } .mlabel { font-size: 10px; } }

  /* Linha do tempo */
  .timeline { list-style: none; margin: 0; padding: 0; position: relative; }
  .timeline::before { content: ''; position: absolute; left: 5px; top: 6px; bottom: 6px; width: 2px; background: var(--border); }
  .tl-item { display: grid; grid-template-columns: 12px 1fr; gap: 14px; padding-bottom: 18px; position: relative; }
  .tl-item:last-child { padding-bottom: 0; }
  .tl-dot { width: 12px; height: 12px; border-radius: 50%; margin-top: 4px; border: 2px solid #fff; box-shadow: 0 0 0 2px var(--done); background: var(--done); position: relative; }
  .tl-dot.k-pr { box-shadow: 0 0 0 2px var(--accent); background: var(--accent); }
  .tl-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--muted); }
  .tag { font-weight: 600; padding: 1px 8px; border-radius: 999px; font-size: 11px; }
  .tag.k-issue { color: var(--done); background: var(--done-soft); }
  .tag.k-pr { color: var(--accent); background: var(--accent-soft); }
  .tl-title { display: block; font-weight: 500; margin-top: 4px; overflow-wrap: anywhere; }
  .tl-sub { font-size: 12px; color: var(--muted); }

  /* Responsáveis */
  .people { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
  .person { display: flex; gap: 12px; align-items: center; }
  .avatar { width: 34px; height: 34px; flex: none; border-radius: 50%; display: grid; place-items: center; font-weight: 600; font-size: 14px; background: var(--accent-soft); color: var(--accent); }
  .person-body { flex: 1; min-width: 0; }
  .person-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; gap: 8px; }
  .person-row span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .meter { height: 6px; background: var(--soft); border-radius: 999px; overflow: hidden; }
  .meter span { display: block; height: 100%; background: var(--open); border-radius: 999px; }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border); }
  .chip { font-size: 12px; padding: 4px 10px; border-radius: 999px; background: var(--soft); border: 1px solid var(--border); }

  /* Lista */
  .toolbar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
  .search { flex: 1; min-width: 200px; position: relative; }
  .search svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); }
  .search input { width: 100%; font: inherit; font-size: 14px; padding: 9px 12px 9px 36px; border: 1px solid var(--border); border-radius: 10px; background: var(--surface); color: var(--fg); }
  .segmented { display: inline-flex; background: var(--soft); border: 1px solid var(--border); border-radius: 10px; padding: 3px; }
  .segmented button { font: inherit; font-size: 13px; font-weight: 500; border: 0; background: transparent; color: var(--muted); padding: 6px 14px; border-radius: 7px; cursor: pointer; }
  .segmented button.active { background: var(--surface); color: var(--fg); box-shadow: 0 1px 3px rgba(15,23,42,.1); }
  .issues { list-style: none; margin: 16px 0 0; padding: 0; border-top: 1px solid var(--border); }
  .issue { display: grid; grid-template-columns: 20px 1fr auto; gap: 12px; padding: 14px 4px; border-bottom: 1px solid var(--border); align-items: start; }
  .issue:hover { background: var(--soft); }
  .status { margin-top: 2px; display: flex; }
  .status.open { color: var(--open); } .status.closed { color: var(--done); }
  .issue-main { min-width: 0; }
  .issue-title { font-weight: 500; overflow-wrap: anywhere; }
  .issue-meta { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 12px; color: var(--muted); margin-top: 4px; align-items: center; }
  .label { padding: 0 8px; border-radius: 999px; border: 1px solid var(--c); color: var(--fg); }
  .issue-who { font-size: 13px; color: var(--muted); white-space: nowrap; }
  @media (max-width: 560px) { .issue { grid-template-columns: 20px 1fr; } .issue-who { grid-column: 2; } }
  .empty { text-align: center; color: var(--muted); padding: 32px 0; }
  .count { font-size: 13px; color: var(--muted); }

  footer { border-top: 1px solid var(--border); padding: 24px 0 40px; color: var(--muted); font-size: 13px; }
  footer .wrap { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  @media print { .topbar { position: static; } .toolbar { display: none; } .kpi, .panel { box-shadow: none; } }
</style>
</head>
<body>
<header class="topbar">
  <div class="wrap">
    <div class="brand"><span class="logo" aria-hidden="true">Br</span> BrCris · Interface de Busca</div>
    <a class="repo-link" href="https://github.com/${escape(repo)}">Ver no GitHub ↗</a>
  </div>
</header>

<main class="wrap">
  <div class="hero">
    <span class="eyebrow">Relatório de atualizações</span>
    <h1>Acompanhamento do desenvolvimento</h1>
    <p>Visão consolidada das demandas, entregas e atividades recentes do projeto. Atualizado em ${escape(generated)}.</p>
    <div class="progress">
      <div class="progress-head"><span>Progresso geral das issues</span><b>${pct}% concluído</b></div>
      <div class="track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso geral"><span style="width:${pct}%"></span></div>
    </div>
  </div>

  <div class="kpis">
    <div class="kpi"><span>Total de issues</span><b>${issues.length}</b><small><em>+${opened30}</em> nos últimos 30 dias</small></div>
    <div class="kpi"><span>Em aberto</span><b>${open.length}</b><small>${((n) => `${n} ${n === 1 ? 'responsável ativo' : 'responsáveis ativos'}`)(assignees.filter(([n]) => n !== 'Sem responsável').length)}</small></div>
    <div class="kpi"><span>Concluídas</span><b>${closed.length}</b><small><em>+${closed30}</em> nos últimos 30 dias</small></div>
    <div class="kpi"><span>PRs integrados</span><b>${merged.length}</b><small><em>+${merged30}</em> nos últimos 30 dias</small></div>
  </div>

  <section class="panel">
    <div class="panel-head">
      <div><h2>Atividade mensal</h2><p>Issues abertas e concluídas nos últimos 12 meses</p></div>
      <div class="legend"><span><i style="background:#93c5fd"></i>Abertas</span><span><i style="background:var(--done)"></i>Concluídas</span></div>
    </div>
    <div class="chart" role="img" aria-label="Gráfico de issues abertas e concluídas por mês">${bars}</div>
  </section>

  <section class="cols">
    <div class="panel">
      <div class="panel-head"><div><h2>Entregas recentes</h2><p>Últimas issues concluídas e PRs integrados</p></div></div>
      ${timeline ? `<ul class="timeline">${timeline}</ul>` : '<p class="empty">Nenhuma entrega registrada.</p>'}
    </div>
    <div class="panel">
      <div class="panel-head"><div><h2>Em andamento</h2><p>Issues abertas por responsável</p></div></div>
      ${people ? `<ul class="people">${people}</ul>` : '<p class="empty">Nenhuma issue aberta.</p>'}
      ${labelChips}
    </div>
  </section>

  <section class="panel">
    <div class="panel-head"><div><h2>Todas as issues</h2><p class="count" id="count">${issues.length} issues</p></div></div>
    <div class="toolbar">
      <label class="search">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <input id="q" type="search" placeholder="Buscar por título, número ou responsável" aria-label="Buscar issues">
      </label>
      <div class="segmented" role="group" aria-label="Filtrar por estado">
        <button data-filter="all" class="active" aria-pressed="true">Todas</button>
        <button data-filter="open" aria-pressed="false">Abertas</button>
        <button data-filter="closed" aria-pressed="false">Concluídas</button>
      </div>
    </div>
    <ul class="issues">${issues.map(row).join('')}</ul>
    <p class="empty" id="empty" hidden>Nenhuma issue encontrada.</p>
  </section>
</main>

<footer>
  <div class="wrap">
    <span>Gerado automaticamente a partir do GitHub · ${escape(repo)}</span>
    <span>${escape(generated)}</span>
  </div>
</footer>

<script>
  const rows = [...document.querySelectorAll('.issues > .issue')]
  const q = document.getElementById('q')
  const count = document.getElementById('count')
  const empty = document.getElementById('empty')
  let filter = 'all'
  function apply() {
    const term = q.value.trim().toLowerCase()
    let shown = 0
    rows.forEach((li) => {
      const ok = (filter === 'all' || li.dataset.state === filter) && (!term || li.textContent.toLowerCase().includes(term))
      li.hidden = !ok
      if (ok) shown++
    })
    count.textContent = shown + (shown === 1 ? ' issue' : ' issues')
    empty.hidden = shown > 0
  }
  document.querySelectorAll('[data-filter]').forEach((btn) => btn.addEventListener('click', () => {
    filter = btn.dataset.filter
    document.querySelectorAll('[data-filter]').forEach((b) => {
      b.classList.toggle('active', b === btn)
      b.setAttribute('aria-pressed', b === btn)
    })
    apply()
  }))
  q.addEventListener('input', apply)
</script>
</body>
</html>`
}

const data = await fetchAll()
await mkdir(dirname(output), { recursive: true })
await writeFile(output, render(data))
console.log(`Relatório com ${data.issues.length} issues e ${data.pulls.length} PRs gerado em ${output}`)
