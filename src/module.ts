import { PanelPlugin } from '@grafana/data';
import { defaultOptions, SimpleOptions } from './types';
import { SimplePanel } from './components/SimplePanel';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOptions((builder) => {
  return builder
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
    .addTextInput({
      path: 'sharedStation.name',
      name: 'Shared station name',
      defaultValue: defaultOptions.sharedStation.name,
      category: ['Stations', 'Shared station'],
      showIf: (config) => config.sameStationAllDays,
    })
    .addTextInput({
      path: 'sharedStation.url',
      name: 'Shared station stream URL',
      defaultValue: defaultOptions.sharedStation.url,
      category: ['Stations', 'Shared station'],
      showIf: (config) => config.sameStationAllDays,
    })
    .addTextInput({
      path: 'sharedStation.logo',
      name: 'Shared station logo URL',
      defaultValue: defaultOptions.sharedStation.logo,
      category: ['Stations', 'Shared station'],
      showIf: (config) => config.sameStationAllDays,
    })
    .addSelect({
      path: 'sharedStation.nowPlayingPreset',
      name: 'Shared now playing preset',
      defaultValue: defaultOptions.sharedStation.nowPlayingPreset,
      settings: {
        options: [
          { value: 'none', label: 'Geen' },
          { value: 'npo-sterren-nl', label: 'NPO Sterren NL' },
          { value: 'arrow-classic-rock', label: 'Arrow Classic Rock' },
        ],
      },
      category: ['Stations', 'Shared station'],
      showIf: (config) => config.sameStationAllDays,
    })
    .addTextInput({
      path: 'sharedStation.nowPlayingApiUrl',
      name: 'Shared now playing API URL',
      defaultValue: defaultOptions.sharedStation.nowPlayingApiUrl,
      description: 'Laat leeg om de URL uit de geselecteerde preset te gebruiken.',
      category: ['Stations', 'Shared station'],
      showIf: (config) => config.sameStationAllDays && config.sharedStation?.nowPlayingPreset !== 'none',
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
    })
    .addBooleanSwitch({
      path: 'thursdayOverride.days.sunday',
      name: 'Apply on Sunday',
      defaultValue: defaultOptions.thursdayOverride.days.sunday,
      category: ['Schedule override', 'Days'],
      showIf: (config) => config.thursdayOverride?.enabled,
    })
    .addBooleanSwitch({
      path: 'thursdayOverride.days.monday',
      name: 'Apply on Monday',
      defaultValue: defaultOptions.thursdayOverride.days.monday,
      category: ['Schedule override', 'Days'],
      showIf: (config) => config.thursdayOverride?.enabled,
    })
    .addBooleanSwitch({
      path: 'thursdayOverride.days.tuesday',
      name: 'Apply on Tuesday',
      defaultValue: defaultOptions.thursdayOverride.days.tuesday,
      category: ['Schedule override', 'Days'],
      showIf: (config) => config.thursdayOverride?.enabled,
    })
    .addBooleanSwitch({
      path: 'thursdayOverride.days.wednesday',
      name: 'Apply on Wednesday',
      defaultValue: defaultOptions.thursdayOverride.days.wednesday,
      category: ['Schedule override', 'Days'],
      showIf: (config) => config.thursdayOverride?.enabled,
    })
    .addBooleanSwitch({
      path: 'thursdayOverride.days.thursday',
      name: 'Apply on Thursday',
      defaultValue: defaultOptions.thursdayOverride.days.thursday,
      category: ['Schedule override', 'Days'],
      showIf: (config) => config.thursdayOverride?.enabled,
    })
    .addBooleanSwitch({
      path: 'thursdayOverride.days.friday',
      name: 'Apply on Friday',
      defaultValue: defaultOptions.thursdayOverride.days.friday,
      category: ['Schedule override', 'Days'],
      showIf: (config) => config.thursdayOverride?.enabled,
    })
    .addBooleanSwitch({
      path: 'thursdayOverride.days.saturday',
      name: 'Apply on Saturday',
      defaultValue: defaultOptions.thursdayOverride.days.saturday,
      category: ['Schedule override', 'Days'],
      showIf: (config) => config.thursdayOverride?.enabled,
    })
    .addTextInput({
      path: 'thursdayOverride.station.name',
      name: 'Override station name',
      defaultValue: defaultOptions.thursdayOverride.station.name,
      category: ['Schedule override'],
      showIf: (config) => config.thursdayOverride?.enabled,
    })
    .addTextInput({
      path: 'thursdayOverride.station.url',
      name: 'Override station URL',
      defaultValue: defaultOptions.thursdayOverride.station.url,
      category: ['Schedule override'],
      showIf: (config) => config.thursdayOverride?.enabled,
    })
    .addTextInput({
      path: 'thursdayOverride.station.logo',
      name: 'Override station logo URL',
      defaultValue: defaultOptions.thursdayOverride.station.logo,
      category: ['Schedule override'],
      showIf: (config) => config.thursdayOverride?.enabled,
    })
    .addSelect({
      path: 'thursdayOverride.station.nowPlayingPreset',
      name: 'Override now playing preset',
      defaultValue: defaultOptions.thursdayOverride.station.nowPlayingPreset,
      settings: {
        options: [
          { value: 'none', label: 'Geen' },
          { value: 'npo-sterren-nl', label: 'NPO Sterren NL' },
          { value: 'arrow-classic-rock', label: 'Arrow Classic Rock' },
        ],
      },
      category: ['Schedule override'],
      showIf: (config) => config.thursdayOverride?.enabled,
    })
    .addTextInput({
      path: 'thursdayOverride.station.nowPlayingApiUrl',
      name: 'Override now playing API URL',
      defaultValue: defaultOptions.thursdayOverride.station.nowPlayingApiUrl,
      description: 'Laat leeg om de URL uit de geselecteerde preset te gebruiken.',
      category: ['Schedule override'],
      showIf: (config) => config.thursdayOverride?.enabled && config.thursdayOverride?.station?.nowPlayingPreset !== 'none',
    })
    .addTextInput({
      path: 'stations.sunday.name',
      name: 'Sunday name',
      defaultValue: defaultOptions.stations.sunday.name,
      category: ['Stations', 'Sunday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addTextInput({
      path: 'stations.sunday.url',
      name: 'Sunday stream URL',
      defaultValue: defaultOptions.stations.sunday.url,
      category: ['Stations', 'Sunday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addTextInput({
      path: 'stations.sunday.logo',
      name: 'Sunday logo URL',
      defaultValue: defaultOptions.stations.sunday.logo,
      category: ['Stations', 'Sunday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addSelect({
      path: 'stations.sunday.nowPlayingPreset',
      name: 'Sunday now playing preset',
      defaultValue: defaultOptions.stations.sunday.nowPlayingPreset,
      settings: {
        options: [
          { value: 'none', label: 'Geen' },
          { value: 'npo-sterren-nl', label: 'NPO Sterren NL' },
          { value: 'arrow-classic-rock', label: 'Arrow Classic Rock' },
        ],
      },
      category: ['Stations', 'Sunday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addTextInput({
      path: 'stations.sunday.nowPlayingApiUrl',
      name: 'Sunday now playing API URL',
      defaultValue: defaultOptions.stations.sunday.nowPlayingApiUrl,
      description: 'Laat leeg om de URL uit de geselecteerde preset te gebruiken.',
      category: ['Stations', 'Sunday'],
      showIf: (config) => !config.sameStationAllDays && config.stations?.sunday?.nowPlayingPreset !== 'none',
    })
    .addTextInput({
      path: 'stations.monday.name',
      name: 'Monday name',
      defaultValue: defaultOptions.stations.monday.name,
      category: ['Stations', 'Monday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addTextInput({
      path: 'stations.monday.url',
      name: 'Monday stream URL',
      defaultValue: defaultOptions.stations.monday.url,
      category: ['Stations', 'Monday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addTextInput({
      path: 'stations.monday.logo',
      name: 'Monday logo URL',
      defaultValue: defaultOptions.stations.monday.logo,
      category: ['Stations', 'Monday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addSelect({
      path: 'stations.monday.nowPlayingPreset',
      name: 'Monday now playing preset',
      defaultValue: defaultOptions.stations.monday.nowPlayingPreset,
      settings: {
        options: [
          { value: 'none', label: 'Geen' },
          { value: 'npo-sterren-nl', label: 'NPO Sterren NL' },
          { value: 'arrow-classic-rock', label: 'Arrow Classic Rock' },
        ],
      },
      category: ['Stations', 'Monday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addTextInput({
      path: 'stations.monday.nowPlayingApiUrl',
      name: 'Monday now playing API URL',
      defaultValue: defaultOptions.stations.monday.nowPlayingApiUrl,
      description: 'Laat leeg om de URL uit de geselecteerde preset te gebruiken.',
      category: ['Stations', 'Monday'],
      showIf: (config) => !config.sameStationAllDays && config.stations?.monday?.nowPlayingPreset !== 'none',
    })
    .addTextInput({
      path: 'stations.tuesday.name',
      name: 'Tuesday name',
      defaultValue: defaultOptions.stations.tuesday.name,
      category: ['Stations', 'Tuesday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addTextInput({
      path: 'stations.tuesday.url',
      name: 'Tuesday stream URL',
      defaultValue: defaultOptions.stations.tuesday.url,
      category: ['Stations', 'Tuesday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addTextInput({
      path: 'stations.tuesday.logo',
      name: 'Tuesday logo URL',
      defaultValue: defaultOptions.stations.tuesday.logo,
      category: ['Stations', 'Tuesday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addSelect({
      path: 'stations.tuesday.nowPlayingPreset',
      name: 'Tuesday now playing preset',
      defaultValue: defaultOptions.stations.tuesday.nowPlayingPreset,
      settings: {
        options: [
          { value: 'none', label: 'Geen' },
          { value: 'npo-sterren-nl', label: 'NPO Sterren NL' },
          { value: 'arrow-classic-rock', label: 'Arrow Classic Rock' },
        ],
      },
      category: ['Stations', 'Tuesday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addTextInput({
      path: 'stations.tuesday.nowPlayingApiUrl',
      name: 'Tuesday now playing API URL',
      defaultValue: defaultOptions.stations.tuesday.nowPlayingApiUrl,
      description: 'Laat leeg om de URL uit de geselecteerde preset te gebruiken.',
      category: ['Stations', 'Tuesday'],
      showIf: (config) => !config.sameStationAllDays && config.stations?.tuesday?.nowPlayingPreset !== 'none',
    })
    .addTextInput({
      path: 'stations.wednesday.name',
      name: 'Wednesday name',
      defaultValue: defaultOptions.stations.wednesday.name,
      category: ['Stations', 'Wednesday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addTextInput({
      path: 'stations.wednesday.url',
      name: 'Wednesday stream URL',
      defaultValue: defaultOptions.stations.wednesday.url,
      category: ['Stations', 'Wednesday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addTextInput({
      path: 'stations.wednesday.logo',
      name: 'Wednesday logo URL',
      defaultValue: defaultOptions.stations.wednesday.logo,
      category: ['Stations', 'Wednesday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addSelect({
      path: 'stations.wednesday.nowPlayingPreset',
      name: 'Wednesday now playing preset',
      defaultValue: defaultOptions.stations.wednesday.nowPlayingPreset,
      settings: {
        options: [
          { value: 'none', label: 'Geen' },
          { value: 'npo-sterren-nl', label: 'NPO Sterren NL' },
          { value: 'arrow-classic-rock', label: 'Arrow Classic Rock' },
        ],
      },
      category: ['Stations', 'Wednesday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addTextInput({
      path: 'stations.wednesday.nowPlayingApiUrl',
      name: 'Wednesday now playing API URL',
      defaultValue: defaultOptions.stations.wednesday.nowPlayingApiUrl,
      description: 'Laat leeg om de URL uit de geselecteerde preset te gebruiken.',
      category: ['Stations', 'Wednesday'],
      showIf: (config) => !config.sameStationAllDays && config.stations?.wednesday?.nowPlayingPreset !== 'none',
    })
    .addTextInput({
      path: 'stations.thursday.name',
      name: 'Thursday name',
      defaultValue: defaultOptions.stations.thursday.name,
      category: ['Stations', 'Thursday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addTextInput({
      path: 'stations.thursday.url',
      name: 'Thursday stream URL',
      defaultValue: defaultOptions.stations.thursday.url,
      category: ['Stations', 'Thursday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addTextInput({
      path: 'stations.thursday.logo',
      name: 'Thursday logo URL',
      defaultValue: defaultOptions.stations.thursday.logo,
      category: ['Stations', 'Thursday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addSelect({
      path: 'stations.thursday.nowPlayingPreset',
      name: 'Thursday now playing preset',
      defaultValue: defaultOptions.stations.thursday.nowPlayingPreset,
      settings: {
        options: [
          { value: 'none', label: 'Geen' },
          { value: 'npo-sterren-nl', label: 'NPO Sterren NL' },
          { value: 'arrow-classic-rock', label: 'Arrow Classic Rock' },
        ],
      },
      category: ['Stations', 'Thursday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addTextInput({
      path: 'stations.thursday.nowPlayingApiUrl',
      name: 'Thursday now playing API URL',
      defaultValue: defaultOptions.stations.thursday.nowPlayingApiUrl,
      description: 'Laat leeg om de URL uit de geselecteerde preset te gebruiken.',
      category: ['Stations', 'Thursday'],
      showIf: (config) => !config.sameStationAllDays && config.stations?.thursday?.nowPlayingPreset !== 'none',
    })
    .addTextInput({
      path: 'stations.friday.name',
      name: 'Friday name',
      defaultValue: defaultOptions.stations.friday.name,
      category: ['Stations', 'Friday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addTextInput({
      path: 'stations.friday.url',
      name: 'Friday stream URL',
      defaultValue: defaultOptions.stations.friday.url,
      category: ['Stations', 'Friday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addTextInput({
      path: 'stations.friday.logo',
      name: 'Friday logo URL',
      defaultValue: defaultOptions.stations.friday.logo,
      category: ['Stations', 'Friday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addSelect({
      path: 'stations.friday.nowPlayingPreset',
      name: 'Friday now playing preset',
      defaultValue: defaultOptions.stations.friday.nowPlayingPreset,
      settings: {
        options: [
          { value: 'none', label: 'Geen' },
          { value: 'npo-sterren-nl', label: 'NPO Sterren NL' },
          { value: 'arrow-classic-rock', label: 'Arrow Classic Rock' },
        ],
      },
      category: ['Stations', 'Friday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addTextInput({
      path: 'stations.friday.nowPlayingApiUrl',
      name: 'Friday now playing API URL',
      defaultValue: defaultOptions.stations.friday.nowPlayingApiUrl,
      description: 'Laat leeg om de URL uit de geselecteerde preset te gebruiken.',
      category: ['Stations', 'Friday'],
      showIf: (config) => !config.sameStationAllDays && config.stations?.friday?.nowPlayingPreset !== 'none',
    })
    .addTextInput({
      path: 'stations.saturday.name',
      name: 'Saturday name',
      defaultValue: defaultOptions.stations.saturday.name,
      category: ['Stations', 'Saturday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addTextInput({
      path: 'stations.saturday.url',
      name: 'Saturday stream URL',
      defaultValue: defaultOptions.stations.saturday.url,
      category: ['Stations', 'Saturday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addTextInput({
      path: 'stations.saturday.logo',
      name: 'Saturday logo URL',
      defaultValue: defaultOptions.stations.saturday.logo,
      category: ['Stations', 'Saturday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addSelect({
      path: 'stations.saturday.nowPlayingPreset',
      name: 'Saturday now playing preset',
      defaultValue: defaultOptions.stations.saturday.nowPlayingPreset,
      settings: {
        options: [
          { value: 'none', label: 'Geen' },
          { value: 'npo-sterren-nl', label: 'NPO Sterren NL' },
          { value: 'arrow-classic-rock', label: 'Arrow Classic Rock' },
        ],
      },
      category: ['Stations', 'Saturday'],
      showIf: (config) => !config.sameStationAllDays,
    })
    .addTextInput({
      path: 'stations.saturday.nowPlayingApiUrl',
      name: 'Saturday now playing API URL',
      defaultValue: defaultOptions.stations.saturday.nowPlayingApiUrl,
      description: 'Laat leeg om de URL uit de geselecteerde preset te gebruiken.',
      category: ['Stations', 'Saturday'],
      showIf: (config) => !config.sameStationAllDays && config.stations?.saturday?.nowPlayingPreset !== 'none',
    });
});
