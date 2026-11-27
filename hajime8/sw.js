'use strict';

const cacheName = 'hajime8-v2';
const scope = self.registration.scope;
const entry = new URL('index.html', scope).href;
const assets = new Set([
  'index.html', 'style.css', 'app.js', 'manifest.json', 'icon.svg',
  'icon-180.png', 'icon-192.png', 'icon-512.png',
].map(path => new URL(path, scope).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName)
    .then(cache => cache.addAll([...assets].map(url => new Request(url, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys
      .filter(key => /^hajime8-v\d+$/.test(key) && key !== cacheName)
      .map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const page = request.mode === 'navigate' && (url.origin + url.pathname === scope || url.origin + url.pathname === entry);
  if (!page && !assets.has(url.href)) return;

  event.respondWith(caches.open(cacheName)
    .then(cache => cache.match(page ? entry : request))
    .then(response => response || fetch(request)));
});
