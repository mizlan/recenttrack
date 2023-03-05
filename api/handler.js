const {
  LASTFM_API_KEY: api_key
} = process.env;

const recentTrack = async () => {
  const endpoint = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=mzzzchael&api_key=${api_key}&format=json&limit=1`
  const resp = await fetch(endpoint);
  const json = await resp.json();
  return json['recenttracks']['track'][0];
}

export default async function handler(req, resp) {
  const track = await recentTrack();
  console.log(track);
  resp.setHeader('Access-Control-Allow-Origin', '*');
  resp.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate=59');
  resp.status(200).json(track);
}
