# LeadScan Chrome Extension

LeadScan is a lightweight Chrome extension that scans the current webpage for public contact details, shows the results in a popup, stores saved leads locally in the browser, and exports saved leads to CSV.

This project is fully client-side:

- No backend
- No login
- No API keys
- No external fetch calls
- No cloud database

The extension source lives in [`lead-gen-extension/`](./lead-gen-extension).

## Features

- Scan the live DOM of the current page
- Extract public emails from page text and `mailto:` links
- Extract phone numbers from page text and `tel:` links
- Detect company or page name
- Capture page description metadata
- Find social links such as LinkedIn, Twitter/X, Facebook, and Instagram
- Save leads in `chrome.storage.local`
- View saved leads inside the popup
- Remove individual leads
- Clear all saved leads
- Export all saved leads as a CSV file

## How It Works

1. You open any website in Chrome.
2. You click the LeadScan extension icon.
3. The popup sends a `scan` message to the active tab.
4. The content script reads the page DOM and extracts contact-related data.
5. The popup renders the results immediately.
6. If you click `Save Lead`, the data is stored locally using `chrome.storage.local`.
7. The `Saved` tab displays all saved entries and can export them to CSV.

If the content script is not available on the page yet, the popup falls back to injecting it using `chrome.scripting.executeScript`.

## What Gets Extracted

Each scan returns a lead object with the following fields:

```json
{
  "company_name": "Example Company",
  "domain": "example.com",
  "source_url": "https://example.com",
  "description": "Short page description",
  "emails": ["hello@example.com"],
  "phones": ["+1 555 123 4567"],
  "linkedin": "https://linkedin.com/company/example",
  "twitter": "https://x.com/example",
  "facebook": "https://facebook.com/example",
  "instagram": "https://instagram.com/example",
  "saved_at": "2026-03-18T12:00:00.000Z"
}
```

## Data Rules

The current extractor applies a few basic rules:

- Deduplicates emails and phone numbers
- Filters obvious junk emails such as `example.com`
- Filters image-like false positives such as `@2x.png`
- Limits phone results to the first 5 matches
- Uses `og:site_name`, page title, or hostname for company name
- Uses the domain to prevent duplicate saved leads

## Project Structure

```text
lead-gen-extension/
|-- manifest.json
|-- popup.html
|-- popup.js
|-- content.js
|-- background.js
|-- styles.css
`-- icons/
    |-- icon16.png
    |-- icon48.png
    `-- icon128.png
```

## Installation

### Load Unpacked in Chrome

1. Open Chrome.
2. Go to `chrome://extensions/`.
3. Enable `Developer mode` in the top-right.
4. Click `Load unpacked`.
5. Select the [`lead-gen-extension`](./lead-gen-extension) folder.

After loading, the LeadScan icon should appear in your Chrome extensions list.

## Usage

1. Open a website you want to inspect.
2. Click the LeadScan extension icon.
3. Click `Scan This Page`.
4. Review the detected company info, emails, phones, and social links.
5. Click `Save Lead` if you want to keep the result.
6. Open the `Saved` tab to review stored leads.
7. Click `Export CSV` to download your saved leads.

## CSV Export

The exported CSV currently includes:

- Company
- Domain
- Emails
- Phones
- LinkedIn
- Twitter
- Facebook
- Instagram
- Source URL
- Saved At

The downloaded filename is generated like:

```text
leadscan-YYYY-MM-DD.csv
```

## Permissions

The extension uses the following Chrome permissions:

- `activeTab`
  Required to interact with the current tab when the popup is used.

- `scripting`
  Required for the fallback injection of `content.js` if the content script is not already available.

- `storage`
  Required to save leads locally in the browser.

- `host_permissions: <all_urls>`
  Required so the content script can run on websites the user opens.

## Privacy

LeadScan stores data locally in the browser using `chrome.storage.local`.

It does not:

- send data to a server
- require an account
- make external API requests
- use analytics

Any saved leads remain on the local Chrome profile unless the user removes them.

## Limitations

- It only extracts data that is present in the visible or accessible page DOM.
- It does not bypass logins, private sections, CAPTCHAs, or site permissions.
- It may miss data rendered in unusual JavaScript patterns or inside restricted iframes.
- It will not work on restricted Chrome pages such as `chrome://` URLs or the Chrome Web Store.
- Saved lead deduplication is based on `domain`, so only one saved entry per domain is kept.
- Pages like LinkedIn may return limited results because contact details are often not publicly present in the DOM.

## Tested Flow

The implemented flow in this repository is:

- Scan current page
- Display extracted data in the popup
- Save lead locally
- View saved leads
- Remove saved leads
- Clear all saved leads
- Export saved leads to CSV

## Development

There is no build step.

To make changes:

1. Edit files inside [`lead-gen-extension/`](./lead-gen-extension).
2. Open `chrome://extensions/`.
3. Click the refresh icon on the unpacked extension.
4. Re-open the popup and test again.

## Troubleshooting

### The popup says no contact info found

- The page may not contain emails, phone numbers, or social profile links.
- The target site may render data in a way the current extractor does not handle.
- Try scanning a public company homepage with visible contact details.

### The extension does not scan the page

- Make sure you are on a normal website, not `chrome://extensions/` or the Chrome Web Store.
- Reload the extension from `chrome://extensions/` after making changes.
- Refresh the target page and try again.

### Export CSV does nothing

- CSV export only works when there is at least one saved lead.

## Publishing Notes

If you plan to publish this on GitHub, it is worth adding:

- screenshots or a short demo GIF
- a `LICENSE` file
- a `CHANGELOG.md`
- Chrome Web Store packaging instructions if you plan to distribute it

## Repository Layout

At the moment, this repository contains:

- [`agent.md`](./agent.md): the original build specification
- [`lead-gen-extension/`](./lead-gen-extension): the working extension source

## Future Improvements

Possible next steps:

- Add site-specific extraction rules for LinkedIn, Crunchbase, or directory websites
- Add copy buttons for phones and social links
- Add lead tags or notes
- Add import support for previously exported CSV files
- Add pagination or search in saved leads
- Add stronger extraction heuristics for names and company details
