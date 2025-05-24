// Rankings are loaded from the public Google Sheet using the gviz CSV export.
// The sheet must be published to the web for this request to succeed.
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
  let seenSentiment = false;
  allHeaders.forEach((h) => {
    if (/notes/i.test(h) || /contract/i.test(h)) {
      return; // skip hidden columns
    }
    if (/sentiment/i.test(h)) {
      if (!seenSentiment) {
        filteredHeaders.push(h);
        seenSentiment = true;
      }
      return;
    }
    if (!filteredHeaders.includes(h)) {
      filteredHeaders.push(h);
    }
  });

  const idIndex = filteredHeaders.findIndex((h) => /^id$/i.test(h));
  if (idIndex > 0) {
    const [idHeader] = filteredHeaders.splice(idIndex, 1);
    filteredHeaders.unshift(idHeader);
  }

  // Ensure there is a Sentiment column even if it wasn't in the sheet
  if (!filteredHeaders.some((h) => /sentiment/i.test(h))) {
    filteredHeaders.push('Sentiment');
  }

  const nameKey = allHeaders.find((k) => /player|name/i.test(k));

  const headerRow = document.createElement('tr');
  filteredHeaders.forEach((key) => {
    const th = document.createElement('th');
    th.textContent = key;
    headerRow.appendChild(th);
  });
  table.querySelector('thead').appendChild(headerRow);

  const tbody = table.querySelector('tbody');
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    filteredHeaders.forEach((key) => {
      const td = document.createElement('td');
      if (/sentiment/i.test(key) && !row[key]) {
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
