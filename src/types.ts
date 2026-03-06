export interface StationOption {
  name: string;
  url: string;
  logo: string;
  nowPlayingPreset: string;
  nowPlayingApiUrl: string;
}

export interface StationsByDay {
  sunday: StationOption;
  monday: StationOption;
  tuesday: StationOption;
  wednesday: StationOption;
  thursday: StationOption;
  friday: StationOption;
  saturday: StationOption;
}

export interface DaySelection {
  sunday: boolean;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
}

export interface ThursdayOverrideOption {
  enabled: boolean;
  startHour: number;
  days: DaySelection;
  station: StationOption;
}

export interface SimpleOptions {
  loadingText: string;
  clickToStartText: string;
  onAirPrefix: string;
  checkIntervalSeconds: number;
  continuePlaybackAcrossDashboards: boolean;
  discSize: number;
  goldMatchText: string;
  sameStationAllDays: boolean;
  sharedStation: StationOption;
  panelBorderColor: string;
  panelBorderWidth: number;
  discBorderColor: string;
  discBorderWidth: number;
  labelBorderColor: string;
  labelBorderWidth: number;
  stations: StationsByDay;
  thursdayOverride: ThursdayOverrideOption;
}

export const defaultStation = (
  name: string,
  url: string,
  logo: string,
  nowPlayingPreset = 'none',
  nowPlayingApiUrl = ''
): StationOption => ({ name, url, logo, nowPlayingPreset, nowPlayingApiUrl });

export const defaultOptions: SimpleOptions = {
  loadingText: 'Laden...',
  clickToStartText: 'Klik om te starten',
  onAirPrefix: 'ON AIR:',
  checkIntervalSeconds: 60,
  continuePlaybackAcrossDashboards: true,
  discSize: 250,
  goldMatchText: 'Sterren NL!',
  sameStationAllDays: false,
  sharedStation: defaultStation(
    'NPO Radio 2',
    'https://icecast.omroep.nl/radio2-bb-mp3',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdCJLx8IGdXAypZynnhiAdTxFXP-uOXKQGnA&s'
  ),
  panelBorderColor: '#111111',
  panelBorderWidth: 0,
  discBorderColor: '#111111',
  discBorderWidth: 2,
  labelBorderColor: '#111111',
  labelBorderWidth: 4,
  stations: {
    sunday: defaultStation(
      'NPO Radio 2',
      'https://icecast.omroep.nl/radio2-bb-mp3',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdCJLx8IGdXAypZynnhiAdTxFXP-uOXKQGnA&s'
    ),
    monday: defaultStation(
      'Arrow Classic Rock',
      'https://stream.player.arrow.nl/arrowcr',
      'https://www.arrow.nl/wp-content/uploads/2020/08/logo.png',
      'arrow-classic-rock'
    ),
    tuesday: defaultStation(
      'Arrow Classic Rock',
      'https://stream.player.arrow.nl/arrowcr',
      'https://www.arrow.nl/wp-content/uploads/2020/08/logo.png',
      'arrow-classic-rock'
    ),
    wednesday: defaultStation(
      'Arrow Classic Rock',
      'https://stream.player.arrow.nl/arrowcr',
      'https://www.arrow.nl/wp-content/uploads/2020/08/logo.png',
      'arrow-classic-rock'
    ),
    thursday: defaultStation(
      'JOE Nonstop!',
      'https://stream.joe.nl/joe/mp3',
      'https://upload.wikimedia.org/wikipedia/commons/1/15/JOE_Logo_2023.png'
    ),
    friday: defaultStation(
      'Sterren NL!',
      'https://icecast.omroep.nl/radio2-sterrennl-mp3',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/NPO_Sterren_NL_Logo_2014.svg/1280px-NPO_Sterren_NL_Logo_2014.svg.png',
      'npo-sterren-nl'
    ),
    saturday: defaultStation(
      'Sky Radio',
      'https://19993.live.streamtheworld.com/SKYRADIO.mp3',
      'https://www.skyradio.nl/favicon.ico'
    ),
  },
  thursdayOverride: {
    enabled: true,
    startHour: 15,
    days: {
      sunday: false,
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: true,
      friday: false,
      saturday: false,
    },
    station: defaultStation(
      'Sterren NL!',
      'https://icecast.omroep.nl/radio2-sterrennl-mp3',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/NPO_Sterren_NL_Logo_2014.svg/1280px-NPO_Sterren_NL_Logo_2014.svg.png',
      'npo-sterren-nl'
    ),
  },
};
