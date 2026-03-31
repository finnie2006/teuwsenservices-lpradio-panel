# Changelog

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
