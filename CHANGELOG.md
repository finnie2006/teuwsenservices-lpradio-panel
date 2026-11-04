# Changelog

## 1.4.0 (2026-11-04)

### Added

- Added a small stop button while the radio plays on a dashboard without a radio panel, with an option to hide it.
- Added an end hour to the timed override.
- Added the option `Only fetch now playing while playing`, enabled by default.
- Playback now resumes after the full page reload Grafana does during long playlist runs, when the browser allows it.

### Changed

- The stream watchdog now runs independently of the panel and checks every 5 seconds instead of following the schedule check interval.
- A stopped panel shows the station name instead of track information by default.
- The timed override is now disabled by default. Saved panels keep their stored setting.
- Station name, stream URL and logo URL can now be left empty instead of falling back to the default station.
- A scheduled station without a stream URL stops the radio. Playback resumes by itself at the next station with a stream.
- Border colors now use a color picker. Existing color values keep working.

### Fixed

- Fixed playback stopping when a playlist moved to a dashboard without a radio panel.
- Fixed the watchdog restarting the stream after a pause from media keys, browser controls, or another radio panel.
- Fixed several radio panels on one dashboard: clicking a panel now plays that panel's station.
- Fixed the `Start hint text` not being visible on stations with now playing metadata.
- Fixed custom JSON APIs showing `[object Object]` or the station name instead of the track for nested payloads.
- Fixed empty strings blocking fallback values in now playing parsing.
- Fixed the previous track staying visible after a station change or a failed now playing request.
- Broken cover images now fall back to the station logo, without retrying endlessly when the logo is broken too.
- Fixed now playing requests without a pause after emptying the schedule check interval field.
- The track text and disc now fit in small panels.

## 1.3.0 (2026-08-12)

### Added

- Added broader custom JSON now playing support for nested payloads and playlist arrays.
- Added a configurable `No track available` placeholder when a valid API returns no current metadata.
- Added documentation examples for generic custom API integrations.

### Changed

- Improved custom JSON parsing for common shapes such as `tracks`, `currentTrack`, `latestTrack`, and nested `data` objects.
- Updated the readme to explain generic custom API usage instead of a single region-specific example.

### Fixed

- Fixed custom JSON parsing for APIs that return track metadata inside arrays rather than directly at the root.
- Improved handling of empty or incomplete now playing responses without leaving the panel in a stale status state.

## 1.2.0 (2026-04-02)

### Added

- Added optional station presets as a non-breaking addition to day-by-day configuration.
- Added five editable preset slots with stream URL, logo URL, and now playing settings.
- Added per-day preset selection with fallback to custom day station fields when no preset is selected.

### Changed

- Refactored panel option builder to helper-based station/day option generation to reduce duplication and regression risk.
- Updated day preset selector to show dynamic preset display names based on configured station names.
- New Screenshot 2.

## 1.1.3 (2026-04-02)

### Changed

- More complete readme

## 1.1.2 (2026-04-02)
### Added

- New logo
### Changed

- Better restart stream handling

## 1.1 (2026-03-31)

### Added

- Added automatic stream watchdog restart when playback stalls for 10 seconds.
- Added support for Custom JSON now playing APIs.
- Added a global CORS proxy setting for now playing API requests.

### Changed

- Updated Arrow Classic Rock now playing preset to use a CORS-friendly proxy route by default.
- Improved now playing parsing for wrapped JSON and markdown-like proxy responses.
- Updated default option text labels to English.

### Fixed

- Updated panel styles to use Grafana theme tokens instead of hardcoded colors and fonts.
- Added cleanup for the shared global audio element when the last panel instance unmounts.
- Reduced repeated now playing polling noise after fetch failures.

## 1.0.1 (2026-03-09)

### Fixed

- Updated build dependency `copy-webpack-plugin` to `14.0.0`.
- Removed high-severity `serialize-javascript` vulnerability from lockfile dependency tree.

## 1.0.0 (2026-03-09)

### Added

- Initial community release of LP Radio Panel.
- Vinyl-style interactive radio playback panel.
- Weekday station scheduling with optional timed override.
- Now playing presets for NPO Sterren NL and Arrow Classic Rock.
- Playlist-friendly continuous playback option.
- Styling controls and Grafana variable support for station settings.
