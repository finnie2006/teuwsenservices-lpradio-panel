import { withNoCacheTimestamp } from './nowPlaying';

// One audio element for the whole page. It lives outside React so that it can keep playing on
// dashboards without a radio panel, which is how playlists are expected to work.

export interface RadioPlayerSnapshot {
  playingUrl: string;
  hasPlaybackError: boolean;
}

type PlayResult = 'ok' | 'blocked' | 'failed';

const PLAYBACK_INTENT_STORAGE_KEY = 'lpRadio.playbackIntent';
const WATCHDOG_INTERVAL_MS = 5_000;
const STREAM_STALL_THRESHOLD_MS = 10_000;
const STREAM_RESTART_COOLDOWN_MS = 15_000;

let player: HTMLAudioElement | null = null;
let streamUrl = '';
let panelCount = 0;
let playbackIntent = false;
let watchdog: number | undefined;
let stopButton: HTMLButtonElement | null = null;
let stopButtonEnabled = true;
let snapshot: RadioPlayerSnapshot = { playingUrl: '', hasPlaybackError: false };

const listeners = new Set<() => void>();
const streamProgress = { lastTime: 0, lastProgressAt: 0, lastRestartAt: 0 };

const readStoredIntent = (): boolean => {
  try {
    return window.sessionStorage.getItem(PLAYBACK_INTENT_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

// The intent survives the full page reload that Grafana does after a few playlist loops.
const setPlaybackIntent = (intent: boolean) => {
  playbackIntent = intent;

  try {
    if (intent) {
      window.sessionStorage.setItem(PLAYBACK_INTENT_STORAGE_KEY, 'true');
    } else {
      window.sessionStorage.removeItem(PLAYBACK_INTENT_STORAGE_KEY);
    }
  } catch {
    // Storage can be unavailable in restricted browser contexts; the in-memory intent still works.
  }
};

const publish = (hasPlaybackError = snapshot.hasPlaybackError) => {
  const playingUrl = player && !player.paused ? streamUrl : '';

  if (playingUrl !== snapshot.playingUrl || hasPlaybackError !== snapshot.hasPlaybackError) {
    snapshot = { playingUrl, hasPlaybackError };
    listeners.forEach((listener) => listener());
  }
};

const syncStopButton = () => {
  const shouldShow = player !== null && !player.paused && panelCount === 0 && stopButtonEnabled;

  if (!shouldShow) {
    stopButton?.remove();
    stopButton = null;
    return;
  }

  if (stopButton) {
    return;
  }

  // Without a panel on screen React and the Grafana theme context are not available.
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = '■ Stop radio';
  button.setAttribute('data-testid', 'lp-radio-stop');
  button.style.cssText =
    'position:fixed;right:12px;bottom:12px;z-index:1000;padding:4px 10px;border:0;border-radius:4px;' +
    'background:rgba(0,0,0,0.6);color:#fff;font-size:12px;cursor:pointer;opacity:0.6;';
  button.addEventListener('click', stopRadio);
  document.body.appendChild(button);
  stopButton = button;
};

const onPlay = () => {
  setPlaybackIntent(true);
  publish(false);
  syncStopButton();
};

const onPause = () => {
  // A stream closed by the server also fires "pause"; every other pause came from the listener, for example media keys.
  if (!player?.ended) {
    setPlaybackIntent(false);
  }

  publish();
  syncStopButton();

  if (panelCount === 0 && !playbackIntent) {
    destroyPlayer();
  }
};

const onProgress = () => {
  if (player) {
    streamProgress.lastTime = player.currentTime;
    streamProgress.lastProgressAt = Date.now();
  }
};

const progressEvents = ['playing', 'timeupdate', 'progress', 'loadeddata', 'canplay'];

const destroyPlayer = () => {
  if (!player) {
    return;
  }

  const audio = player;
  window.clearInterval(watchdog);
  audio.removeEventListener('play', onPlay);
  audio.removeEventListener('pause', onPause);
  progressEvents.forEach((event) => audio.removeEventListener(event, onProgress));
  audio.removeAttribute('src');
  audio.load();
  audio.remove();
  player = null;
  streamUrl = '';
  publish(false);
  syncStopButton();
};

const loadStream = (audio: HTMLAudioElement, url: string, bypassCache = false) => {
  streamUrl = url;
  audio.src = bypassCache ? withNoCacheTimestamp(url) : url;
  audio.load();
  streamProgress.lastTime = 0;
  streamProgress.lastProgressAt = Date.now();
  publish();
};

// load() pauses without firing "pause", so the intent survives and the next station with a stream starts by itself.
const silencePlayer = (audio: HTMLAudioElement) => {
  streamUrl = '';
  audio.removeAttribute('src');
  audio.load();
  publish(false);
  syncStopButton();
};

const tryPlay = async (audio: HTMLAudioElement): Promise<PlayResult> => {
  try {
    await audio.play();
    publish(false);
    return 'ok';
  } catch (error) {
    const errorName = (error as Error)?.name;

    // AbortError means a newer load() replaced this attempt, which then reports its own result.
    if (errorName === 'AbortError') {
      return 'ok';
    }

    publish(true);
    return errorName === 'NotAllowedError' ? 'blocked' : 'failed';
  }
};

const restartStream = async (audio: HTMLAudioElement) => {
  streamProgress.lastRestartAt = Date.now();
  loadStream(audio, streamUrl, true);
  await tryPlay(audio);
};

const checkStream = async () => {
  if (!player || !playbackIntent || !streamUrl) {
    return;
  }

  const audio = player;
  const nowTs = Date.now();
  const restartOnCooldown = nowTs - streamProgress.lastRestartAt < STREAM_RESTART_COOLDOWN_MS;

  if (audio.paused) {
    if (restartOnCooldown) {
      return;
    }

    if (audio.ended) {
      await restartStream(audio);
      return;
    }

    streamProgress.lastRestartAt = nowTs;

    // Reloading cannot help while the browser blocks autoplay, so only reload after other failures.
    if ((await tryPlay(audio)) === 'failed' && player === audio) {
      await restartStream(audio);
    }
    return;
  }

  if (audio.currentTime > streamProgress.lastTime + 0.1) {
    streamProgress.lastTime = audio.currentTime;
    streamProgress.lastProgressAt = nowTs;
    return;
  }

  if (nowTs - streamProgress.lastProgressAt >= STREAM_STALL_THRESHOLD_MS && !restartOnCooldown) {
    await restartStream(audio);
  }
};

const getOrCreatePlayer = (): HTMLAudioElement => {
  if (player) {
    return player;
  }

  const audio = document.createElement('audio');
  audio.preload = 'none';
  audio.style.display = 'none';
  audio.setAttribute('data-lp-radio-player', 'global');
  audio.addEventListener('play', onPlay);
  audio.addEventListener('pause', onPause);
  progressEvents.forEach((event) => audio.addEventListener(event, onProgress));
  document.body.appendChild(audio);

  player = audio;
  playbackIntent = playbackIntent || readStoredIntent();
  streamProgress.lastProgressAt = Date.now();
  streamProgress.lastRestartAt = 0;
  watchdog = window.setInterval(() => {
    void checkStream();
  }, WATCHDOG_INTERVAL_MS);

  return audio;
};

export const subscribeToRadioPlayer = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const getRadioPlayerSnapshot = (): RadioPlayerSnapshot => snapshot;

export const registerRadioPanel = (continuePlayback: boolean) => {
  const audio = getOrCreatePlayer();
  panelCount += 1;

  if (!continuePlayback && audio.paused) {
    setPlaybackIntent(false);
  }

  syncStopButton();
};

export const unregisterRadioPanel = (continuePlayback: boolean, showStopButton: boolean) => {
  panelCount = Math.max(0, panelCount - 1);
  stopButtonEnabled = showStopButton;

  if (!continuePlayback) {
    player?.pause();
  }

  // A playing player must outlive its panel: playlists also visit dashboards without a radio panel.
  if (panelCount === 0 && player?.paused) {
    destroyPlayer();
  }

  syncStopButton();
};

// Called on panel mount and when the schedule changes the station. With several panels on one
// dashboard only the first one, or the panel whose stream is playing, may take over the player.
export const followStation = (url: string, previousUrl: string | undefined) => {
  const mayTakeOver = previousUrl === undefined ? panelCount === 1 : streamUrl === previousUrl;

  if (!player || !playbackIntent || !mayTakeOver) {
    return;
  }

  if (!url) {
    silencePlayer(player);
    return;
  }

  if (player.paused || streamUrl !== url) {
    loadStream(player, url);
    void tryPlay(player);
  }
};

export const togglePlayback = async (url: string) => {
  // A station without a stream has nothing to start, but a click still stops what another panel plays.
  if (!url) {
    player?.pause();
    return;
  }

  const audio = getOrCreatePlayer();

  if (!audio.paused && streamUrl === url) {
    audio.pause();
    return;
  }

  // Always reload: a live stream should resume at the live position, not from an old buffer.
  setPlaybackIntent(true);
  loadStream(audio, url);

  if ((await tryPlay(audio)) !== 'ok') {
    setPlaybackIntent(false);
  }
};

export const stopRadio = () => {
  setPlaybackIntent(false);
  player?.pause();
  destroyPlayer();
};
