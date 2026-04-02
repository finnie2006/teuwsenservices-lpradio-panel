import { PanelPlugin } from '@grafana/data';
import { defaultOptions, SimpleOptions } from './types';
import { SimplePanel } from './components/SimplePanel';

const nowPlayingPresetOptions = [
  { value: 'none', label: 'None' },
  { value: 'npo-sterren-nl', label: 'NPO Sterren NL' },
  { value: 'arrow-classic-rock', label: 'Arrow Classic Rock' },
  { value: 'custom-json', label: 'Custom JSON API (artist/title/image)' },
];

const nowPlayingApiDescription =
  'Leave empty to use the selected preset URL. Custom JSON API reads artist/title/image (also supports song/track/coverUrl variants).';

const weekDays = [
  { key: 'sunday', label: 'Sunday' },
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
] as const;

type WeekDayKey = (typeof weekDays)[number]['key'];

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOptions((builder) => {
  const addStationEditorGroup = (
    pathPrefix: string,
    defaultStation: (typeof defaultOptions)['sharedStation'],
    namePrefix: string,
    category: string[],
    showIf: (config: SimpleOptions) => boolean
  ) => {
    builder
      .addTextInput({
        path: `${pathPrefix}.name`,
        name: `${namePrefix} name`,
        defaultValue: defaultStation.name,
        category,
        showIf,
      })
      .addTextInput({
        path: `${pathPrefix}.url`,
        name: `${namePrefix} stream URL`,
        defaultValue: defaultStation.url,
        category,
        showIf,
      })
      .addTextInput({
        path: `${pathPrefix}.logo`,
        name: `${namePrefix} logo URL`,
        defaultValue: defaultStation.logo,
        category,
        showIf,
      })
      .addSelect({
        path: `${pathPrefix}.nowPlayingPreset`,
        name: `${namePrefix} now playing preset`,
        defaultValue: defaultStation.nowPlayingPreset,
        settings: {
          options: nowPlayingPresetOptions,
        },
        category,
        showIf,
      })
      .addTextInput({
        path: `${pathPrefix}.nowPlayingApiUrl`,
        name: `${namePrefix} now playing API URL`,
        defaultValue: defaultStation.nowPlayingApiUrl,
        description: nowPlayingApiDescription,
        category,
        showIf: (config) => showIf(config) && getStationPreset(config, pathPrefix) !== 'none',
      });
  };

  const getStationPreset = (config: SimpleOptions, pathPrefix: string): string => {
    const keyParts = pathPrefix.split('.');

    if (keyParts.length === 2 && keyParts[0] === 'stations') {
      const dayKey = keyParts[1] as WeekDayKey;
      return config.stations?.[dayKey]?.nowPlayingPreset ?? 'none';
    }

    if (pathPrefix === 'sharedStation') {
      return config.sharedStation?.nowPlayingPreset ?? 'none';
    }

    if (pathPrefix === 'thursdayOverride.station') {
      return config.thursdayOverride?.station?.nowPlayingPreset ?? 'none';
    }

    return 'none';
  };

  const addOverrideDayToggles = () => {
    weekDays.forEach((day) => {
      builder.addBooleanSwitch({
        path: `thursdayOverride.days.${day.key}`,
        name: `Apply on ${day.label}`,
        defaultValue: defaultOptions.thursdayOverride.days[day.key],
        category: ['Schedule override', 'Days'],
        showIf: (config) => config.thursdayOverride?.enabled,
      });
    });
  };

  const addDailyStationEditors = () => {
    weekDays.forEach((day) => {
      addStationEditorGroup(
        `stations.${day.key}`,
        defaultOptions.stations[day.key],
        day.label,
        ['Stations', day.label],
        (config) => !config.sameStationAllDays
      );
    });
  };

  builder
    .addTextInput({
      path: 'loadingText',
      name: 'Loading text',
      defaultValue: defaultOptions.loadingText,
      category: ['Display'],
    })
    .addTextInput({
      path: 'clickToStartText',
      name: 'Start hint text',
      defaultValue: defaultOptions.clickToStartText,
      category: ['Display'],
    })
    .addTextInput({
      path: 'onAirPrefix',
      name: 'On-air prefix',
      defaultValue: defaultOptions.onAirPrefix,
      category: ['Display'],
    })
    .addTextInput({
      path: 'goldMatchText',
      name: 'Gold highlight match',
      description: 'When station name contains this text, gold styling is applied.',
      defaultValue: defaultOptions.goldMatchText,
      category: ['Display'],
    })
    .addNumberInput({
      path: 'discSize',
      name: 'Disc size (px)',
      defaultValue: defaultOptions.discSize,
      settings: {
        min: 120,
        max: 500,
        integer: true,
      },
      category: ['Display'],
    })
    .addNumberInput({
      path: 'checkIntervalSeconds',
      name: 'Schedule check interval (sec)',
      defaultValue: defaultOptions.checkIntervalSeconds,
      settings: {
        min: 5,
        max: 3600,
        integer: true,
      },
      category: ['Display'],
    })
    .addTextInput({
      path: 'nowPlayingCorsProxyUrl',
      name: 'Now playing CORS proxy URL',
      defaultValue: defaultOptions.nowPlayingCorsProxyUrl,
      description: 'Optional. Applies to all stations. Use {{url}} placeholder or a prefix like https://r.jina.ai/ to proxy now playing API calls.',
      category: ['Display'],
    })
    .addBooleanSwitch({
      path: 'continuePlaybackAcrossDashboards',
      name: 'Continue playback in playlists',
      defaultValue: defaultOptions.continuePlaybackAcrossDashboards,
      category: ['Display'],
    })
    .addTextInput({
      path: 'panelBorderColor',
      name: 'Panel border color',
      defaultValue: defaultOptions.panelBorderColor,
      category: ['Styling'],
    })
    .addNumberInput({
      path: 'panelBorderWidth',
      name: 'Panel border width (px)',
      defaultValue: defaultOptions.panelBorderWidth,
      settings: {
        min: 0,
        max: 16,
        integer: true,
      },
      category: ['Styling'],
    })
    .addTextInput({
      path: 'discBorderColor',
      name: 'Disc border color',
      defaultValue: defaultOptions.discBorderColor,
      category: ['Styling'],
    })
    .addNumberInput({
      path: 'discBorderWidth',
      name: 'Disc border width (px)',
      defaultValue: defaultOptions.discBorderWidth,
      settings: {
        min: 0,
        max: 16,
        integer: true,
      },
      category: ['Styling'],
    })
    .addTextInput({
      path: 'labelBorderColor',
      name: 'Label border color',
      defaultValue: defaultOptions.labelBorderColor,
      category: ['Styling'],
    })
    .addNumberInput({
      path: 'labelBorderWidth',
      name: 'Label border width (px)',
      defaultValue: defaultOptions.labelBorderWidth,
      settings: {
        min: 0,
        max: 16,
        integer: true,
      },
      category: ['Styling'],
    })
    .addBooleanSwitch({
      path: 'sameStationAllDays',
      name: 'Use same station every day',
      defaultValue: defaultOptions.sameStationAllDays,
      category: ['Stations'],
    })
    .addBooleanSwitch({
      path: 'thursdayOverride.enabled',
      name: 'Enable timed override',
      defaultValue: defaultOptions.thursdayOverride.enabled,
      category: ['Schedule override'],
    })
    .addNumberInput({
      path: 'thursdayOverride.startHour',
      name: 'Override starts at hour',
      defaultValue: defaultOptions.thursdayOverride.startHour,
      settings: {
        min: 0,
        max: 23,
        integer: true,
      },
      category: ['Schedule override'],
      showIf: (config) => config.thursdayOverride?.enabled,
    });

  addStationEditorGroup(
    'sharedStation',
    defaultOptions.sharedStation,
    'Shared station',
    ['Stations', 'Shared station'],
    (config) => config.sameStationAllDays
  );

  addOverrideDayToggles();

  addStationEditorGroup(
    'thursdayOverride.station',
    defaultOptions.thursdayOverride.station,
    'Override station',
    ['Schedule override'],
    (config) => config.thursdayOverride?.enabled
  );

  addDailyStationEditors();

  return builder;
});
