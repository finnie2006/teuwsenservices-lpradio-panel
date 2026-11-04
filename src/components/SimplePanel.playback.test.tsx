import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { defaultOptions, SimpleOptions } from 'types';
import { stopRadio } from './radioPlayer';
import { SimplePanel } from './SimplePanel';

const STATION_A = 'https://example.com/a';
const STATION_B = 'https://example.com/b';

const panelProps = (overrides: Partial<SimpleOptions> = {}, url = STATION_A) => {
  const options: SimpleOptions = {
    ...defaultOptions,
    sameStationAllDays: true,
    sharedStation: { ...defaultOptions.sharedStation, name: `Station ${url}`, url },
    thursdayOverride: { ...defaultOptions.thursdayOverride, enabled: false },
    ...overrides,
  };

  return { options, width: 400, height: 400, replaceVariables: (value: string) => value } as any;
};

const renderPanel = (overrides: Partial<SimpleOptions> = {}, url = STATION_A) => {
  return render(<SimplePanel {...panelProps(overrides, url)} />);
};

const getPlayer = () => document.querySelector<HTMLAudioElement>('audio[data-lp-radio-player]');

const clickDisc = async (index = 0) => {
  await act(async () => {
    fireEvent.click(screen.getAllByTestId('lp-click-zone')[index]);
  });
};

const advanceTime = async (ms: number) => {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
};

