import { parseNowPlayingTrack } from './SimplePanel';

describe('custom JSON now playing parsing', () => {
  it('parses the Mediahuis playlist payload with tracks array and albumArt', () => {
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
});
