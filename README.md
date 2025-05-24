# Best Ball Ranks

This project displays wmonighe's Best Ball Eliminator rankings in a simple web interface. Rankings are loaded from a public Google Sheet and displayed in a styled table. The page also attempts to fetch sentiment values from taeks.com and shows them in a separate column.

## Setup
1. Ensure the Google Sheet is published to the web so that the CSV is publicly accessible.
2. Open `index.html` in a browser. The page will fetch the rankings and populate the table automatically.

## Development
- Rankings are fetched using the Google Sheets gviz CSV export for CORS support.
- Values containing commas are sanitized before display.
- The script also tries to scrape sentiment data from taeks.com. If that request fails, the Sentiment column may be blank.

To run tests (if configured), execute:

```bash
npm test
```

No test setup is included yet, so this command may fail until configured.
