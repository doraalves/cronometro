const timeEl   = document.getElementById('time')
const progress = document.getElementById('progress')
const startBtn = document.getElementById('startBtn')
const resetBtn = document.getElementById('resetBtn')
const lapBtn   = document.getElementById('lapBtn')
const lapsEl   = document.getElementById('laps')

const CIRCUMFERENCE = 628.3
const RING_CYCLE    = 60000 // ring completes every 60s

let startTime   = 0
let elapsed     = 0
let rafId       = null
let running     = false
let laps        = []
let lapStart    = 0

// ── Format ──
function format(ms) {
  const totalSec = Math.floor(ms / 1000)
  const min      = Math.floor(totalSec / 60)
  const sec      = totalSec % 60
  const cent     = Math.floor((ms % 1000) / 10)
  return {
    min:  String(min).padStart(2, '0'),
    sec:  String(sec).padStart(2, '0'),
    cent: String(cent).padStart(2, '0'),
  }
}

// ── Render ──
function render(ms) {
  const { min, sec, cent } = format(ms)
  timeEl.innerHTML = `${min}<span class="clock__sep">:</span>${sec}<span class="clock__ms">${cent}</span>`

  // Ring progress (cycles every 60s)
  const fraction = (ms % RING_CYCLE) / RING_CYCLE
  const offset   = CIRCUMFERENCE - fraction * CIRCUMFERENCE
  progress.style.strokeDashoffset = offset

  // Change ring color after 1 minute
  progress.style.stroke = ms >= 60000 ? '#f5a623' : '#c8191a'
}

// ── Tick ──
function tick() {
  elapsed = Date.now() - startTime
  render(elapsed)
  rafId = requestAnimationFrame(tick)
}

// ── Start / Pause ──
startBtn.addEventListener('click', () => {
  if (!running) {
    startTime = Date.now() - elapsed
    if (lapStart === 0) lapStart = Date.now() - elapsed
    rafId = requestAnimationFrame(tick)
    running = true
    startBtn.textContent = 'Pausar'
    startBtn.classList.add('running')
    lapBtn.disabled  = false
    resetBtn.disabled = false
  } else {
    cancelAnimationFrame(rafId)
    running = false
    startBtn.textContent = 'Continuar'
    startBtn.classList.remove('running')
    lapBtn.disabled = true
  }
})

// ── Reset ──
resetBtn.addEventListener('click', () => {
  cancelAnimationFrame(rafId)
  running   = false
  elapsed   = 0
  lapStart  = 0
  laps      = []
  render(0)
  lapsEl.innerHTML    = ''
  startBtn.textContent = 'Iniciar'
  startBtn.classList.remove('running')
  lapBtn.disabled   = true
  resetBtn.disabled = true
})

// ── Lap ──
lapBtn.addEventListener('click', () => {
  if (!running) return

  const now      = elapsed
  const lapTime  = now - lapStart
  lapStart       = now
  laps.unshift({ num: laps.length + 1, total: now, lapMs: lapTime })

  renderLaps()
})

function renderLaps() {
  if (!laps.length) return

  const times   = laps.map(l => l.lapMs)
  const minTime = Math.min(...times)
  const maxTime = Math.max(...times)

  lapsEl.innerHTML = laps.map((lap, i) => {
    let cls = ''
    if (laps.length > 1) {
      if (lap.lapMs === minTime) cls = 'lap--best'
      else if (lap.lapMs === maxTime) cls = 'lap--worst'
    }

    const { min, sec, cent } = format(lap.lapMs)
    const { min: tm, sec: ts, cent: tc } = format(lap.total)

    const diff = i < laps.length - 1
      ? lap.lapMs - laps[i + 1].lapMs
      : null

    let diffStr = ''
    if (diff !== null) {
      const sign = diff >= 0 ? '+' : '−'
      const d = format(Math.abs(diff))
      diffStr = `${sign}${d.sec}.${d.cent}`
    }

    return `
      <div class="lap ${cls}">
        <span class="lap__num">volta ${String(laps.length - i).padStart(2,'0')}</span>
        <span class="lap__time">${min}:${sec}.${cent}</span>
        <span class="lap__diff">${diffStr}</span>
      </div>
    `
  }).join('')
}

// ── Keyboard ──
document.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    e.preventDefault()
    startBtn.click()
  } else if (e.code === 'KeyL') {
    lapBtn.click()
  } else if (e.code === 'KeyR') {
    resetBtn.click()
  }
})
