# LP Radio Panel

Interactive vinyl-style radio panel for Grafana. The panel supports weekday-based station scheduling, optional timed override, and now playing metadata per station.

## Screenshots

![Compact panel view](https://raw.githubusercontent.com/finnie2006/teuwsenservices-lpradio-panel/main/src/img/screenshot-1.png)
![Dashboard view](https://raw.githubusercontent.com/finnie2006/teuwsenservices-lpradio-panel/main/src/img/screenshot-2.png)

## Features

- Clickable vinyl disk UI that plays a configured radio stream.
- Day-by-day station setup or one shared station for all days.
- Timed override for selected weekdays starting at a specific hour.
- Now playing integration presets for NPO Sterren NL and Arrow Classic Rock.
- Optional continuous playback mode for dashboard playlist transitions.
- Styling controls for panel, disk, and label borders.
- Grafana variable support in station name, stream URL, and logo URL.

## Now Playing and CORS

This panel runs in the browser as a Grafana panel plugin and cannot use Grafana's server-side data source proxy for arbitrary HTTP requests.
Some external now-playing APIs block browser-origin requests due to CORS policy.

When a now-playing request is blocked by CORS (or another network-level browser restriction), the panel stops polling that endpoint for the active station and falls back to normal station/status text.
To keep now-playing metadata enabled, use endpoints that allow browser CORS or place a CORS-enabled proxy in front of the metadata API.

## Requirements

- Grafana `>=12.3.0`
- Node.js `>=22` (for local development)

## Getting started

```bash
npm install
npm run dev
```

Run a local Grafana instance with provisioning:

```bash
npm run server
```

## Build and package

Create a production build:

```bash
npm run build
```

Create a distributable ZIP package:

```bash
npm run package:zip
```

## Validation

```bash
npm run typecheck
npm run lint
npm run test:ci
```

## Signing and publishing

For community publication, first submit the plugin for review via Grafana Plugins Admin. After approval, sign a release build with:

```bash
export GRAFANA_ACCESS_POLICY_TOKEN=<your_token>
npx @grafana/sign-plugin@latest
```

## Support

- Repository: https://github.com/finnie2006/teuwsenservices-lpradio-panel
- Issues: https://github.com/finnie2006/teuwsenservices-lpradio-panel/issues
