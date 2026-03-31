import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GrafanaTheme2, PanelProps } from '@grafana/data';
import { defaultOptions, SimpleOptions, StationOption, StationsByDay } from 'types';
import { css, cx, keyframes } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';

interface Props extends PanelProps<SimpleOptions> {}

interface NowPlayingTrack {
  artist: string;
  song: string;
  coverUrl: string;
}

interface NowPlayingPresetConfig {
  apiUrl: string;
  parser: 'sterren' | 'arrow' | 'generic';
  defaultCorsProxyUrl?: string;
}

declare global {
  interface Window {
    __lpRadioGlobalPlayer?: HTMLAudioElement;
    __lpRadioGlobalPlayerInstanceCount?: number;
  }
}

const nowPlayingPresets: Record<string, NowPlayingPresetConfig> = {
  'npo-sterren-nl': {
    apiUrl: 'https://www.nporadio5.nl/sterrennl/api/miniplayer/info?channel=npo-sterren-nl',
    parser: 'sterren',
  },
  'arrow-classic-rock': {
    apiUrl: 'http://player.arrow.nl/index.php?c=Arrow%20Classic%20Rock&_=',
    parser: 'arrow',
    defaultCorsProxyUrl: 'https://r.jina.ai/',
  },
  'custom-json': {
    apiUrl: '',
    parser: 'generic',
  },
};

