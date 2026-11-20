// v0.8: do not cache welfare catalog or API; avoid serving stale eligibility data.
const CACHE='bokji-shell-v08';
const SHELL=['./','./index.html','./icons/icon-192.png','./icons/icon-512.png','./offline.html'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]))});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 const url=new URL(req.url);if(url.pathname.includes('/data/')||url.pathname.includes('/api/'))return; // network only for public benefit data
 if(req.mode==='navigate'){event.respondWith(fetch(req).catch(()=>caches.match('./offline.html')));return}
 event.respondWith(fetch(req).catch(()=>caches.match(req)));
});
