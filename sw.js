'use strict';

const prefix = 'time-calculator-' + self.registration.scope + '-';
const cacheName = prefix + 'v2';
const entry = new URL('./index.html', self.registration.scope).href;
const assets = [
  './index.html', './style.css', './app.js', './manifest.json',
  './icons/180.png', './icons/192.png', './icons/512.png',
];
const assetUrls = new Set(assets.map(asset => new URL(asset, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName)
    .then(cache => cache.addAll(assets.map(asset => new Request(asset, { cache: 'reload' })))));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys
      .filter(key => key.startsWith(prefix) && key !== cacheName)
      .map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const base = new URL(self.registration.scope);
  const isEntry = request.mode === 'navigate' && url.origin === base.origin &&
    (url.pathname === base.pathname || url.pathname === new URL(entry).pathname);
  if (!isEntry && !assetUrls.has(url.href)) return;
  event.respondWith(caches.open(cacheName)
    .then(cache => cache.match(isEntry ? entry : request))
    .then(response => response || fetch(request)));
});
