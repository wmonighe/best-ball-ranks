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
 * Fetch sentiment data from taeks.com. Falls back to an empty map on error.
 * @returns {Promise<Map<string,string>>}
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
        const headerCells = Array.from(rows[0].querySelectorAll('th'));
        const playerIdx = headerCells.findIndex((th) =>
          th.textContent.trim().toLowerCase().includes('player'),
        );
        const sentimentIdx = headerCells.findIndex((th) =>
          th.textContent.trim().toLowerCase().includes('sentiment'),
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

  const nameKey = Object.keys(rows[0]).find((k) =>
    /player|name/i.test(k),
  );

  // Build table header
  const headerRow = document.createElement('tr');
  Object.keys(rows[0]).forEach((key) => {
    const th = document.createElement('th');
    th.textContent = key;
    headerRow.appendChild(th);
  });
  const thSentiment = document.createElement('th');
  thSentiment.textContent = 'Sentiment';
  headerRow.appendChild(thSentiment);
  table.querySelector('thead').appendChild(headerRow);

  // Build rows
  const tbody = table.querySelector('tbody');
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    Object.values(row).forEach((val) => {
      const td = document.createElement('td');
      td.textContent = String(val).replace(/,/g, '');
      tr.appendChild(td);
    });

    const tdSentiment = document.createElement('td');
    const name = nameKey ? row[nameKey].toUpperCase() : '';
    tdSentiment.textContent = name ? sentimentMap.get(name) || '' : '';
    tr.appendChild(tdSentiment);

    tbody.appendChild(tr);
  });
}

loadData();
