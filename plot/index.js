const ci = (df, tf, af) => (p, n, z = 1.96) => {
  const d = df(p, n, z)
  const t = tf(p, n, z)
  const a = af(p, n, z)
  const [a1, a2] = [a[0], a[1]]
  const min = Math.max(0, (t - (a1 || a)) / d)
  const max = Math.min(1, (t + (a2 || a)) / d)
  return [p === 0 ? 0 : min, p === 1 ? 1 : max]
}

const ciNormal = ci(() => 1, p => p, (p, n, z) => z * Math.sqrt((p * (1 - p)) / n))

const ciWilson = ci(
  (_, n, z) => 1 + (z * z) / n,
  (p, n, z) => p + (z * z) / (2 * n),
  (p, n, z) => z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n)),
)

const ciWilsonCC = ci(
  (_, n, z) => 2 * (n + z * z),
  (p, n, z) => 2 * n * p + z * z,
  (p, n, z) => [
    z * Math.sqrt(z * z - 1 / n + 4 * n * p * (1 - p) + (4 * p - 2)) + 1,
    z * Math.sqrt(z * z - 1 / n + 4 * n * p * (1 - p) - (4 * p - 2)) + 1,
  ],
)

const parseCsv = csv => {
  try {
    return csv
      .split('\n')
      .filter(e => e.trim())
      .map(e => {
        const [x, i, n] = e.split(',').map(Number)
        return { x, i, n }
      })
      .sort((a, b) => a.x - b.x)
  } catch (_) {
    return []
  }
}

const parseFormula = formula => {
  try {
    const mathFns = Object.getOwnPropertyNames(Math)
    return eval(`((${mathFns.join(', ')}) => x => ${formula || null})(${mathFns.map(e => `Math.${e}`).join(', ')})`)
  } catch (_) {
    return () => null
  }
}

const render = ({ formula, csv }) => {
  const fn = parseFormula(formula)
  const data = parseCsv(csv)

  const chartData = [
    { x: [], y: [], error_y: { type: 'data', symmetric: false, array: [], arrayminus: [], visible: true }, type: 'scatter', name: 'data sample' },
    { x: [], y: [], line: { shape: 'line' }, type: 'scatter', name: 'formula (H₀)' },
  ]

  const mean = data.reduce((a, e) => a + e.i / e.n, 0) / data.length
  const minX = Math.min(...data.map(e => e.x))
  const maxX = Math.max(...data.map(e => e.x))
  let minY = 1
  let maxY = 1
  let t1 = 0
  let t2 = 0
  let t = 0
  let k = 1

  for (const { x, i, n } of data) {
    const e = fn(x)
    const ei = e * n
    const p = i / n
    k = (e === 1 && p < 1) || (e === 0 && p > 0) ? 0 : 1
    t += Math.pow(i - ei, 2) / ei
    t1 += Math.pow(p - mean, 2)
    t2 += Math.pow(p - e, 2)
    const ci = ciWilsonCC(p, n)
    minY = Math.min(minY, ci[0])
    maxY = Math.max(maxY, ci[1])
    chartData[0].x.push(x)
    chartData[0].y.push(p)
    chartData[0].error_y.array.push(ci[1] - p)
    chartData[0].error_y.arrayminus.push(p - ci[0])
  }

  for (let x = minX; x <= maxX; ++x) {
    chartData[1].x.push(x)
    chartData[1].y.push(fn(x))
  }

  const r2 = Math.round(100 * k * (1 - t2 / t1))
  const x2 = Math.round(100 * k * (1 - jStat.lowRegGamma(0.5 * 1, 0.5 * t)))

  Plotly.newPlot(
    'chart',
    chartData,
    {
      xaxis: { dtick: 5, range: [minX - 10, maxX + 10] },
      yaxis: { dtick: 0.05, range: [minY, maxY] },
      showlegend: false,
      margin: { b: 40, t: 40, l: 40, r: 20 },
      annotations: [
        { x: maxX + 5, y: maxY - 0.01, text: `p(χ²): ${x2}%`, showarrow: false },
        { x: maxX + 5, y: maxY - 0.02, text: `R²: ${r2}%`, showarrow: false },
      ],
    },
    { responsive: true },
  )
}

const input = () => {
  const formula = document.getElementById('formula').value.trim()
  const csv = document.getElementById('csv').value.trim()
  if (formula.includes(';') || csv.includes(';')) {
    alert('Formula and CSV should not contain semicolon (;)')
    document.getElementById('formula').value = formula.replace(/;/g, ',')
    document.getElementById('csv').value = csv.replace(/;/g, ',')
    input()
    return
  }
  window.location.hash = lzbase62.compress(`${formula};${csv}`)
  render({ formula, csv })
}

window.input = input

if (window.location.hash) {
  const [formula, csv] = lzbase62.decompress(window.location.hash.slice(1)).split(';')
  document.getElementById('formula').value = formula
  document.getElementById('csv').value = csv
  render({ formula, csv })
}

/*
t : P → X → [0, 1]
h : P → X → [0, 1]
H₀ : h = t
s : P → X → ℕ
n : P → ℕ
y : P → X → [0, 1]
f : (P → X → [0, 1]) → (P → X → ℕ) → [0, 1]
f(t, s) ~ 1
*/