describe('playback across dashboards', () => {
  let playSpy: jest.SpyInstance;
  let loadSpy: jest.SpyInstance;

  beforeEach(() => {
    const pausedState = new WeakMap<HTMLMediaElement, boolean>();

    jest.spyOn(window.HTMLMediaElement.prototype, 'paused', 'get').mockImplementation(function (
      this: HTMLMediaElement
    ) {
      return pausedState.get(this) ?? true;
    });
    // Like a browser: load() pauses the element without firing a pause event.
    loadSpy = jest.spyOn(window.HTMLMediaElement.prototype, 'load').mockImplementation(function (
      this: HTMLMediaElement
    ) {
      pausedState.set(this, true);
    });
    playSpy = jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(function (
      this: HTMLMediaElement
    ) {
      pausedState.set(this, false);
      this.dispatchEvent(new Event('play'));
      return Promise.resolve();
    });
    jest.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(function (this: HTMLMediaElement) {
      pausedState.set(this, true);
      this.dispatchEvent(new Event('pause'));
    });
    // Keep the test independent of the real now playing endpoints.
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
  });

  afterEach(() => {
    cleanup();
    stopRadio();
    window.sessionStorage.clear();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('keeps playing on a dashboard without a player and reuses the player afterwards', async () => {
    const firstDashboard = renderPanel();
    await clickDisc();
    const player = getPlayer()!;

    firstDashboard.unmount();

    expect(player.paused).toBe(false);
    expect(player.isConnected).toBe(true);
    expect(player.getAttribute('src')).toBe(STATION_A);

    renderPanel();

    expect(getPlayer()).toBe(player);
    expect(player.paused).toBe(false);
    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('lp-click-zone')).toHaveAttribute('aria-pressed', 'true');
  });

  it('removes a paused player when the last panel unmounts', async () => {
    const dashboard = renderPanel();
    await clickDisc();
    await clickDisc();
    const player = getPlayer()!;

    dashboard.unmount();

    expect(player.isConnected).toBe(false);
    expect(getPlayer()).toBeNull();
  });

  it('stops and removes the player when continuous playback is disabled', async () => {
    const dashboard = renderPanel({ continuePlaybackAcrossDashboards: false });
    await clickDisc();
    const player = getPlayer()!;

    dashboard.unmount();

    expect(player.paused).toBe(true);
    expect(player.isConnected).toBe(false);
    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it('shows a stop button only while playing without a panel', async () => {
    const firstDashboard = renderPanel();
    expect(screen.queryByTestId('lp-radio-stop')).toBeNull();
    await clickDisc();
    const player = getPlayer()!;

    firstDashboard.unmount();
    fireEvent.click(screen.getByTestId('lp-radio-stop'));

    expect(player.paused).toBe(true);
    expect(getPlayer()).toBeNull();
    expect(screen.queryByTestId('lp-radio-stop')).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
  });

  it('can hide the stop button for unattended screens', async () => {
    const firstDashboard = renderPanel({ showStopButtonWithoutPanel: false });
    await clickDisc();

    firstDashboard.unmount();

    expect(getPlayer()!.paused).toBe(false);
    expect(screen.queryByTestId('lp-radio-stop')).toBeNull();
  });

  it('resumes after a full page reload when the listener was playing', async () => {
    window.sessionStorage.setItem('lpRadio.playbackIntent', 'true');

    await act(async () => {
      renderPanel();
    });

    expect(getPlayer()!.paused).toBe(false);
    expect(getPlayer()!.getAttribute('src')).toBe(STATION_A);
  });

  it('does not resume after a reload when continuous playback is disabled', async () => {
    window.sessionStorage.setItem('lpRadio.playbackIntent', 'true');

    await act(async () => {
      renderPanel({ continuePlaybackAcrossDashboards: false });
    });

    expect(playSpy).not.toHaveBeenCalled();
  });

  it('shows the start hint when the browser blocks autoplay, also with now playing metadata', async () => {
    window.sessionStorage.setItem('lpRadio.playbackIntent', 'true');
    playSpy.mockImplementation(() => Promise.reject(new DOMException('blocked', 'NotAllowedError')));

    await act(async () => {
      renderPanel({
        nowPlayingOnlyWhilePlaying: false,
        sharedStation: {
          ...defaultOptions.sharedStation,
          url: STATION_A,
          nowPlayingPreset: 'custom-json',
          nowPlayingApiUrl: 'https://example.com/api',
        },
      });
    });

    expect(screen.getByTestId('track-info')).toHaveTextContent(defaultOptions.clickToStartText);
    expect(window.sessionStorage.getItem('lpRadio.playbackIntent')).toBe('true');
  });

  it('respects a pause from media keys instead of restarting the stream', async () => {
    jest.useFakeTimers();
    renderPanel();
    await clickDisc();

    await act(async () => {
      getPlayer()!.pause();
    });
    await advanceTime(120_000);

    expect(getPlayer()!.paused).toBe(true);
    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it('restarts a stalled stream without a panel on screen', async () => {
    jest.useFakeTimers();
    const dashboard = renderPanel();
    await clickDisc();
    dashboard.unmount();
    loadSpy.mockClear();
    playSpy.mockClear();

    await advanceTime(20_000);

    expect(loadSpy).toHaveBeenCalled();
    expect(playSpy).toHaveBeenCalled();
    expect(getPlayer()!.paused).toBe(false);
  });

  it('plays the station of the clicked panel and keeps a pause with several panels', async () => {
    jest.useFakeTimers();
    render(
      <>
        <SimplePanel {...panelProps({}, STATION_A)} />
        <SimplePanel {...panelProps({}, STATION_B)} />
      </>
    );

    await clickDisc(1);
    expect(getPlayer()!.getAttribute('src')).toBe(STATION_B);
    expect(screen.getAllByTestId('lp-click-zone')[0]).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getAllByTestId('lp-click-zone')[1]).toHaveAttribute('aria-pressed', 'true');

    await clickDisc(0);
    expect(getPlayer()!.getAttribute('src')).toBe(STATION_A);

    await clickDisc(0);
    playSpy.mockClear();
    await advanceTime(120_000);

    expect(getPlayer()!.paused).toBe(true);
    expect(playSpy).not.toHaveBeenCalled();
  });

  it('switches stream when the schedule changes the station', async () => {
    const dashboard = renderPanel();
    await clickDisc();

    await act(async () => {
      dashboard.rerender(<SimplePanel {...panelProps({}, STATION_B)} />);
    });

    expect(getPlayer()!.getAttribute('src')).toBe(STATION_B);
    expect(getPlayer()!.paused).toBe(false);
  });

  it('goes silent on a station without a stream and resumes on the next station', async () => {
    jest.useFakeTimers();
    const dashboard = renderPanel();
    await clickDisc();
    playSpy.mockClear();

    await act(async () => {
      dashboard.rerender(<SimplePanel {...panelProps({}, '')} />);
    });
    await advanceTime(120_000);

    expect(getPlayer()!.paused).toBe(true);
    expect(getPlayer()!.getAttribute('src')).toBeNull();
    expect(playSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId('lp-click-zone')).toHaveAttribute('aria-pressed', 'false');

    await act(async () => {
      dashboard.rerender(<SimplePanel {...panelProps({}, STATION_B)} />);
    });

    expect(getPlayer()!.getAttribute('src')).toBe(STATION_B);
    expect(getPlayer()!.paused).toBe(false);
  });

  it('stays stopped after a station without a stream when the listener had paused', async () => {
    const dashboard = renderPanel();
    await clickDisc();
    await clickDisc();
    playSpy.mockClear();

    await act(async () => {
      dashboard.rerender(<SimplePanel {...panelProps({}, '')} />);
    });
    await act(async () => {
      dashboard.rerender(<SimplePanel {...panelProps({}, STATION_B)} />);
    });

    expect(playSpy).not.toHaveBeenCalled();
    expect(getPlayer()!.paused).toBe(true);
  });
});

describe('panel options', () => {
  beforeEach(() => {
    jest.spyOn(window.HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    stopRadio();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('does not poll without a pause when the interval field is empty', async () => {
    jest.useFakeTimers();
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ artist: 'Mau P', title: 'Neck' }),
    });
    global.fetch = fetchMock;

    renderPanel({
      checkIntervalSeconds: undefined as unknown as number,
      nowPlayingOnlyWhilePlaying: false,
      sharedStation: {
        ...defaultOptions.sharedStation,
        nowPlayingPreset: 'custom-json',
        nowPlayingApiUrl: 'https://example.com/api',
      },
    });
    await advanceTime(1_000);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to the default disc size when the field is empty', () => {
    renderPanel({ discSize: undefined as unknown as number });

    expect(screen.getByTestId('lp-click-zone')).toHaveStyle({ width: `${defaultOptions.discSize}px` });
  });

  it('does not use the override unless it is enabled', () => {
    expect(defaultOptions.thursdayOverride.enabled).toBe(false);
  });

  it('keeps an empty logo instead of showing the default logo', () => {
    renderPanel({ sharedStation: { ...defaultOptions.sharedStation, logo: '' } });

    expect(document.querySelector('img')).toBeNull();
  });

  it('uses the default logo when the field is missing', () => {
    const { logo, ...stationWithoutLogo } = defaultOptions.sharedStation;

    renderPanel({ sharedStation: stationWithoutLogo as SimpleOptions['sharedStation'] });

    expect(document.querySelector('img')).toHaveAttribute('src', logo);
  });

  it('does not start a station without a stream, but can still stop a running stream', async () => {
    const playSpy = jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue();
    const pauseSpy = jest.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});

    renderPanel({}, '');
    await clickDisc();

    expect(playSpy).not.toHaveBeenCalled();
    expect(pauseSpy).toHaveBeenCalled();
  });

  it('resolves named Grafana colors and keeps hex colors', () => {
    renderPanel({ panelBorderWidth: 2, panelBorderColor: 'dark-red', discBorderColor: '#123456' });

    expect(screen.getByTestId('lp-disc').style.border).toContain('#123456');
    expect(screen.getByTestId('track-info').parentElement!.style.border).toMatch(/2px solid (#|rgb)/i);
  });

  it('stops loading images when both the cover and the logo fail', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ artist: 'Mau P', title: 'Neck', image: 'https://example.com/cover.jpg' }),
    });
    global.fetch = fetchMock;

    await act(async () => {
      renderPanel({
        nowPlayingOnlyWhilePlaying: false,
        sharedStation: {
          ...defaultOptions.sharedStation,
          logo: 'https://example.com/logo.png',
          nowPlayingPreset: 'custom-json',
          nowPlayingApiUrl: 'https://example.com/api',
        },
      });
    });

    fireEvent.error(document.querySelector('img')!);
    expect(document.querySelector('img')).toHaveAttribute('src', 'https://example.com/logo.png');

    fireEvent.error(document.querySelector('img')!);
    expect(document.querySelector('img')).toBeNull();
  });
});

describe('timed override', () => {
  beforeEach(() => {
    jest.spyOn(window.HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    stopRadio();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it.each([
    [14, 'Regular'],
    [15, 'Override'],
    [17, 'Regular'],
  ])('at %i:00 uses the %s station', (hour, expectedName) => {
    jest.useFakeTimers({ now: new Date(2026, 10, 3, hour, 0, 0) });
    const allDays = { sunday: true, monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true };

    renderPanel({
      sharedStation: { ...defaultOptions.sharedStation, name: 'Regular' },
      thursdayOverride: {
        ...defaultOptions.thursdayOverride,
        enabled: true,
        startHour: 15,
        endHour: 17,
        days: allDays,
        station: { ...defaultOptions.sharedStation, name: 'Override' },
      },
    });

    expect(screen.getByTestId('track-info')).toHaveTextContent(expectedName);
  });
});
