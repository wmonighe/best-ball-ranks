const csvUrl = 'https://docs.google.com/spreadsheets/d/1rNouBdE-HbWafu-shO_5JLPSrLhr-xuGpXYfyOI-2oY/gviz/tq?tqx=out:csv&gid=148406078';

/**
 * Fetch rankings from the public Google Sheet.
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
 * @returns {Promise<Map<string,string>>}
 */
async function fetchSentiment() {
  const url = 'https://taeks.com/nfl/bestball/leaderboard/rookie';
  try {
    const resp = await fetch(url);
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
            const val = cells[sentimentIdx].textContent.trim();
            map.set(name, val);
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
 * Load data and populate the table.
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

  const nameKey = Object.keys(rows[0]).find((k) => /player|name/i.test(k));

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

  const tbody = table.querySelector('tbody');
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    Object.values(row).forEach((val) => {
      const td = document.createElement('td');
      td.textContent = String(val).replace(/,/g, '');
      tr.appendChild(td);
    });
    const tdSentiment = document.createElement("td");
    const lookupName = nameKey ? row[nameKey].toUpperCase() : "";
    tdSentiment.textContent = lookupName ? sentimentMap.get(lookupName) || "" : "";
    tr.appendChild(tdSentiment);
    tbody.appendChild(tr);
  });
}

loadData();