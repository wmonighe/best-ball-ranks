// Rankings are loaded from the public Google Sheet using the gviz CSV export.
// The sheet must be published to the web for this request to succeed.
const csvUrl =
  'https://docs.google.com/spreadsheets/d/1rNouBdE-HbWafu-shO_5JLPSrLhr-xuGpXYfyOI-2oY/gviz/tq?tqx=out:csv&gid=148406078';

function fetchRankings() {
  fetch(csvUrl)
    .then((response) => response.text())
    .then((csvText) => {
      const results = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
      });
      populateTable(results.data);
    })
    .catch((err) => {
      const table = document.getElementById('rankings-table');
      table.innerHTML = '<caption>Unable to load rankings.</caption>';
      console.error(err);
    });
}

function populateTable(rows) {
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
      td.textContent = String(row[key] || '').replace(/,/g, '');
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

fetchRankings();
