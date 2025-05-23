
# Best Ball Rankings

This project displays Best Ball Eliminator rankings sourced from a Google Sheet. The sheet must be published to the web so the CSV can be fetched from the `gviz` endpoint. Sentiment data is scraped from [taeks.com](https://taeks.com/nfl/bestball/leaderboard/rookie) and shown alongside each player.

Open `index.html` in a browser to view the rankings table.

# Best Ball Ranks

This site displays **wmonighe's Best Ball Eliminator** rankings.

The rankings are stored in a Google Sheet and fetched using the Google Sheets
`gviz` CSV export. Make sure the sheet is **published to the web** or the fetch
will fail.

Open `index.html` in a browser to view the table.

This project displays my Best Ball Eliminator rankings using a simple HTML
page. Rankings are loaded from a Google Sheet via its `gviz` CSV export.
For the URL to work the sheet must be **published to the web** so the CSV
endpoint is publicly accessible.

A "Sentiment" column is added by scraping data from
[taeks.com](https://taeks.com/nfl/bestball/leaderboard/rookie). Network
restrictions or cross‑origin policies may prevent this data from loading
successfully when the page is hosted elsewhere.

