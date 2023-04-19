// shamelessly stolen from sarthaktexas/website-v4

const {
  SPOTIFY_CLIENT_SECRET: client_secret,
  SPOTIFY_CLIENT_ID: client_id,
  SPOTIFY_REFRESH_TOKEN: refresh_token,
  LASTFM_API_KEY: api_key,
} = process.env;

const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
const SPOTIFY_PLAYER_ENDPOINT = `https://api.spotify.com/v1/me/player?market=US`;
const SPOTIFY_TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;
const LASTFM_USERNAME = 'mzzzchael';
const LASTFM_ENDPOINT = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USERNAME}&api_key=${api_key}&format=json&limit=1`;

const getAccessToken = async () => {
  const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token
    })
  });

  return await response.json();
};

const postProcSpotify = (song) => {
  const isPlaying = song.is_playing;
  const title = song.item.name;
  const artist = song.item.artists.map((_artist) => _artist.name).join(', ');
  const album = song.item.album.name;
  const albumImageUrl = song.item.album.images[0].url;
  const songUrl = song.item.external_urls.spotify;
  let device;

  if (song.device.name === 'iPhone') {
    device = 'Michael\'s AirPods Pro';
  } else {
    device = song.device.name;
  }

  return {
    album,
    albumImageUrl,
    artist,
    device,
    isPlaying,
    songUrl,
    title
  }
}

const postProcLastFm = (song) => {
  const isPlaying = song['@attr']?.nowplaying == 'true';
  const title = song.name;
  const artist = song.artist['#text'];
  const album = song.album['#text'];
  const albumImageUrl = song.image[3]['#text'];
  const songUrl = song.url;
  const device = 'Michael\'s AirPods Pro';

  return {
    album,
    albumImageUrl,
    artist,
    device,
    isPlaying,
    songUrl,
    title
  }
}

export const getInfo = async () => {
  const { access_token } = await getAccessToken();

  const resp = await fetch(SPOTIFY_PLAYER_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  })

  if (resp.status === 204 || resp.status > 400) {
    const json = await recentTrack();
    const data = postProcLastFm(json);
    return data;
  } else {
    const json = await resp.json();
    const data = postProcSpotify(json);
    return data;
  }
};

const recentTrack = async () => {
  const endpoint = LASTFM_ENDPOINT;
  const resp = await fetch(endpoint);
  const json = await resp.json();
  return json.recenttracks.track[0];
}

export default async function handler(req, resp) {
  const track = await getInfo();
  console.log(track);
  resp.setHeader('Access-Control-Allow-Origin', '*');
  resp.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate=59');
  resp.status(200).json(track);
}
