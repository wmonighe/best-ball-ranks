// Rankings are loaded from the public Google Sheet using the gviz CSV export.
// The sheet must be published to the web for this to succeed.
const csvUrl =
  'https://docs.google.com/spreadsheets/d/1rNouBdE-HbWafu-shO_5JLPSrLhr-xuGpXYfyOI-2oY/gviz/tq?tqx=out:csv&gid=148406078';

async function fetchRankings() {
  try {
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    const results = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });
    const sentimentMap = await fetchSentiments();
    populateTable(results.data, sentimentMap);
  } catch (err) {
    const table = document.getElementById('rankings-table');
    table.innerHTML = '<caption>Unable to load rankings.</caption>';
    console.error(err);
  }
}

async function fetchSentiments() {
  const sentimentUrl =
    'https://taeks.com/nfl/bestball/leaderboard/rookie';

  try {
    const response = await fetch(sentimentUrl);
    const html = await response.text();
    return parseSentimentHtml(html);
  } catch (err) {
    console.error('Failed to fetch sentiment data', err);
    return {};
  }
}

function parseSentimentHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  if (!table) return {};

  const headers = Array.from(table.querySelectorAll('thead th')).map((th) =>
    th.textContent.trim().toLowerCase()
  );
  const nameIdx = headers.findIndex((h) => h.includes('player') || h === 'name');
  const sentimentIdx = headers.findIndex((h) => h.includes('sentiment'));

  const map = {};
  if (nameIdx === -1 || sentimentIdx === -1) return map;

  table.querySelectorAll('tbody tr').forEach((tr) => {
    const cells = tr.querySelectorAll('td');
    if (cells.length > Math.max(nameIdx, sentimentIdx)) {
      const name = cells[nameIdx].textContent.trim().toUpperCase();
      const val = cells[sentimentIdx].textContent.trim();
      map[name] = val;
    }
  });

  return map;
}

function populateTable(rows, sentimentMap) {
  const table = document.getElementById('rankings-table');
  if (rows.length === 0) return;

  const headerRow = document.createElement('tr');
  const keys = Object.keys(rows[0]);
  keys.forEach((key) => {
    const th = document.createElement('th');
    th.textContent = key;
    headerRow.appendChild(th);
  });
  const sentimentTh = document.createElement('th');
  sentimentTh.textContent = 'Sentiment';
  headerRow.appendChild(sentimentTh);
  table.querySelector('thead').appendChild(headerRow);

  const tbody = table.querySelector('tbody');
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    keys.forEach((key) => {
      const td = document.createElement('td');
      td.textContent = row[key];
      tr.appendChild(td);
    });

    const sentimentTd = document.createElement('td');
    const nameKey = keys.find((k) => k.toLowerCase().includes('player') || k.toLowerCase() === 'name');
    const lookupName = nameKey ? row[nameKey].toUpperCase() : '';
    sentimentTd.textContent = sentimentMap[lookupName] || '';
    tr.appendChild(sentimentTd);

    tbody.appendChild(tr);
  });
}

fetchRankings();