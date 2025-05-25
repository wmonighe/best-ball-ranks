// Rankings are loaded from the public Google Sheet using the gviz CSV export.
// The sheet must be published to the web for this to succeed.
const csvUrl =
  'https://docs.google.com/spreadsheets/d/1rNouBdE-HbWafu-shO_5JLPSrLhr-xuGpXYfyOI-2oY/gviz/tq?tqx=out:csv&gid=148406078';

/**
 * Fetch rankings from the Google Sheet.
 * @returns {Promise<Array<Object>>}
 */
async function fetchRankings() {
  const response = await fetch(csvUrl);
  const csvText = await response.text();
  const results = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  return results.data;
}

/**
 * Fetch sentiment data from taeks.com.
 * @returns {Promise<Map<string, string>>}
 */
async function fetchSentiment() {
  try {
    const resp = await fetch('https://taeks.com/nfl/bestball/leaderboard/rookie');
    const html = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const table = doc.querySelector('table');
    const map = new Map();

    if (table) {
      const rows = table.querySelectorAll('tr');
      if (rows.length > 0) {
        const headers = Array.from(rows[0].querySelectorAll('th'));
        const playerIdx = headers.findIndex((th) =>
          th.textContent.trim().toLowerCase().includes('player')
        );
        const sentimentIdx = headers.findIndex((th) =>
          th.textContent.trim().toLowerCase().includes('sentiment')
        );
        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i].querySelectorAll('td');
          if (
            playerIdx >= 0 &&
            sentimentIdx >= 0 &&
            cells[playerIdx] &&
            cells[sentimentIdx]
          ) {
            const name = cells[playerIdx].textContent.trim().toUpperCase();
            const sentiment = cells[sentimentIdx].textContent.trim();
            map.set(name, sentiment);
          }
        }
      }
    }
    return map;
  } catch (err) {
    console.error('Unable to fetch sentiment data', err);
    return new Map();
  }
}

/**
 * Load rankings and sentiment information, then populate the table.
 */
async function loadData() {
  try {
    const [rows, sentimentMap] = await Promise.all([
      fetchRankings(),
      fetchSentiment(),
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
  const nameKey = allHeaders.find((h) => /player|name/i.test(h));

  // Filter headers: skip blank columns, Dead Cap, Notes, Contract, and any Sentiment column from the sheet
  allHeaders.forEach((h) => {
    if (!h || h.trim() === '') return;
    if (/dead\s*cap/i.test(h) || /notes/i.test(h) || /contract/i.test(h)) return;
    if (/sentiment/i.test(h)) return;
    if (!filteredHeaders.includes(h)) filteredHeaders.push(h);
  });

  // Move ID column to the far left if present
  const idIdx = filteredHeaders.findIndex((h) => /^id$/i.test(h));
  if (idIdx > 0) {
    const [idHeader] = filteredHeaders.splice(idIdx, 1);
    filteredHeaders.unshift(idHeader);
  }

  // Add our Sentiment column
  filteredHeaders.push('Sentiment');

  // Build table header
  const thead = table.querySelector('thead');
  thead.innerHTML = '';
  const headerRow = document.createElement('tr');
  filteredHeaders.forEach((key) => {
    const th = document.createElement('th');
    th.textContent = key;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // Build rows
  const tbody = table.querySelector('tbody');
  tbody.innerHTML = '';
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    filteredHeaders.forEach((key) => {
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
