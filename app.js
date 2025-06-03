const dateInput = document.getElementById('cross-date');
const countryInput = document.getElementById('cross-country');
const residenceInput = document.getElementById('residence-country');
const addBtn = document.getElementById('add-btn');
const cancelBtn = document.getElementById('cancel-btn');
const tableBody = document.querySelector('#cross-table tbody');
const fromInput = document.getElementById('stat-from');
const toInput = document.getElementById('stat-to');
const calcBtn = document.getElementById('calc-btn');
const resultDiv = document.getElementById('stats-result');
const pieCanvas = document.getElementById('pie-chart');
const barCanvas = document.getElementById('bar-chart');
const countryList = document.getElementById('country-list');
const presetSelect = document.getElementById('stat-preset');
const groupSelect = document.getElementById('stat-group');
const exportBtn = document.getElementById('export-btn');
const importFile = document.getElementById('import-file');

let entries = loadEntries();
let editIndex = null;
let residence = loadResidence();
renderTable();
residenceInput.value = residence;
updateCountryList();
updateStats();

presetSelect.addEventListener('change', () => {
  const days = parseInt(presetSelect.value, 10);
  if (days) {
    const to = new Date();
    toInput.value = to.toISOString().slice(0, 10);
    const from = new Date();
    from.setDate(from.getDate() - days + 1);
    fromInput.value = from.toISOString().slice(0, 10);
  } else {
    fromInput.value = '';
    toInput.value = '';
  }
  updateStats();
});

fromInput.addEventListener('input', updateStats);
toInput.addEventListener('input', updateStats);
groupSelect.addEventListener('change', updateStats);

addBtn.addEventListener('click', () => {
  if (!dateInput.value || !countryInput.value) return;
  const data = { date: dateInput.value, country: countryInput.value.trim() };
  if (editIndex === null) {
    entries.push(data);
  } else {
    entries[editIndex] = data;
    addBtn.textContent = 'Add';
    cancelBtn.style.display = 'none';
    editIndex = null;
  }
  saveEntries();
  renderTable();
  updateCountryList();
  updateStats();
  dateInput.value = '';
  countryInput.value = '';
});

cancelBtn.addEventListener('click', () => {
  editIndex = null;
  dateInput.value = '';
  countryInput.value = '';
  addBtn.textContent = 'Add';
  cancelBtn.style.display = 'none';
});

residenceInput.addEventListener('input', () => {
  residence = residenceInput.value.trim();
  saveResidence();
  updateCountryList();
  updateStats();
});

calcBtn.addEventListener('click', () => {
  updateStats();
});

exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(entries)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'border-data.json';
  a.click();
  URL.revokeObjectURL(url);
});

importFile.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    try {
      entries = JSON.parse(evt.target.result);
      saveEntries();
      renderTable();
      updateCountryList();
      updateStats();
    } catch {}
  };
  reader.readAsText(file);
});

tableBody.addEventListener('click', e => {
  if (e.target.classList.contains('edit-btn')) {
    const index = parseInt(e.target.dataset.index, 10);
    const entry = entries[index];
    dateInput.value = entry.date;
    countryInput.value = entry.country;
    editIndex = index;
    addBtn.textContent = 'Save';
    cancelBtn.style.display = 'inline';
  }
});

function loadEntries() {
  const data = localStorage.getItem('entries');
  return data ? JSON.parse(data) : [];
}

function loadResidence() {
  return localStorage.getItem('residence') || '';
}

function saveResidence() {
  localStorage.setItem('residence', residence);
}

function saveEntries() {
  localStorage.setItem('entries', JSON.stringify(entries));
}

