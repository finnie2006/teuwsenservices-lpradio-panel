import { parseNowPlayingTrack } from './nowPlaying';

describe('custom JSON now playing parsing', () => {
  it('parses a playlist payload with tracks array and albumArt', () => {
    const payload = {
      stationKey: 'slam',
      tracks: [
        {
          createdAt: '2026-08-12T08:08:42.7966667Z',
          artist: 'Mau P',
          title: 'Neck',
          duration: 216,
          albumArt: 'https://cdn-metadata.mediahuisradio.nl/metadata/covers/abc123.jpg',
        },
      ],
    };

    expect(parseNowPlayingTrack('custom-json', payload)).toEqual({
      artist: 'Mau P',
      song: 'Neck',
      coverUrl: 'https://cdn-metadata.mediahuisradio.nl/metadata/covers/abc123.jpg',
    });
  });

  it('returns null for a valid JSON payload without track metadata', () => {
    const payload = {
      stationKey: 'slam',
      tracks: [],
      status: 'ok',
    };

    expect(parseNowPlayingTrack('custom-json', payload)).toBeNull();
  });

  it('does not mistake station fields on the root for the current track', () => {
    const payload = { name: 'Slam', tracks: [{ artist: 'Mau P', title: 'Neck' }] };

    expect(parseNowPlayingTrack('custom-json', payload)).toEqual({ artist: 'Mau P', song: 'Neck', coverUrl: '' });
    expect(parseNowPlayingTrack('custom-json', { name: 'Slam', tracks: [] })).toBeNull();
  });

  it.each(['nowPlaying', 'track', 'currentTrack'])('reads a nested %s object instead of stringifying it', (key) => {
    const payload = { [key]: { artist: 'Mau P', title: 'Neck' } };

    expect(parseNowPlayingTrack('custom-json', payload)).toEqual({ artist: 'Mau P', song: 'Neck', coverUrl: '' });
  });

  it('keeps supporting flat payloads with a station name', () => {
    expect(parseNowPlayingTrack('custom-json', { station: 'Slam', title: 'Neck', image: 'cover.jpg' })).toEqual({
      artist: 'Slam',
      song: 'Neck',
      coverUrl: 'cover.jpg',
    });
  });

  it('falls back when a field is an empty string', () => {
    expect(parseNowPlayingTrack('arrow-classic-rock', { artist: '', station: 'Arrow', title: 'Song' })).toEqual({
      artist: 'Arrow',
      song: 'Song',
      coverUrl: '',
    });
  });
});
