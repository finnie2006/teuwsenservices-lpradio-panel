import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { GrafanaTheme2, PanelProps } from '@grafana/data';
import { defaultOptions, SimpleOptions, StationOption, StationPresetId, StationsByDay } from 'types';
import { css, cx, keyframes } from '@emotion/css';
import { useStyles2, useTheme2 } from '@grafana/ui';
import {
  applyCorsProxyUrl,
  getNowPlayingApiUrl,
  nowPlayingPresets,
  NowPlayingTrack,
  parseNowPlayingPayload,
  parseNowPlayingTrack,
  withNoCacheTimestamp,
} from './nowPlaying';
import {
  followStation,
  getRadioPlayerSnapshot,
  registerRadioPanel,
  subscribeToRadioPlayer,
  togglePlayback,
  unregisterRadioPanel,
} from './radioPlayer';

interface Props extends PanelProps<SimpleOptions> {}

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
      overflow: hidden;
      font-family: ${theme.typography.fontFamily};
    `,
    trackInfo: css`
      color: ${trackTextColor};
      font-size: 0.85em;
      margin-bottom: ${theme.spacing(1)};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
      flex-shrink: 0;
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
  // An empty string is a deliberate choice, for example a station without a logo.
  const mergeStation = (station: StationOption | undefined, fallback: StationOption): StationOption => ({
    name: station?.name ?? fallback.name,
    url: station?.url ?? fallback.url,
    logo: station?.logo ?? fallback.logo,
    nowPlayingPreset: station?.nowPlayingPreset || fallback.nowPlayingPreset,
    nowPlayingApiUrl: station?.nowPlayingApiUrl || fallback.nowPlayingApiUrl,
    nowPlayingCorsProxyUrl: station?.nowPlayingCorsProxyUrl || fallback.nowPlayingCorsProxyUrl,
  });

  return {
    ...defaultOptions,
    ...options,
    checkIntervalSeconds: options?.checkIntervalSeconds ?? defaultOptions.checkIntervalSeconds,
    discSize: options?.discSize ?? defaultOptions.discSize,
    sameStationAllDays: options?.sameStationAllDays ?? defaultOptions.sameStationAllDays,
    sharedStation: mergeStation(options?.sharedStation, defaultOptions.sharedStation),
    useStationPresets: options?.useStationPresets ?? defaultOptions.useStationPresets,
    stationPresets: {
      preset1: mergeStation(options?.stationPresets?.preset1, defaultOptions.stationPresets.preset1),
      preset2: mergeStation(options?.stationPresets?.preset2, defaultOptions.stationPresets.preset2),
      preset3: mergeStation(options?.stationPresets?.preset3, defaultOptions.stationPresets.preset3),
      preset4: mergeStation(options?.stationPresets?.preset4, defaultOptions.stationPresets.preset4),
      preset5: mergeStation(options?.stationPresets?.preset5, defaultOptions.stationPresets.preset5),
    },
    dayPresetSelection: {
      sunday: options?.dayPresetSelection?.sunday ?? defaultOptions.dayPresetSelection.sunday,
      monday: options?.dayPresetSelection?.monday ?? defaultOptions.dayPresetSelection.monday,
      tuesday: options?.dayPresetSelection?.tuesday ?? defaultOptions.dayPresetSelection.tuesday,
      wednesday: options?.dayPresetSelection?.wednesday ?? defaultOptions.dayPresetSelection.wednesday,
      thursday: options?.dayPresetSelection?.thursday ?? defaultOptions.dayPresetSelection.thursday,
      friday: options?.dayPresetSelection?.friday ?? defaultOptions.dayPresetSelection.friday,
      saturday: options?.dayPresetSelection?.saturday ?? defaultOptions.dayPresetSelection.saturday,
    },
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
      endHour: options?.thursdayOverride?.endHour ?? defaultOptions.thursdayOverride.endHour,
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

const dayKeyByDateIndex = (day: number): keyof StationsByDay => {
  const map: Record<number, keyof StationsByDay> = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
  };

  return map[day] ?? 'sunday';
};