function renderTable() {
  tableBody.innerHTML = '';
  entries.sort((a, b) => a.date.localeCompare(b.date));
  entries.forEach((e, i) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${e.date}</td><td>${e.country}</td><td><button class="edit-btn" data-index="${i}">Edit</button></td>`;
    tableBody.appendChild(row);
  });
}

function updateCountryList() {
  const countries = new Set(entries.map(e => e.country));
  if (residence) countries.add(residence);
  countryList.innerHTML = '';
  Array.from(countries).sort().forEach(c => {
    const o = document.createElement('option');
    o.value = c;
    countryList.appendChild(o);
  });
}

function countDays(from, to, group) {
  const start = new Date(from);
  const end = new Date(to);
  const stats = {};
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.toISOString().slice(0, 10);
    let label = 'Total';
    if (group === 'year') label = d.getFullYear();
    if (group === 'month') label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (group === '180') {
      const diff = Math.floor((d - start) / 86400000);
      label = `Period ${Math.floor(diff / 180) + 1}`;
    }
    if (!stats[label]) stats[label] = {};
    let i = -1;
    for (let j = 0; j < entries.length; j++) {
      if (entries[j].date <= day) i = j; else break;
    }
    if (i >= 0) {
      const c = entries[i].country;
      stats[label][c] = (stats[label][c] || 0) + 1;
      if (day === entries[i].date && i > 0) {
        const pc = entries[i - 1].country;
        stats[label][pc] = (stats[label][pc] || 0) + 1;
      }
    }
  }
  return stats;
}

function displayStats(stats) {
  resultDiv.textContent = '';
  const overall = {};
  for (const [label, data] of Object.entries(stats)) {
    const box = document.createElement('div');
    if (label !== 'Total' || Object.keys(stats).length > 1) {
      const h = document.createElement('h3');
      h.textContent = label;
      box.appendChild(h);
    }
    for (const [c, d] of Object.entries(data)) {
      overall[c] = (overall[c] || 0) + d;
      const p = document.createElement('p');
      p.textContent = `${c}: ${formatDuration(d)}`;
      box.appendChild(p);
    }
    resultDiv.appendChild(box);
  }
  const total = Object.values(overall).reduce((a, b) => a + b, 0);
  drawCharts(overall, total);
  if (residence && residence.toLowerCase() === 'poland') {
    const outside = total - (overall[residence] || 0);
    const left = 183 - outside;
    const info = document.createElement('p');
    info.textContent = `Days outside Poland left this year: ${left > 0 ? left : 0}`;
    resultDiv.appendChild(info);
  }
}

function formatDuration(days) {
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  let t = '';
  if (years) t += `${years} year${years > 1 ? 's' : ''} `;
  if (months) t += `${months} month${months > 1 ? 's' : ''} `;
  return `${t.trim()}(${days} days)`;
}

function drawPieChart(stats, total) {
  const ctx = pieCanvas.getContext('2d');
  ctx.clearRect(0, 0, pieCanvas.width, pieCanvas.height);
  let start = 0;
  const colors = ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56', '#8bc34a'];
  let i = 0;
  for (const d of Object.values(stats)) {
    const slice = (d / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(150, 150);
    ctx.fillStyle = colors[i++ % colors.length];
    ctx.arc(150, 150, 150, start, start + slice);
    ctx.fill();
    start += slice;
  }
}

function drawBarChart(stats) {
  const ctx = barCanvas.getContext('2d');
  ctx.clearRect(0, 0, barCanvas.width, barCanvas.height);
  const keys = Object.keys(stats);
  const values = Object.values(stats);
  const max = Math.max(...values, 1);
  const barWidth = barCanvas.width / keys.length;
  const colors = ['#36a2eb', '#ff6384', '#cc65fe', '#ffce56', '#8bc34a'];
  keys.forEach((k, i) => {
    const h = (values[i] / max) * (barCanvas.height - 20);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(i * barWidth + 5, barCanvas.height - h, barWidth - 10, h);
    ctx.fillStyle = '#000';
    ctx.fillText(k.slice(0, 3), i * barWidth + 5, barCanvas.height - 5);
  });
}

function drawCharts(stats, total) {
  drawPieChart(stats, total);
  drawBarChart(stats);
}

function updateStats() {
  if (!fromInput.value || !toInput.value) return;
  const stats = countDays(fromInput.value, toInput.value, groupSelect.value);
  displayStats(stats);
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js');
}
