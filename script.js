let swRunning = false;
let swStartTime = 0;
let swElapsed = 0;
let swRaf = null;
let laps = [];

const swDisplay = document.getElementById('swDisplay');
const swStart = document.getElementById('swStart');
const swLap = document.getElementById('swLap');
const swReset = document.getElementById('swReset');
const lapList = document.getElementById('lapList');
const lapsEmpty = document.getElementById('lapsEmpty');

const tmDisplay = document.getElementById('tmDisplay');
const tmLabel = document.getElementById('tmLabel');
const tmStart = document.getElementById('tmStart');
const tmReset = document.getElementById('tmReset');
const ring = document.getElementById('ring');
const setMin = document.getElementById('setMin');
const setSec = document.getElementById('setSec');
const setter = document.getElementById('setter');

let tmTotal = 300;
let tmLeft = 300;
let tmRunning = false;
let tmInterval = null;

function formatStopwatch(ms) {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const hundredths = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
}

function tick() {
  const now = performance.now();
  swElapsed = now - swStartTime;
  swDisplay.textContent = formatStopwatch(swElapsed);
  swRaf = requestAnimationFrame(tick);
}

function startStopwatch() {
  if (swRunning) {
    cancelAnimationFrame(swRaf);
    swRunning = false;
    swStart.textContent = 'Start';
    swStart.classList.remove('running');
    swLap.disabled = true;
  } else {
    swStartTime = performance.now() - swElapsed;
    swRaf = requestAnimationFrame(tick);
    swRunning = true;
    swStart.textContent = 'Pause';
    swStart.classList.add('running');
    swLap.disabled = false;
    swReset.disabled = false;
  }
}

function addLap() {
  if (!swRunning) return;
  const previous = laps.length ? laps[laps.length - 1].total : 0;
  const split = swElapsed - previous;
  laps.push({ total: swElapsed, split });
  renderLaps();
}

function renderLaps() {
  lapList.innerHTML = '';
  lapsEmpty.hidden = laps.length !== 0;

  const splits = laps.map((l) => l.split);
  const minSplit = Math.min(...splits);
  const maxSplit = Math.max(...splits);

  laps.forEach((lap, i) => {
    const li = document.createElement('li');
    li.className = 'lap-item';
    if (laps.length > 1 && lap.split === minSplit) li.classList.add('fastest');
    if (laps.length > 1 && lap.split === maxSplit) li.classList.add('slowest');
    li.innerHTML = `<span>Lap ${i + 1}</span><span>${formatStopwatch(lap.split)}</span><span>${formatStopwatch(lap.total)}</span>`;
    lapList.prepend(li);
  });
}

function resetStopwatch() {
  cancelAnimationFrame(swRaf);
  swRunning = false;
  swElapsed = 0;
  laps = [];
  swDisplay.textContent = '00:00.00';
  swStart.textContent = 'Start';
  swStart.classList.remove('running');
  swLap.disabled = true;
  swReset.disabled = true;
  renderLaps();
}

function formatTimer(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateRing() {
  const pct = tmTotal === 0 ? 0 : (tmLeft / tmTotal) * 100;
  ring.style.setProperty('--p', pct);
  tmDisplay.textContent = formatTimer(tmLeft);
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const times = [0, 0.35, 0.7];
    times.forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.25);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.3);
    });
  } catch (err) {
    return;
  }
}

function startTimer() {
  if (tmRunning) {
    clearInterval(tmInterval);
    tmRunning = false;
    tmStart.textContent = 'Resume';
    tmLabel.textContent = 'Paused';
    return;
  }

  if (tmLeft <= 0) return;

  tmRunning = true;
  tmStart.textContent = 'Pause';
  tmStart.classList.add('running');
  tmLabel.textContent = 'Running';
  ring.classList.remove('done');

  tmInterval = setInterval(() => {
    tmLeft--;
    updateRing();
    if (tmLeft <= 0) {
      clearInterval(tmInterval);
      tmRunning = false;
      tmStart.textContent = 'Start';
      tmStart.classList.remove('running');
      tmLabel.textContent = 'Time up!';
      ring.classList.add('done');
      beep();
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(tmInterval);
  tmRunning = false;
  tmTotal = Math.max(1, Number(setMin.value) * 60 + Number(setSec.value));
  tmLeft = tmTotal;
  ring.classList.remove('done');
  tmStart.textContent = 'Start';
  tmStart.classList.remove('running');
  tmLabel.textContent = 'Ready';
  updateRing();
}

function applyPreset(seconds) {
  setMin.value = Math.floor(seconds / 60);
  setSec.value = seconds % 60;
  resetTimer();
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('is-active', t === tab));
    document.getElementById('stopwatchPanel').classList.toggle('active', tab.dataset.tab === 'stopwatch');
    document.getElementById('timerPanel').classList.toggle('active', tab.dataset.tab === 'timer');
  });
});

swStart.addEventListener('click', startStopwatch);
swLap.addEventListener('click', addLap);
swReset.addEventListener('click', resetStopwatch);

document.querySelectorAll('.presets button').forEach((btn) => {
  btn.addEventListener('click', () => applyPreset(Number(btn.dataset.seconds)));
});

setMin.addEventListener('change', resetTimer);
setSec.addEventListener('change', resetTimer);
tmStart.addEventListener('click', startTimer);
tmReset.addEventListener('click', resetTimer);

document.addEventListener('keydown', (e) => {
  if (e.key === ' ' && document.getElementById('stopwatchPanel').classList.contains('active') && e.target.tagName !== 'INPUT') {
    e.preventDefault();
    startStopwatch();
  }
});

resetTimer();