const getStyles = (theme: GrafanaTheme2) => {
  const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  `;

  const trackTextColor = theme.colors.primary.main;
  const goldColor = theme.colors.warning.main;
  const discBaseColor = theme.colors.background.secondary;
  const discHighlightColor = theme.colors.background.primary;
  const discShadowColor = theme.colors.text.disabled;

  return {
    panel: css`
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: ${theme.spacing(1.25)};
      box-sizing: border-box;
      font-family: ${theme.typography.fontFamily};
    `,
    trackInfo: css`
      color: ${trackTextColor};
      font-size: 0.85em;
      margin-bottom: ${theme.spacing(1)};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 260px;
      text-align: center;
      transition: color 0.5s ease;
    `,
    goldText: css`
      color: ${goldColor} !important;
      text-shadow: 0 0 ${theme.spacing(0.625)} ${goldColor}80;
    `,
    lpWrapper: css`
      position: relative;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    `,
    lpDisc: css`
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, ${discHighlightColor} 0%, ${discBaseColor} 70%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 ${theme.spacing(1.25)} ${theme.spacing(3.75)} ${discShadowColor}66;
      background-image:
        repeating-radial-gradient(
          rgba(0, 0, 0, 0) 0px,
          rgba(0, 0, 0, 0) 2px,
          rgba(255, 255, 255, 0.03) 3px,
          rgba(0, 0, 0, 0) 4px
        ),
        linear-gradient(135deg, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0) 60%);
      transition: transform 0.2s ease, box-shadow 0.5s ease;
      animation: ${spin} 3s linear infinite;
      animation-play-state: paused;
    `,
    playing: css`
      animation-play-state: running;
    `,
    sterrenGlow: css`
      box-shadow: 0 0 ${theme.spacing(3.75)} ${goldColor}66, 0 ${theme.spacing(1.25)} ${theme.spacing(3.75)} ${discShadowColor}66;
    `,
    playingBlueGlow: css`
      box-shadow: 0 0 ${theme.spacing(3.125)} ${trackTextColor}59, 0 ${theme.spacing(1.25)} ${theme.spacing(3.75)} ${discShadowColor}66;
    `,
    goldDiscBorder: css`
      border-color: ${goldColor} !important;
    `,
    lpLabel: css`
      width: 40%;
      height: 40%;
      background: ${theme.colors.background.primary};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-shadow: inset 0 0 ${theme.spacing(1.25)} ${discShadowColor}66;
      z-index: 2;
    `,
    labelImage: css`
      width: 80%;
      height: auto;
      object-fit: contain;
    `,
    centerHole: css`
      position: absolute;
      width: 12px;
      height: 12px;
      background: ${theme.colors.background.canvas};
      border-radius: 50%;
      z-index: 3;
      box-shadow: inset 0 2px 4px ${discShadowColor}66;
    `,
  };
};

const mergeOptions = (options: SimpleOptions): SimpleOptions => {
  const mergeStation = (station: StationOption | undefined, fallback: StationOption): StationOption => ({
    name: station?.name || fallback.name,
    url: station?.url || fallback.url,
    logo: station?.logo || fallback.logo,
    nowPlayingPreset: station?.nowPlayingPreset || fallback.nowPlayingPreset,
    nowPlayingApiUrl: station?.nowPlayingApiUrl || fallback.nowPlayingApiUrl,
    nowPlayingCorsProxyUrl: station?.nowPlayingCorsProxyUrl || fallback.nowPlayingCorsProxyUrl,
  });

  return {
    ...defaultOptions,
    ...options,
    sameStationAllDays: options?.sameStationAllDays ?? defaultOptions.sameStationAllDays,
    sharedStation: mergeStation(options?.sharedStation, defaultOptions.sharedStation),
    nowPlayingCorsProxyUrl: options?.nowPlayingCorsProxyUrl ?? defaultOptions.nowPlayingCorsProxyUrl,
    panelBorderColor: options?.panelBorderColor || defaultOptions.panelBorderColor,
    panelBorderWidth: options?.panelBorderWidth ?? defaultOptions.panelBorderWidth,
    discBorderColor: options?.discBorderColor || defaultOptions.discBorderColor,
    discBorderWidth: options?.discBorderWidth ?? defaultOptions.discBorderWidth,
    labelBorderColor: options?.labelBorderColor || defaultOptions.labelBorderColor,
    labelBorderWidth: options?.labelBorderWidth ?? defaultOptions.labelBorderWidth,
    stations: {
      sunday: mergeStation(options?.stations?.sunday, defaultOptions.stations.sunday),
      monday: mergeStation(options?.stations?.monday, defaultOptions.stations.monday),
      tuesday: mergeStation(options?.stations?.tuesday, defaultOptions.stations.tuesday),
      wednesday: mergeStation(options?.stations?.wednesday, defaultOptions.stations.wednesday),
      thursday: mergeStation(options?.stations?.thursday, defaultOptions.stations.thursday),
      friday: mergeStation(options?.stations?.friday, defaultOptions.stations.friday),
      saturday: mergeStation(options?.stations?.saturday, defaultOptions.stations.saturday),
    },
    thursdayOverride: {
      enabled: options?.thursdayOverride?.enabled ?? defaultOptions.thursdayOverride.enabled,
      startHour: options?.thursdayOverride?.startHour ?? defaultOptions.thursdayOverride.startHour,
      days: {
        sunday: options?.thursdayOverride?.days?.sunday ?? defaultOptions.thursdayOverride.days.sunday,
        monday: options?.thursdayOverride?.days?.monday ?? defaultOptions.thursdayOverride.days.monday,
        tuesday: options?.thursdayOverride?.days?.tuesday ?? defaultOptions.thursdayOverride.days.tuesday,
        wednesday: options?.thursdayOverride?.days?.wednesday ?? defaultOptions.thursdayOverride.days.wednesday,
        thursday: options?.thursdayOverride?.days?.thursday ?? defaultOptions.thursdayOverride.days.thursday,
        friday: options?.thursdayOverride?.days?.friday ?? defaultOptions.thursdayOverride.days.friday,
        saturday: options?.thursdayOverride?.days?.saturday ?? defaultOptions.thursdayOverride.days.saturday,
      },
      station: mergeStation(options?.thursdayOverride?.station, defaultOptions.thursdayOverride.station),
    },
  };
};

const resolveStation = (station: StationOption, replaceVariables: Props['replaceVariables']): StationOption => ({
  name: replaceVariables(station.name),
  url: replaceVariables(station.url),
  logo: replaceVariables(station.logo),
  nowPlayingPreset: replaceVariables(station.nowPlayingPreset),
  nowPlayingApiUrl: replaceVariables(station.nowPlayingApiUrl),
  nowPlayingCorsProxyUrl: replaceVariables(station.nowPlayingCorsProxyUrl),
});

const stationByDay = (day: number, stations: StationsByDay): StationOption => {
  const map: Record<number, StationOption> = {
    0: stations.sunday,
    1: stations.monday,
    2: stations.tuesday,
    3: stations.wednesday,
    4: stations.thursday,
    5: stations.friday,
    6: stations.saturday,
  };

  return map[day] ?? stations.sunday;
};

const isOverrideDay = (day: number, days: SimpleOptions['thursdayOverride']['days']): boolean => {
  const map: Record<number, boolean> = {
    0: days.sunday,
    1: days.monday,
    2: days.tuesday,
    3: days.wednesday,
    4: days.thursday,
    5: days.friday,
    6: days.saturday,
  };

  return map[day] ?? false;
};

const getNowPlayingApiUrl = (
  preset: string,
  customApiUrl: string,
  replaceVariables: Props['replaceVariables']
): string => {
  if (preset === 'none') {
    return '';
  }

  const resolvedCustomUrl = replaceVariables(customApiUrl).trim();
  if (resolvedCustomUrl.length > 0) {
    return resolvedCustomUrl;
  }

  if (preset === 'custom-json') {
    return '';
  }

  return nowPlayingPresets[preset]?.apiUrl ?? '';
};

const applyCorsProxyUrl = (apiUrl: string, proxyTemplate: string): string => {
  const trimmedApiUrl = apiUrl.trim();
  if (trimmedApiUrl.length === 0) {
    return '';
  }

  const trimmedProxyTemplate = proxyTemplate.trim();
  if (trimmedProxyTemplate.length === 0) {
    return trimmedApiUrl;
  }

  if (trimmedProxyTemplate.includes('{{url}}')) {
    return trimmedProxyTemplate.replace(/{{\s*url\s*}}/g, encodeURIComponent(trimmedApiUrl));
  }

  return `${trimmedProxyTemplate}${trimmedApiUrl}`;
};

const parseSterrenNowPlayingTrack = (payload: any): NowPlayingTrack | null => {
  const track = payload?.data?.radioTrackPlays?.data?.[0];
  const artist = track?.artist?.toString().trim() ?? '';
  const song = track?.song?.toString().trim() ?? '';
  const coverUrl = track?.radioTracks?.coverUrl?.toString().trim() ?? '';

  if (artist.length === 0 && song.length === 0) {
    return null;
  }

  return { artist, song, coverUrl };
};

const tryParseWrappedJsonString = (value: unknown): any | null => {
  if (typeof value !== 'string') {
    return null;
  }

  return parseNowPlayingPayload(value);
};

const normalizeArrowPayload = (payload: any): any => {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const directCandidate = payload.detail ?? payload.data?.detail;
  if (directCandidate && typeof directCandidate === 'object') {
    return directCandidate;
  }

  const wrappedJsonCandidate = tryParseWrappedJsonString(payload.data?.content) ?? tryParseWrappedJsonString(payload.content);
  if (wrappedJsonCandidate && typeof wrappedJsonCandidate === 'object') {
    return wrappedJsonCandidate;
  }

  return payload;
};

const parseArrowNowPlayingTrack = (payload: any): NowPlayingTrack | null => {
  const normalizedPayload = normalizeArrowPayload(payload);

  const artist =
    normalizedPayload?.artist?.toString().trim() ??
    normalizedPayload?.station?.toString().trim() ??
    '';
  const song =
    normalizedPayload?.title?.toString().trim() ??
    normalizedPayload?.song?.toString().trim() ??
    normalizedPayload?.track?.toString().trim() ??
    '';
  const rawImage =
    normalizedPayload?.image?.toString().trim() ??
    normalizedPayload?.coverUrl?.toString().trim() ??
    '';
  const normalizedImage = rawImage.replace(/^\/+/, '');
  const coverUrl =
    normalizedImage.length === 0
      ? ''
      : /^https?:\/\//i.test(normalizedImage)
        ? normalizedImage
        : `https://player.arrow.nl/${normalizedImage}`;

  if (artist.length === 0 && song.length === 0) {
    return null;
  }

  return { artist, song, coverUrl };
};

