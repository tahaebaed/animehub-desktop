// Ad, pop-under and tracker networks commonly loaded by free third-party video players. A host is blocked when it
// equals a listed domain or is a subdomain of one. Add domains here when a player shows ads that get through.
const DOMAINS = [
  // Pop-unders, redirects, push-ad networks
  "popads.net", "popcash.net", "propellerads.com", "propellerclick.com", "adsterra.com", "adsterratools.com", "highperformanceformat.com",
  "highrevenueformat.com", "highcpmgate.com", "profitableratecpmnetwork.com", "effectiveratecpm.com", "onclickads.net", "onclickalgo.com",
  "onclickperformance.com", "clickadu.com", "hilltopads.net", "hilltopads.com", "adcash.com", "admaven.com", "ad-maven.com", "monetag.com",
  "galaksion.com", "pushground.com", "richpartners.co", "rollerads.com", "evadav.com", "zeydoo.com", "clickaine.com", "bidgear.com",
  "acint.net", "a-ads.com", "adskeeper.com", "mgid.com", "juicyads.com", "exoclick.com", "exosrv.com", "exdynsrv.com", "trafficjunky.net",
  "trafficstars.com", "tsyndicate.com", "realsrv.com", "magsrv.com", "tapioni.com", "whos.amung.us", "dtscout.com", "dtscdn.com",
  "pemsrv.com", "bebi.com", "shorte.st", "linkvertise.com", "ouo.io", "adf.ly", "cpmstar.com", "venatusmedia.com", "adspyglass.com",
  "vidsrc-ads.com", "streamads.org", "cloudvideo-ads.com", "pubfuture-ad.com", "aclib.net", "yandex.ru/ads",
  // Display ads and trackers
  "doubleclick.net", "googlesyndication.com", "googleadservices.com", "adservice.google.com", "google-analytics.com", "googletagservices.com",
  "adnxs.com", "amazon-adsystem.com", "criteo.com", "criteo.net", "taboola.com", "outbrain.com", "revcontent.com", "an.yandex.ru",
  "mc.yandex.ru", "histats.com", "statcounter.com", "hotjar.com", "clarity.ms", "disqusads.com", "zedo.com", "adform.net", "smartadserver.com",
];
const SET = new Set(DOMAINS.filter((d) => !d.includes("/")));

function isAd(host) {
  if (!host) return false;
  for (let h = host.toLowerCase(); h.includes("."); h = h.slice(h.indexOf(".") + 1)) if (SET.has(h)) return true;
  return false;
}

module.exports = { isAd };
