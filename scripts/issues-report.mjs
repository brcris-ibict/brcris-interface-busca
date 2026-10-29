// Gera um relatório HTML estático das issues do repositório.
// Uso: GITHUB_TOKEN=... GITHUB_REPOSITORY=owner/repo node scripts/issues-report.mjs [saida]
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

const repo = process.env.GITHUB_REPOSITORY
const token = process.env.GITHUB_TOKEN
const output = process.argv[2] || 'report/index.html'

if (!repo) {
  console.error('Defina GITHUB_REPOSITORY (ex.: brcris-ibict/brcris-interface-busca)')
  process.exit(1)
}

async function fetchIssues() {
  const issues = []
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
    // O endpoint de issues também retorna pull requests
    issues.push(...batch.filter((i) => !i.pull_request))
    if (batch.length < 100) return issues
  }
}

const escape = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—')

function countBy(items, keyFn) {
  const counts = {}
  for (const item of items) for (const key of keyFn(item)) counts[key] = (counts[key] || 0) + 1
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
}

function render(issues) {
  const open = issues.filter((i) => i.state === 'open')
  const closed = issues.filter((i) => i.state === 'closed')
  const labels = countBy(open, (i) => (i.labels.length ? i.labels.map((l) => l.name) : ['sem label']))
  const assignees = countBy(open, (i) => (i.assignees.length ? i.assignees.map((a) => a.login) : ['sem responsável']))

  const row = (i) => `
      <tr data-state="${i.state}">
        <td><a href="${i.html_url}">#${i.number}</a></td>
        <td>${escape(i.title)}</td>
        <td><span class="state ${i.state}">${i.state === 'open' ? 'aberta' : 'fechada'}</span></td>
        <td>${i.labels.map((l) => `<span class="label" style="--c:#${l.color}">${escape(l.name)}</span>`).join(' ')}</td>
        <td>${i.assignees.map((a) => escape(a.login)).join(', ') || '—'}</td>
        <td>${formatDate(i.created_at)}</td>
        <td>${formatDate(i.closed_at)}</td>
      </tr>`

  const list = (entries) => entries.map(([k, v]) => `<li><span>${escape(k)}</span><b>${v}</b></li>`).join('')

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Relatório de Issues</title>
<style>
  :root { --bg:#fff; --fg:#1f2328; --muted:#59636e; --border:#d1d9e0; --card:#f6f8fa; --open:#1a7f37; --closed:#8250df; }
  @media (prefers-color-scheme: dark) { :root { --bg:#0d1117; --fg:#e6edf3; --muted:#9198a1; --border:#3d444d; --card:#151b23; --open:#3fb950; --closed:#ab7df8; } }
  body { margin:0; padding:24px 16px; font:15px/1.5 system-ui, sans-serif; background:var(--bg); color:var(--fg); }
  main { max-width:1100px; margin:0 auto; }
  h1 { margin:0 0 4px; } .muted { color:var(--muted); }
  .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; margin:24px 0; }
  .card { background:var(--card); border:1px solid var(--border); border-radius:8px; padding:16px; }
  .card b { display:block; font-size:28px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:16px; }
  ul { list-style:none; padding:0; margin:0; } li { display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid var(--border); }
  .filters { margin:24px 0 8px; display:flex; gap:8px; }
  button { background:var(--card); color:var(--fg); border:1px solid var(--border); border-radius:6px; padding:4px 12px; cursor:pointer; }
  button.active { border-color:var(--fg); }
  .table { overflow-x:auto; } table { width:100%; border-collapse:collapse; }
  th, td { text-align:left; padding:8px; border-bottom:1px solid var(--border); vertical-align:top; }
  a { color:inherit; }
  .state { font-size:12px; font-weight:600; } .state.open { color:var(--open); } .state.closed { color:var(--closed); }
  .label { display:inline-block; font-size:12px; padding:0 8px; border-radius:999px; border:1px solid var(--c); white-space:nowrap; }
</style>
</head>
<body>
<main>
  <h1>Relatório de Issues</h1>
  <p class="muted">${escape(repo)} · gerado em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>

  <section class="cards">
    <div class="card"><span class="muted">Total</span><b>${issues.length}</b></div>
    <div class="card"><span class="muted">Abertas</span><b>${open.length}</b></div>
    <div class="card"><span class="muted">Fechadas</span><b>${closed.length}</b></div>
    <div class="card"><span class="muted">% concluído</span><b>${issues.length ? Math.round((closed.length / issues.length) * 100) : 0}%</b></div>
  </section>

  <section class="grid">
    <div><h2>Abertas por label</h2><ul>${list(labels)}</ul></div>
    <div><h2>Abertas por responsável</h2><ul>${list(assignees)}</ul></div>
  </section>

  <div class="filters">
    <button data-filter="all" class="active">Todas</button>
    <button data-filter="open">Abertas</button>
    <button data-filter="closed">Fechadas</button>
  </div>
  <div class="table">
    <table>
      <thead><tr><th>#</th><th>Título</th><th>Estado</th><th>Labels</th><th>Responsáveis</th><th>Criada</th><th>Fechada</th></tr></thead>
      <tbody>${issues.map(row).join('')}</tbody>
    </table>
  </div>
</main>
<script>
  document.querySelectorAll('[data-filter]').forEach((btn) => btn.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach((b) => b.classList.toggle('active', b === btn))
    document.querySelectorAll('tbody tr').forEach((tr) => {
      tr.hidden = btn.dataset.filter !== 'all' && tr.dataset.state !== btn.dataset.filter
    })
  }))
</script>
</body>
</html>`
}

const issues = await fetchIssues()
await mkdir(dirname(output), { recursive: true })
await writeFile(output, render(issues))
console.log(`Relatório com ${issues.length} issues gerado em ${output}`)
