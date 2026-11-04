export interface NowPlayingTrack {
  artist: string;
  song: string;
  coverUrl: string;
}

interface NowPlayingPresetConfig {
  apiUrl: string;
  parser: 'sterren' | 'arrow' | 'generic';
  defaultCorsProxyUrl?: string;
}

export const nowPlayingPresets: Record<string, NowPlayingPresetConfig> = {
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

export const getNowPlayingApiUrl = (
  preset: string,
  customApiUrl: string,
  replaceVariables: (value: string) => string
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

export const applyCorsProxyUrl = (apiUrl: string, proxyTemplate: string): string => {
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

// Only strings and numbers count as text, so nested objects never render as "[object Object]".
const toText = (value: unknown): string => {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
};

const firstText = (...values: unknown[]): string => {
  return values.map(toText).find((text) => text.length > 0) ?? '';
};

const parseSterrenNowPlayingTrack = (payload: any): NowPlayingTrack | null => {
  const track = payload?.data?.radioTrackPlays?.data?.[0];
  const artist = firstText(track?.artist);
  const song = firstText(track?.song);
  const coverUrl = firstText(track?.radioTracks?.coverUrl);

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

  const artist = firstText(normalizedPayload?.artist, normalizedPayload?.station);
  const song = firstText(normalizedPayload?.title, normalizedPayload?.song, normalizedPayload?.track);
  const rawImage = firstText(normalizedPayload?.image, normalizedPayload?.coverUrl);
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

// Most specific entries come first: the root often carries station fields such as "name" or "title".
const getNestedTrackCandidates = (payload: any): any[] => {
  const data = payload?.data;

  return [
    payload?.currentTrack,
    payload?.nowPlaying,
    payload?.latestTrack,
    payload?.track,
    data?.currentTrack,
    data?.nowPlaying,
    data?.latestTrack,
    data?.track,
  ].concat(
    payload?.tracks ?? [],
    payload?.items ?? [],
    payload?.results ?? [],
    data?.tracks ?? [],
    data?.items ?? [],
    data?.results ?? [],
    data,
    payload
  );
};

const hasTrackMetadata = (entry: any): boolean => {
  if (!entry || typeof entry !== 'object') {
    return false;
  }

  return firstText(entry.artist, entry.artist?.name, entry.title, entry.song, entry.track, entry.nowPlaying).length > 0;
};

const parseGenericNowPlayingTrack = (payload: any): NowPlayingTrack | null => {
  const normalizedPayload = normalizeArrowPayload(payload);
  const candidate = getNestedTrackCandidates(normalizedPayload).find(hasTrackMetadata);

  if (!candidate) {
    return null;
  }

  return {
    artist: firstText(
      candidate.artist,
      candidate.artist?.name,
      normalizedPayload?.artist,
      normalizedPayload?.station,
      normalizedPayload?.name
    ),
    song: firstText(candidate.title, candidate.song, candidate.track, candidate.nowPlaying),
    coverUrl: firstText(
      candidate.albumArt,
      candidate.coverUrl,
      candidate.image,
      candidate.cover,
      candidate.artwork,
      normalizedPayload?.image,
      normalizedPayload?.cover,
      normalizedPayload?.coverUrl,
      normalizedPayload?.artwork,
      normalizedPayload?.albumArt
    ),
  };
};

export const parseNowPlayingTrack = (preset: string, payload: any): NowPlayingTrack | null => {
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

export const parseNowPlayingPayload = (rawPayload: string): any | null => {
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

export const withNoCacheTimestamp = (url: string): string => {
  if (url.includes('_=')) {
    return url.replace(/_=(\d+)?/g, `_=${Date.now()}`);
  }

  return url;
};
