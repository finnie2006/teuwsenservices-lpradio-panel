# Radio Panel

Interactive vinyl-style radio panel for Grafana. The panel supports weekday-based station scheduling, optional timed override, and now playing metadata per station.

## Screenshots

![Compact panel view](https://raw.githubusercontent.com/finnie2006/teuwsenservices-lpradio-panel/main/src/img/screenshot-1.png)
![Dashboard view](https://raw.githubusercontent.com/finnie2006/teuwsenservices-lpradio-panel/main/src/img/screenshot-2.png)

## Features

- Clickable vinyl disk UI that plays a configured radio stream.
- Day-by-day station setup or one shared station for all days.
- Optional station presets with per-day preset selection.
- Timed override for selected weekdays starting at a specific hour.
- Now playing presets for NPO Sterren NL, Arrow Classic Rock, and custom JSON APIs.
- Optional continuous playback mode for dashboard playlist transitions.
- Styling controls for panel, disk, and label borders.
- Grafana variable support in station name, stream URL, and logo URL.

## Station presets

You can optionally use presets as a faster way to configure day schedules.

1. Enable `Use station presets for days` in panel options.
2. Configure preset slots in the `Presets` category.
3. Select a preset per day in the `Stations` category.
4. Choose `No preset` for a day to use that day's custom station fields.

This is additive and non-breaking: existing day-by-day station setup continues to work.

## Now Playing and CORS

This panel runs in the browser as a Grafana panel plugin and cannot use Grafana's server-side data source proxy for arbitrary HTTP requests. Some external now-playing APIs block browser-origin requests due to CORS policy.

The Arrow Classic Rock preset uses `r.jina.ai` as a default CORS-friendly wrapper so metadata can be fetched in browser context.

You can set one global CORS proxy for all stations with the panel option `Now playing CORS proxy URL`.
- Leave empty to use the preset default behavior.
- Use a URL prefix (for example `https://r.jina.ai/`) to prepend the API URL.
- Or use `{{url}}` placeholder when your proxy expects a query parameter (for example `https://my-proxy.example/fetch?url={{url}}`).

When a now-playing request is blocked by CORS (or another network-level browser restriction), the panel stops polling that endpoint for the active station and falls back to the normal station/status text. When a configured API responds successfully but has no current track, the panel shows a dedicated placeholder such as `No track available` instead of the old station status text.

## Add your own now-playing API

Yes. You can configure your own endpoint without code changes:

1. Set the station `now playing preset` to `Custom JSON API`.
2. Fill in `now playing API URL` with your endpoint.
3. Optionally set `Now playing CORS proxy URL` when the endpoint blocks browser CORS.
4. If the API is valid but no track is currently returned, the panel shows the `No track available text` option from the Display settings.

The custom parser tries common keys such as `artist`, `title`, `song`, `track`, `image`, and `coverUrl`, as well as common nested structures like `tracks[0]`, `currentTrack`, `latestTrack`, and `data.items`.

### Example: Mediahuis playlist

```text
https://api.mediahuisradio.nl/api/nowplaying/playlist?stationKey=slam&brand=slam
```

Example payload shape:

```json
{
  "stationKey": "slam",
  "tracks": [
    {
      "artist": "Mau P",
      "title": "Neck",
      "albumArt": "https://cdn-metadata.mediahuisradio.nl/metadata/covers/abc123.jpg"
    }
  ]
}
```

This is supported without code changes.

## Requirements

- Grafana `>=12.3.0`

## Support

- Repository: https://github.com/finnie2006/teuwsenservices-lpradio-panel
- Issues: https://github.com/finnie2006/teuwsenservices-lpradio-panel/issues