const parseGenericNowPlayingTrack = (payload: any): NowPlayingTrack | null => {
  const normalizedPayload = normalizeArrowPayload(payload);

  const artist =
    normalizedPayload?.artist?.toString().trim() ??
    normalizedPayload?.station?.toString().trim() ??
    normalizedPayload?.name?.toString().trim() ??
    '';
  const song =
    normalizedPayload?.title?.toString().trim() ??
    normalizedPayload?.song?.toString().trim() ??
    normalizedPayload?.track?.toString().trim() ??
    normalizedPayload?.nowPlaying?.toString().trim() ??
    '';
  const coverUrl =
    normalizedPayload?.image?.toString().trim() ??
    normalizedPayload?.cover?.toString().trim() ??
    normalizedPayload?.coverUrl?.toString().trim() ??
    normalizedPayload?.artwork?.toString().trim() ??
    '';

  if (artist.length === 0 && song.length === 0) {
    return null;
  }

  return { artist, song, coverUrl };
};

const parseNowPlayingTrack = (preset: string, payload: any): NowPlayingTrack | null => {
  const parser = nowPlayingPresets[preset]?.parser ?? 'generic';

  if (parser === 'arrow') {
    return parseArrowNowPlayingTrack(payload);
  }

  if (parser === 'sterren') {
    return parseSterrenNowPlayingTrack(payload);
  }

  return parseGenericNowPlayingTrack(payload);
};

