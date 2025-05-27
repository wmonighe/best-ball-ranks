const rankingsUrl =
  'https://docs.google.com/spreadsheets/d/1rNouBdE-HbWafu-shO_5JLPSrLhr-xuGpXYfyOI-2oY/gviz/tq?tqx=out:csv&gid=148406078';
const sentimentUrl =
  'https://docs.google.com/spreadsheets/d/1rNouBdE-HbWafu-shO_5JLPSrLhr-xuGpXYfyOI-2oY/gviz/tq?tqx=out:csv&gid=1912864828';

async function fetchCsv(url) {
  const response = await fetch(url);
  const csvText = await response.text();
  const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  return results.data;
}

async function fetchRankings() {
  return fetchCsv(rankingsUrl);
}

async function fetchSentiments() {
  const rows = await fetchCsv(sentimentUrl);
  const nameKey = Object.keys(rows[0]).find(h => /player|name/i.test(h));
  const sentimentKey = Object.keys(rows[0]).find(h => /sentiment/i.test(h));
  const map = new Map();
  if (!nameKey || !sentimentKey) return map;
  rows.forEach(row => {
    const name = String(row[nameKey] || '').trim().toUpperCase();
    const value = row[sentimentKey];
    if (name) map.set(name, value);
  });
  return map;
}

async function loadData() {
  try {
    const [rows, sentimentMap] = await Promise.all([
      fetchRankings(),
      fetchSentiments(),
    ]);
    populateTable(rows, sentimentMap);
  } catch (err) {
    const table = document.getElementById('rankings-table');
    table.innerHTML = '<caption>Unable to load rankings.</caption>';
    console.error(err);
  }
}

function populateTable(rows, sentimentMap) {
  const table = document.getElementById('rankings-table');
  if (rows.length === 0) return;

  const allHeaders = Object.keys(rows[0]);
  const filteredHeaders = [];
  const nameKey = allHeaders.find(h => /player|name/i.test(h));

  allHeaders.forEach(h => {
    if (!h || h.trim() === '') return;
    if (/dead\s*cap/i.test(h) || /notes/i.test(h) || /contract/i.test(h)) return;
    if (/sentiment/i.test(h)) return;
    if (!filteredHeaders.includes(h)) filteredHeaders.push(h);
  });

  const idIdx = filteredHeaders.findIndex(h => /^id$/i.test(h));
  if (idIdx > 0) {
    const [idHeader] = filteredHeaders.splice(idIdx, 1);
    filteredHeaders.unshift(idHeader);
  }

  filteredHeaders.push('Sentiment');

  const thead = table.querySelector('thead');
  thead.innerHTML = '';
  const headerRow = document.createElement('tr');
  filteredHeaders.forEach(key => {
    const th = document.createElement('th');
    th.textContent = key;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  const tbody = table.querySelector('tbody');
  tbody.innerHTML = '';
  rows.forEach(row => {
    const tr = document.createElement('tr');
    filteredHeaders.forEach(key => {
      const td = document.createElement('td');
      if (key === 'Sentiment') {
        const name = nameKey ? row[nameKey].toUpperCase() : '';
        td.textContent = name ? sentimentMap.get(name) || '' : '';
      } else {
        td.textContent = String(row[key] || '').replace(/,/g, '');
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

loadData();
