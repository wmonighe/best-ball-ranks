const csvUrl =
  'https://docs.google.com/spreadsheets/d/1rNouBdE-HbWafu-shO_5JLPSrLhr-xuGpXYfyOI-2oY/gviz/tq?tqx=out:csv&gid=148406078';

async function fetchRankings() {
  const response = await fetch(csvUrl);
  const csvText = await response.text();
  const results = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  return results.data;
}

async function fetchSentiment() {
  try {
    const response = await fetch(
      'https://taeks.com/nfl/bestball/leaderboard/rookie'
    );
    const html = await response.text();
    const parser = new DOMParser();
    const documentFragment = parser.parseFromString(html, 'text/html');
    const table = documentFragment.querySelector('table');
    const sentimentMap = new Map();
    if (table) {
      const rows = table.querySelectorAll('tr');
      if (rows.length > 1) {
        const headers = Array.from(rows[0].querySelectorAll('th'));
        const nameIndex = headers.findIndex((th) =>
          th.textContent.trim().toLowerCase().includes('player')
        );
        const sentimentIndex = headers.findIndex((th) =>
          th.textContent.trim().toLowerCase().includes('sentiment')
        );
        for (let i = 1; i < rows.length; i += 1) {
          const cells = rows[i].querySelectorAll('td');
          if (
            nameIndex >= 0 &&
            sentimentIndex >= 0 &&
            cells[nameIndex] &&
            cells[sentimentIndex]
          ) {
            const name = cells[nameIndex].textContent.trim().toUpperCase();
            const value = cells[sentimentIndex].textContent.trim();
            sentimentMap.set(name, value);
          }
        }
      }
    }
    return sentimentMap;
  } catch (error) {
    console.error('Unable to fetch sentiment data', error);
    return new Map();
  }
}

async function loadData() {
  try {
    const [rows, sentimentMap] = await Promise.all([
      fetchRankings(),
      fetchSentiment(),
    ]);
    populateTable(rows, sentimentMap);
  } catch (error) {
    const table = document.getElementById('rankings-table');
    table.innerHTML = '<caption>Unable to load rankings.</caption>';
    console.error(error);
  }
}

function populateTable(rows, sentimentMap) {
  const table = document.getElementById('rankings-table');
  if (rows.length === 0) {
    return;
  }
  const nameKey = Object.keys(rows[0]).find((key) => /player|name/i.test(key));

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
    Object.values(row).forEach((value) => {
      const td = document.createElement('td');
      td.textContent = String(value).replace(/,/g, '');
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