const extractFirstJsonObject = (content: string): string => {
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');

  if (start === -1 || end === -1 || end < start) {
    return '';
  }

  return content.slice(start, end + 1);
};

const parseNowPlayingPayload = (rawPayload: string): any | null => {
  const raw = rawPayload.trim();
  if (raw.length === 0) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    // Continue with text wrapper extraction.
  }

  const markdownMarker = 'Markdown Content:';
  const markerIndex = raw.indexOf(markdownMarker);
  const markdownSection = markerIndex >= 0 ? raw.slice(markerIndex + markdownMarker.length).trim() : raw;
  const jsonCandidate = extractFirstJsonObject(markdownSection);

  if (jsonCandidate.length === 0) {
    return null;
  }

  try {
    return JSON.parse(jsonCandidate);
  } catch {
    return null;
  }
};

const withNoCacheTimestamp = (url: string): string => {
  if (url.includes('_=')) {
    return url.replace(/_=(\d+)?/g, `_=${Date.now()}`);
  }

  return url;
};

const getExistingGlobalAudioPlayer = (): HTMLAudioElement | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.__lpRadioGlobalPlayer ?? null;
};

const incrementGlobalAudioPlayerRefCount = (): number => {
  if (typeof window === 'undefined') {
    return 0;
  }

  const nextCount = (window.__lpRadioGlobalPlayerInstanceCount ?? 0) + 1;
  window.__lpRadioGlobalPlayerInstanceCount = nextCount;
  return nextCount;
};

const decrementGlobalAudioPlayerRefCount = (): number => {
  if (typeof window === 'undefined') {
    return 0;
  }

  const nextCount = Math.max(0, (window.__lpRadioGlobalPlayerInstanceCount ?? 0) - 1);
  window.__lpRadioGlobalPlayerInstanceCount = nextCount;
  return nextCount;
};

const getOrCreateGlobalAudioPlayer = (): HTMLAudioElement | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!window.__lpRadioGlobalPlayer) {
    const player = document.createElement('audio');
    player.preload = 'none';
    player.style.display = 'none';
    player.setAttribute('data-lp-radio-player', 'global');
    document.body.appendChild(player);
    window.__lpRadioGlobalPlayer = player;
  }

  return window.__lpRadioGlobalPlayer;
};

