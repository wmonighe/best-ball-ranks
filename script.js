// Use the Google Sheets CSV export URL. This assumes the sheet is
// published and publicly accessible.
const csvUrl =
  'https://docs.google.com/spreadsheets/d/1rNouBdE-HbWafu-shO_5JLPSrLhr-xuGpXYfyOI-2oY/gviz/tq?tqx=out:csv&gid=148406078';

function fetchRankings() {
    fetch(csvUrl)
        .then(response => response.text())
        .then(csvText => {
            const results = Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true
            });
            populateTable(results.data);
        })
        .catch(err => {
            const table = document.getElementById('rankings-table');
            table.innerHTML = '<caption>Unable to load rankings.</caption>';
            console.error(err);
        });
}

function populateTable(rows) {
    const table = document.getElementById('rankings-table');
    if (rows.length === 0) return;

    // Build table header
    const headerRow = document.createElement('tr');
    Object.keys(rows[0]).forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        headerRow.appendChild(th);
    });
    table.querySelector('thead').appendChild(headerRow);

    // Build rows
    const tbody = table.querySelector('tbody');
    rows.forEach(row => {
        const tr = document.createElement('tr');
        Object.values(row).forEach(val => {
            const td = document.createElement('td');
            td.textContent = val;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

fetchRankings();