const stationFromPresetId = (presetId: StationPresetId | 'none', options: SimpleOptions): StationOption | null => {
  if (presetId === 'none') {
    return null;
  }

  return options.stationPresets[presetId] ?? null;
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

export const SimplePanel: React.FC<Props> = ({ options, width, height, replaceVariables }) => {
  const NOW_PLAYING_ERROR_COOLDOWN_MS = 60_000;
  const MIN_DISC_SIZE = 60;
  const styles = useStyles2(getStyles);
  const theme = useTheme2();

  const safeOptions = useMemo(() => mergeOptions(options), [options]);
  const displayDiscSize = Math.max(MIN_DISC_SIZE, Math.min(safeOptions.discSize, width - 24, height - 48));

  const getActiveStation = useCallback(
    (date: Date): StationOption => {
      const day = date.getDay();
      const hour = date.getHours();
      const dayKey = dayKeyByDateIndex(day);

      const dayStation = (() => {
        if (safeOptions.sameStationAllDays) {
          return safeOptions.sharedStation;
        }

        if (safeOptions.useStationPresets) {
          const selectedPresetId = safeOptions.dayPresetSelection[dayKey] ?? 'none';
          const stationFromPreset = stationFromPresetId(selectedPresetId, safeOptions);
          if (stationFromPreset) {
            return stationFromPreset;
          }
        }

        return stationByDay(day, safeOptions.stations);
      })();

      if (
        safeOptions.thursdayOverride.enabled &&
        isOverrideDay(day, safeOptions.thursdayOverride.days) &&
        hour >= safeOptions.thursdayOverride.startHour &&
        hour < safeOptions.thursdayOverride.endHour
      ) {
        return safeOptions.thursdayOverride.station;
      }

      return dayStation;
    },
    [safeOptions]
  );

  const [now, setNow] = useState<Date>(() => new Date());
  const { playingUrl, hasPlaybackError: playbackError } = useSyncExternalStore(
    subscribeToRadioPlayer,
    getRadioPlayerSnapshot
  );
  const [nowPlaying, setNowPlaying] = useState<{ requestKey: string; track: NowPlayingTrack | null } | null>(null);
  const [failedImageSrcs, setFailedImageSrcs] = useState<ReadonlySet<string>>(() => new Set());
  const [blockedNowPlayingKeys, setBlockedNowPlayingKeys] = useState<Record<string, number>>({});

  const currentStation = useMemo(() => getActiveStation(now), [getActiveStation, now]);

  const resolvedStation = useMemo(
    () => resolveStation(currentStation, replaceVariables),
    [currentStation, replaceVariables]
  );
  const isPlaying = playingUrl.length > 0 && playingUrl === resolvedStation.url;
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
  const shouldShowNowPlaying =
    resolvedStation.nowPlayingPreset !== 'none' &&
    nowPlayingApiUrl.length > 0 &&
    (isPlaying || !safeOptions.nowPlayingOnlyWhilePlaying);
  const nowPlayingRequestKey = `${resolvedStation.nowPlayingPreset}:${nowPlayingApiUrl}:${effectiveNowPlayingCorsProxyUrl}`;
  const nowPlayingBlockedUntil = blockedNowPlayingKeys[nowPlayingRequestKey] ?? 0;
  const isNowPlayingPollingDisabled = nowPlayingBlockedUntil > now.getTime();
  const panelBorderWidth = Math.max(0, safeOptions.panelBorderWidth);
  const discBorderWidth = Math.max(0, safeOptions.discBorderWidth);
  const labelBorderWidth = Math.max(0, safeOptions.labelBorderWidth);

  const playbackOptionsRef = useRef({
    continuePlayback: safeOptions.continuePlaybackAcrossDashboards,
    showStopButton: safeOptions.showStopButtonWithoutPanel,
  });
  const previousStreamUrlRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    playbackOptionsRef.current = {
      continuePlayback: safeOptions.continuePlaybackAcrossDashboards,
      showStopButton: safeOptions.showStopButtonWithoutPanel,
    };
  }, [safeOptions.continuePlaybackAcrossDashboards, safeOptions.showStopButtonWithoutPanel]);

  useEffect(() => {
    registerRadioPanel(playbackOptionsRef.current.continuePlayback);

    return () => {
      const { continuePlayback, showStopButton } = playbackOptionsRef.current;
      unregisterRadioPanel(continuePlayback, showStopButton);
    };
  }, []);

  useEffect(() => {
    followStation(resolvedStation.url, previousStreamUrlRef.current);
    previousStreamUrlRef.current = resolvedStation.url;
  }, [resolvedStation.url]);

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
          throw new Error(`Now playing request failed with status ${response.status}`);
        }

        const contentType = response.headers.get('content-type') ?? '';
        const payload = contentType.includes('application/json')
          ? await response.json()
          : parseNowPlayingPayload(await response.text());

        const parsedTrack = payload ? parseNowPlayingTrack(resolvedStation.nowPlayingPreset, payload) : null;
        setNowPlaying({ requestKey: nowPlayingRequestKey, track: parsedTrack });
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
          setNowPlaying(null);
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

  const onTogglePlay = () => {
    void togglePlayback(resolvedStation.url);
  };

  const noTrackAvailableText = replaceVariables(safeOptions.noTrackAvailableText || 'No track available');
  const statusText = playbackError
    ? replaceVariables(safeOptions.clickToStartText)
    : isPlaying
      ? `${replaceVariables(safeOptions.onAirPrefix)} ${resolvedStation.name}`
      : resolvedStation.name || replaceVariables(safeOptions.loadingText);

  // A track from the previous station must not linger after a station change.
  const activeNowPlayingTrack =
    shouldShowNowPlaying && nowPlaying?.requestKey === nowPlayingRequestKey ? nowPlaying.track : null;

  // The start hint goes first: without it a blocked autoplay is invisible on stations with metadata.
  const nowPlayingText = playbackError
    ? statusText
    : activeNowPlayingTrack
      ? `${activeNowPlayingTrack.artist}${activeNowPlayingTrack.artist && activeNowPlayingTrack.song ? ' - ' : ''}${activeNowPlayingTrack.song}`
      : shouldShowNowPlaying
        ? noTrackAvailableText
        : statusText;
  const coverImageSrc = activeNowPlayingTrack?.coverUrl ?? '';
  const labelImageSrc = coverImageSrc && !failedImageSrcs.has(coverImageSrc) ? coverImageSrc : resolvedStation.logo;
  const labelAltText = activeNowPlayingTrack
    ? `${activeNowPlayingTrack.artist} - ${activeNowPlayingTrack.song}`
    : resolvedStation.name;

  return (
    <div
      className={styles.panel}
      style={{
        border: `${panelBorderWidth}px solid ${theme.visualization.getColorByName(safeOptions.panelBorderColor)}`,
        borderRadius: panelBorderWidth > 0 ? 12 : 0,
      }}
    >
      <div className={cx(styles.trackInfo, isGoldMode && styles.goldText)} title={nowPlayingText} data-testid="track-info">
        {nowPlayingText}
      </div>

      <div
        className={styles.lpWrapper}
        style={{ width: displayDiscSize, height: displayDiscSize }}
        onClick={onTogglePlay}
        role="button"
        aria-pressed={isPlaying}
        aria-label={resolvedStation.name || statusText}
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
          style={{ border: `${discBorderWidth}px solid ${theme.visualization.getColorByName(safeOptions.discBorderColor)}` }}
          data-testid="lp-disc"
        >
          <div
            className={styles.lpLabel}
            style={{ border: `${labelBorderWidth}px solid ${theme.visualization.getColorByName(safeOptions.labelBorderColor)}` }}
          >
            {labelImageSrc && !failedImageSrcs.has(labelImageSrc) && (
              <img
                className={styles.labelImage}
                src={labelImageSrc}
                alt={labelAltText}
                onError={() => setFailedImageSrcs((previousSrcs) => new Set(previousSrcs).add(labelImageSrc))}
              />
            )}
          </div>
          <div className={styles.centerHole} />
        </div>
      </div>

    </div>
  );
};