export const SimplePanel: React.FC<Props> = ({ options, width, height, replaceVariables }) => {
  const NOW_PLAYING_ERROR_COOLDOWN_MS = 60_000;
  const STREAM_STALL_THRESHOLD_MS = 10_000;
  const STREAM_RESTART_COOLDOWN_MS = 15_000;
  const styles = useStyles2(getStyles);
  const playerRef = useRef<HTMLAudioElement | null>(null);
  const streamProgressRef = useRef({
    lastTime: 0,
    lastProgressAt: 0,
    lastRestartAt: 0,
  });

  const safeOptions = useMemo(() => mergeOptions(options), [options]);
  const displayDiscSize = Math.max(120, Math.min(safeOptions.discSize, width - 24, height - 48));

  const getActiveStation = useCallback(
    (date: Date): StationOption => {
      const day = date.getDay();
      const hour = date.getHours();
      const dayStation = safeOptions.sameStationAllDays
        ? safeOptions.sharedStation
        : stationByDay(day, safeOptions.stations);

      if (
        safeOptions.thursdayOverride.enabled &&
        isOverrideDay(day, safeOptions.thursdayOverride.days) &&
        hour >= safeOptions.thursdayOverride.startHour
      ) {
        return safeOptions.thursdayOverride.station;
      }

      return dayStation;
    },
    [safeOptions]
  );

  const [now, setNow] = useState<Date>(() => new Date());
  const [isPlaying, setIsPlaying] = useState(() => {
    const existingPlayer = getExistingGlobalAudioPlayer();
    return existingPlayer ? !existingPlayer.paused : false;
  });
  const [playbackError, setPlaybackError] = useState(false);
  const [nowPlayingTrack, setNowPlayingTrack] = useState<NowPlayingTrack | null>(null);
  const [blockedNowPlayingKeys, setBlockedNowPlayingKeys] = useState<Record<string, number>>({});

  const currentStation = useMemo(() => getActiveStation(now), [getActiveStation, now]);

  const resolvedStation = useMemo(
    () => resolveStation(currentStation, replaceVariables),
    [currentStation, replaceVariables]
  );
  const goldMatch = replaceVariables(safeOptions.goldMatchText);
  const isGoldMode = goldMatch.length > 0 && resolvedStation.name.toLowerCase().includes(goldMatch.toLowerCase());
  const nowPlayingApiUrl = useMemo(
    () => getNowPlayingApiUrl(resolvedStation.nowPlayingPreset, resolvedStation.nowPlayingApiUrl, replaceVariables),
    [resolvedStation.nowPlayingPreset, resolvedStation.nowPlayingApiUrl, replaceVariables]
  );
  const globalNowPlayingCorsProxyUrl = replaceVariables(safeOptions.nowPlayingCorsProxyUrl).trim();
  const legacyStationNowPlayingCorsProxyUrl = resolvedStation.nowPlayingCorsProxyUrl.trim();
  const effectiveNowPlayingCorsProxyUrl =
    globalNowPlayingCorsProxyUrl ||
    legacyStationNowPlayingCorsProxyUrl ||
    nowPlayingPresets[resolvedStation.nowPlayingPreset]?.defaultCorsProxyUrl ||
    '';
  const shouldShowNowPlaying = resolvedStation.nowPlayingPreset !== 'none' && nowPlayingApiUrl.length > 0;
  const nowPlayingRequestKey = `${resolvedStation.nowPlayingPreset}:${nowPlayingApiUrl}:${effectiveNowPlayingCorsProxyUrl}`;
  const nowPlayingBlockedUntil = blockedNowPlayingKeys[nowPlayingRequestKey] ?? 0;
  const isNowPlayingPollingDisabled = nowPlayingBlockedUntil > now.getTime();
  const panelBorderWidth = Math.max(0, safeOptions.panelBorderWidth);
  const discBorderWidth = Math.max(0, safeOptions.discBorderWidth);
  const labelBorderWidth = Math.max(0, safeOptions.labelBorderWidth);

  useEffect(() => {
    const player = getOrCreateGlobalAudioPlayer();
    if (!player) {
      return;
    }

    incrementGlobalAudioPlayerRefCount();

    playerRef.current = player;
    streamProgressRef.current.lastProgressAt = Date.now();
    streamProgressRef.current.lastTime = player.currentTime;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onProgress = () => {
      streamProgressRef.current.lastTime = player.currentTime;
      streamProgressRef.current.lastProgressAt = Date.now();
    };

    player.addEventListener('play', onPlay);
    player.addEventListener('pause', onPause);
    player.addEventListener('playing', onProgress);
    player.addEventListener('timeupdate', onProgress);
    player.addEventListener('progress', onProgress);
    player.addEventListener('loadeddata', onProgress);
    player.addEventListener('canplay', onProgress);

    return () => {
      player.removeEventListener('play', onPlay);
      player.removeEventListener('pause', onPause);
      player.removeEventListener('playing', onProgress);
      player.removeEventListener('timeupdate', onProgress);
      player.removeEventListener('progress', onProgress);
      player.removeEventListener('loadeddata', onProgress);
      player.removeEventListener('canplay', onProgress);

      const remainingInstances = decrementGlobalAudioPlayerRefCount();
      const shouldPausePlayer = !safeOptions.continuePlaybackAcrossDashboards || remainingInstances === 0;

      if (shouldPausePlayer) {
        player.pause();
      }

      if (remainingInstances === 0) {
        player.removeAttribute('src');
        player.load();
        player.remove();
        delete window.__lpRadioGlobalPlayer;
        delete window.__lpRadioGlobalPlayerInstanceCount;
      }
    };
  }, [safeOptions.continuePlaybackAcrossDashboards]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    const currentStreamUrl = player.getAttribute('data-stream-url') ?? '';
    const isSameStream = currentStreamUrl === resolvedStation.url;
    const shouldKeepCurrentPlayback =
      safeOptions.continuePlaybackAcrossDashboards &&
      isSameStream &&
      isPlaying &&
      !player.paused;

    if (shouldKeepCurrentPlayback) {
      return;
    }

    player.src = resolvedStation.url;
    player.setAttribute('data-stream-url', resolvedStation.url);
    player.load();
    streamProgressRef.current.lastTime = 0;
    streamProgressRef.current.lastProgressAt = Date.now();
    streamProgressRef.current.lastRestartAt = 0;

    if (isPlaying) {
      player.play().catch(() => {
        setIsPlaying(false);
        setPlaybackError(true);
      });
    }
  }, [resolvedStation, isPlaying, safeOptions.continuePlaybackAcrossDashboards]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    const watchdogIntervalMs = Math.max(10_000, safeOptions.checkIntervalSeconds * 1000);

    const restartStreamIfStalled = async () => {
      if (!isPlaying || player.paused) {
        return;
      }

      const nowTs = Date.now();
      const progress = streamProgressRef.current;
      const hasAdvanced = player.currentTime > progress.lastTime + 0.1;

      if (hasAdvanced) {
        progress.lastTime = player.currentTime;
        progress.lastProgressAt = nowTs;
        return;
      }

      const stalledTooLong = nowTs - progress.lastProgressAt >= STREAM_STALL_THRESHOLD_MS;
      const restartOnCooldown = nowTs - progress.lastRestartAt < STREAM_RESTART_COOLDOWN_MS;

      if (!stalledTooLong || restartOnCooldown) {
        return;
      }

      const activeStreamUrl = player.getAttribute('data-stream-url') ?? resolvedStation.url;
      if (!activeStreamUrl) {
        return;
      }

      progress.lastRestartAt = nowTs;

      try {
        player.pause();
        player.src = withNoCacheTimestamp(activeStreamUrl);
        player.setAttribute('data-stream-url', activeStreamUrl);
        player.load();
        await player.play();
        setPlaybackError(false);
        progress.lastProgressAt = Date.now();
      } catch {
        setPlaybackError(true);
      }
    };

    const watchdog = window.setInterval(() => {
      void restartStreamIfStalled();
    }, watchdogIntervalMs);

    return () => {
      window.clearInterval(watchdog);
    };
  }, [
    isPlaying,
    resolvedStation.url,
    safeOptions.checkIntervalSeconds,
    STREAM_STALL_THRESHOLD_MS,
    STREAM_RESTART_COOLDOWN_MS,
  ]);

  useEffect(() => {
    if (!shouldShowNowPlaying || isNowPlayingPollingDisabled) {
      return;
    }

    const controller = new AbortController();

    const fetchNowPlaying = async () => {
      try {
        const sourceUrl = withNoCacheTimestamp(nowPlayingApiUrl);
        const requestUrl = applyCorsProxyUrl(sourceUrl, effectiveNowPlayingCorsProxyUrl);

        if (!requestUrl) {
          return;
        }

        const response = await fetch(requestUrl, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const contentType = response.headers.get('content-type') ?? '';
        const payload = contentType.includes('application/json')
          ? await response.json()
          : parseNowPlayingPayload(await response.text());

        if (!payload) {
          return;
        }

        const parsedTrack = parseNowPlayingTrack(resolvedStation.nowPlayingPreset, payload);
        setNowPlayingTrack(parsedTrack);
        setBlockedNowPlayingKeys((previousKeys) => {
          if (!(nowPlayingRequestKey in previousKeys)) {
            return previousKeys;
          }

          const nextKeys = { ...previousKeys };
          delete nextKeys[nowPlayingRequestKey];
          return nextKeys;
        });
      } catch {
        if (!controller.signal.aborted) {
          setBlockedNowPlayingKeys((previousKeys) => {
            const blockedUntil = previousKeys[nowPlayingRequestKey] ?? 0;
            if (blockedUntil > Date.now()) {
              return previousKeys;
            }

            const nextKeys = {
              ...previousKeys,
              [nowPlayingRequestKey]: Date.now() + NOW_PLAYING_ERROR_COOLDOWN_MS,
            };
            return nextKeys;
          });
          setNowPlayingTrack(null);
        }
      }
    };

    fetchNowPlaying();

    const refreshMs = Math.max(5000, safeOptions.checkIntervalSeconds * 1000);
    const interval = window.setInterval(fetchNowPlaying, refreshMs);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [
    isNowPlayingPollingDisabled,
    nowPlayingApiUrl,
    nowPlayingBlockedUntil,
    nowPlayingRequestKey,
    effectiveNowPlayingCorsProxyUrl,
    safeOptions.checkIntervalSeconds,
    resolvedStation.nowPlayingPreset,
    shouldShowNowPlaying,
    NOW_PLAYING_ERROR_COOLDOWN_MS,
  ]);

  useEffect(() => {
    const intervalMs = Math.max(5000, safeOptions.checkIntervalSeconds * 1000);

    const interval = window.setInterval(() => {
      setNow(new Date());
    }, intervalMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [safeOptions.checkIntervalSeconds]);

  const onTogglePlay = async () => {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    if (player.paused) {
      try {
        await player.play();
        setIsPlaying(true);
        setPlaybackError(false);
      } catch {
        setPlaybackError(true);
      }
      return;
    }

    player.pause();
    setIsPlaying(false);
  };

  const statusText = playbackError
    ? replaceVariables(safeOptions.clickToStartText)
    : isPlaying
      ? `${replaceVariables(safeOptions.onAirPrefix)} ${resolvedStation.name}`
      : resolvedStation.name || replaceVariables(safeOptions.loadingText);

  const activeNowPlayingTrack = shouldShowNowPlaying ? nowPlayingTrack : null;

  const nowPlayingText = activeNowPlayingTrack
    ? `${activeNowPlayingTrack.artist}${activeNowPlayingTrack.artist && activeNowPlayingTrack.song ? ' - ' : ''}${activeNowPlayingTrack.song}`
    : statusText;
  const labelImageSrc = activeNowPlayingTrack?.coverUrl || resolvedStation.logo;
  const labelAltText = activeNowPlayingTrack
    ? `${activeNowPlayingTrack.artist} - ${activeNowPlayingTrack.song}`
    : resolvedStation.name;

  return (
    <div
      className={styles.panel}
      style={{
        border: `${panelBorderWidth}px solid ${safeOptions.panelBorderColor}`,
        borderRadius: panelBorderWidth > 0 ? 12 : 0,
      }}
    >
      <div className={cx(styles.trackInfo, isGoldMode && styles.goldText)} data-testid="track-info">
        {nowPlayingText}
      </div>

      <div
        className={styles.lpWrapper}
        style={{ width: displayDiscSize, height: displayDiscSize }}
        onClick={onTogglePlay}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onTogglePlay();
          }
        }}
        data-testid="lp-click-zone"
      >
        <div
          className={cx(
            styles.lpDisc,
            isPlaying && styles.playing,
            isGoldMode && styles.sterrenGlow,
            isGoldMode && styles.goldDiscBorder,
            isPlaying && !isGoldMode && styles.playingBlueGlow
          )}
          style={{ border: `${discBorderWidth}px solid ${safeOptions.discBorderColor}` }}
          data-testid="lp-disc"
        >
          <div
            className={styles.lpLabel}
            style={{ border: `${labelBorderWidth}px solid ${safeOptions.labelBorderColor}` }}
          >
            <img className={styles.labelImage} src={labelImageSrc} alt={labelAltText} />
          </div>
          <div className={styles.centerHole} />
        </div>
      </div>

    </div>
  );
};
