const version = 10;
const staticCache = `pwaEx3StaticCache${version}`;
const imagesCache = 'imagesCache';
const dynamicCache = `pwaEx3DynamicCache${version}`;
const cacheList = [
  './',
  './index.html',
  './search-results.html',
  './suggested-movies.html',
  './404.html',
  './css/main.css',
  './js/app.js',
  './manifest.json',  
  './favicon.ico',
  './img/android-chrome-512x512.png',
  './img/apple-touch-icon.png',
  './img/android-chrome-192x192.png',
  './img/favicon-16x16.png',
  './img/favicon-32x32.png',
  './img/mstile-150x150.png',
  './img/logo-TMDB.svg',
  'https://fonts.googleapis.com/css2?family=Nunito&family=Roboto:ital@0;1&display=swap'
];


self.addEventListener('install', (ev) => {
  ev.waitUntil(
    caches.open(staticCache).then((cache) => {
    cache.addAll(cacheList);
    })
  );
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => {
              if (key === staticCache || key === dynamicCache || key === imagesCache) {
                return false;
              } else {
                return true;
              }
            })
            .map((key) => caches.delete(key))
        ); 
      })
      .catch(console.warn)
  );
});

self.addEventListener('fetch', (ev) => {

  ev.respondWith(
    caches.match(ev.request).then((cacheRes) => {
      return (
        cacheRes ||
        fetch(ev.request)
          .then((fetchRes) => {
            if(fetchRes.status > 399) throw new Error(fetchRes.statusText);
            return caches.open(dynamicCache).then((cache) => {
              let copy = fetchRes.clone(); //make a copy of the response
              cache.put(ev.request, copy); //put the copy into the cache
              return fetchRes; //send the original response back up the chain
            });
          })
          .catch((err) => {
            console.log('SW fetch failed');
            console.warn(err);
            return  caches.match('/404.html').then(cacheRes => {
                return cacheRes;
            });
          
          })
      );
    })
  ); 
});

