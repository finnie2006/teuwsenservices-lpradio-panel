import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanelProps } from '@grafana/data';
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
}

declare global {
  interface Window {
    __lpRadioGlobalPlayer?: HTMLAudioElement;
  }
}

const nowPlayingPresets: Record<string, NowPlayingPresetConfig> = {
  'npo-sterren-nl': {
    apiUrl: 'https://www.nporadio5.nl/sterrennl/api/miniplayer/info?channel=npo-sterren-nl',
  },
  'arrow-classic-rock': {
    apiUrl: 'https://player.arrow.nl/index.php?c=Arrow%20Classic%20Rock&_=',
  },
};

const getStyles = () => {
  const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  `;

  return {
    panel: css`
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 10px;
      box-sizing: border-box;
      font-family: Inter, sans-serif;
    `,
    trackInfo: css`
      color: #46a2ff;
      font-size: 0.85em;
      margin-bottom: 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 260px;
      text-align: center;
      transition: color 0.5s ease;
    `,
    goldText: css`
      color: #ffd700 !important;
      text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
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
      background: radial-gradient(circle, #222 0%, #000 70%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
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
      box-shadow: 0 0 30px rgba(255, 215, 0, 0.4), 0 10px 30px rgba(0, 0, 0, 0.8);
    `,
    playingBlueGlow: css`
      box-shadow: 0 0 25px rgba(70, 162, 255, 0.3), 0 10px 30px rgba(0, 0, 0, 0.8);
    `,
    lpLabel: css`
      width: 40%;
      height: 40%;
      background: #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
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
      background: #181b1f;
      border-radius: 50%;
      z-index: 3;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.8);
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
  });

  return {
    ...defaultOptions,
    ...options,
    sameStationAllDays: options?.sameStationAllDays ?? defaultOptions.sameStationAllDays,
    sharedStation: mergeStation(options?.sharedStation, defaultOptions.sharedStation),
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

  return nowPlayingPresets[preset]?.apiUrl ?? '';
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

const parseArrowNowPlayingTrack = (payload: any): NowPlayingTrack | null => {
  const artist = payload?.artist?.toString().trim() ?? '';
  const song = payload?.title?.toString().trim() ?? '';
  const rawImage = payload?.image?.toString().trim() ?? '';
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

const parseNowPlayingTrack = (preset: string, payload: any): NowPlayingTrack | null => {
  if (preset === 'arrow-classic-rock') {
    return parseArrowNowPlayingTrack(payload);
  }

  return parseSterrenNowPlayingTrack(payload);
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
  const styles = useStyles2(getStyles);
  const playerRef = useRef<HTMLAudioElement | null>(null);

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
  const shouldShowNowPlaying = resolvedStation.nowPlayingPreset !== 'none' && nowPlayingApiUrl.length > 0;
  const panelBorderWidth = Math.max(0, safeOptions.panelBorderWidth);
  const discBorderWidth = Math.max(0, safeOptions.discBorderWidth);
  const labelBorderWidth = Math.max(0, safeOptions.labelBorderWidth);

  useEffect(() => {
    const player = getOrCreateGlobalAudioPlayer();
    if (!player) {
      return;
    }

    playerRef.current = player;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    player.addEventListener('play', onPlay);
    player.addEventListener('pause', onPause);

    return () => {
      player.removeEventListener('play', onPlay);
      player.removeEventListener('pause', onPause);

      if (!safeOptions.continuePlaybackAcrossDashboards) {
        player.pause();
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

    if (isPlaying) {
      player.play().catch(() => {
        setIsPlaying(false);
        setPlaybackError(true);
      });
    }
  }, [resolvedStation, isPlaying, safeOptions.continuePlaybackAcrossDashboards]);

  useEffect(() => {
    if (!shouldShowNowPlaying) {
      return;
    }

    const controller = new AbortController();

    const fetchNowPlaying = async () => {
      try {
        const response = await fetch(withNoCacheTimestamp(nowPlayingApiUrl), {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const parsedTrack = parseNowPlayingTrack(resolvedStation.nowPlayingPreset, payload);
        setNowPlayingTrack(parsedTrack);
      } catch {
      }
    };

    fetchNowPlaying();

    const refreshMs = Math.max(5000, safeOptions.checkIntervalSeconds * 1000);
    const interval = window.setInterval(fetchNowPlaying, refreshMs);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [nowPlayingApiUrl, safeOptions.checkIntervalSeconds, resolvedStation.nowPlayingPreset, shouldShowNowPlaying]);

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
            isPlaying && !isGoldMode && styles.playingBlueGlow
          )}
          style={{ border: `${discBorderWidth}px solid ${isGoldMode ? '#ffd700' : safeOptions.discBorderColor}` }}
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
