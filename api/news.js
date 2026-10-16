// Top headlines for the Choudhury Home app (server side, so the phone never hits CORS limits).
const FEEDS = [
  { tag: 'US', url: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en' },
  { tag: 'Maryland', url: 'https://news.google.com/rss/search?q=Montgomery+County+Maryland&hl=en-US&gl=US&ceid=US:en' },
  { tag: 'India', url: 'https://news.google.com/rss/headlines/section/geo/India?hl=en-IN&gl=IN&ceid=IN:en' },
  { tag: 'Bengal', url: 'https://news.google.com/rss/search?q=Kolkata+West+Bengal&hl=en-IN&gl=IN&ceid=IN:en' }
];
const decode = s => s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
async function pull(feed) {
  const r = await fetch(feed.url, { headers: { 'User-Agent': 'ChoudhuryHome/1.0' } });
  const xml = await r.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 4).map(m => {
    const get = t => { const x = m[1].match(new RegExp('<' + t + '[^>]*>([\\s\\S]*?)</' + t + '>')); return x ? decode(x[1]) : ''; };
    return { tag: feed.tag, title: get('title'), link: get('link'), date: get('pubDate'), source: get('source') };
  });
}
module.exports = async (req, res) => {
  try {
    const out = (await Promise.allSettled(FEEDS.map(pull))).flatMap(x => x.status === 'fulfilled' ? x.value : []);
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
    res.status(200).json({ updated: new Date().toISOString(), items: out });
  } catch (e) {
    res.status(200).json({ updated: new Date().toISOString(), items: [] });
  }
};
