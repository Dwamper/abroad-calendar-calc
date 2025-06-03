const dateInput = document.getElementById('cross-date');
const countryInput = document.getElementById('cross-country');
const addBtn = document.getElementById('add-btn');
const cancelBtn = document.getElementById('cancel-btn');
const tableBody = document.querySelector('#cross-table tbody');
const fromInput = document.getElementById('stat-from');
const toInput = document.getElementById('stat-to');
const calcBtn = document.getElementById('calc-btn');
const resultDiv = document.getElementById('stats-result');
const chartCanvas = document.getElementById('chart');
const exportBtn = document.getElementById('export-btn');
const importFile = document.getElementById('import-file');

let entries = loadEntries();
let editIndex = null;
renderTable();

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

calcBtn.addEventListener('click', () => {
  if (!fromInput.value || !toInput.value) return;
  const stats = countDays(fromInput.value, toInput.value);
  displayStats(stats);
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

function countDays(from, to) {
  const start = new Date(from);
  const end = new Date(to);
  const stats = {};
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.toISOString().slice(0, 10);
    let i = -1;
    for (let j = 0; j < entries.length; j++) {
      if (entries[j].date <= day) i = j; else break;
    }
    if (i >= 0) {
      const c = entries[i].country;
      stats[c] = (stats[c] || 0) + 1;
      if (day === entries[i].date && i > 0) {
        const pc = entries[i - 1].country;
        stats[pc] = (stats[pc] || 0) + 1;
      }
    }
  }
  return stats;
}

function displayStats(stats) {
  resultDiv.textContent = '';
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  for (const [c, d] of Object.entries(stats)) {
    const p = document.createElement('p');
    p.textContent = `${c}: ${d} days`;
    resultDiv.appendChild(p);
  }
  drawChart(stats, total);
}

function drawChart(stats, total) {
  const ctx = chartCanvas.getContext('2d');
  ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
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

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js');
}
