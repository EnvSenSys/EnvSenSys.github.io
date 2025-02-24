'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {
  "2024/version.json": "cfa61aa4e5881d5fa05774a54b32feac",
  "2024/index.html": "6a6cfdb093ff0c55ccda9e1ce9ce69b7",
  "2024/main.dart.js": "d4d85f4bedbca164d4367210492398b9",
  "2024/flutter.js": "7d69e653079438abfbb24b82a655b0a4",
  "2024/favicon.png": "eeddb6419dcc08a87f3f8a8195386c02",
  "2024/icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
  "2024/icons/Icon-maskable-192.png": "c457ef57daa1d16f64b27b786ec2ea3c",
  "2024/icons/Icon-maskable-512.png": "301a7604d45b3e739efc881eb04896ea",
  "2024/icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
  "2024/manifest.json": "72b65abf750f5d064e6c2a1e9db18182",
  "2024/assets/AssetManifest.json": "d656432c90bf608138b0e5df9ffadd30",
  "2024/assets/NOTICES": "ca555915f470d733c5e4ca63eae07b65",
  "2024/assets/FontManifest.json": "746d9bb46f219558ee0cbc6938fccc23",
  "2024/assets/AssetManifest.bin.json": "5b20fd432c943b1679a2b0f94ff5a363",
  "2024/assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "89ed8f4e49bcdfc0b5bfc9b24591e347",
  "2024/assets/shaders/ink_sparkle.frag": "4096b5150bac93c41cbc9b45276bd90f",
  "2024/assets/AssetManifest.bin": "68def50e44ecd17faa7e05d73ebfaa44",
  "2024/assets/fonts/MaterialIcons-Regular.otf": "176048e01878186745ac87a0e9b29631",
  "2024/canvaskit/skwasm.js": "87063acf45c5e1ab9565dcf06b0c18b8",
  "2024/canvaskit/skwasm.wasm": "2fc47c0a0c3c7af8542b601634fe9674",
  "2024/canvaskit/chromium/canvaskit.js": "0ae8bbcc58155679458a0f7a00f66873",
  "2024/canvaskit/chromium/canvaskit.wasm": "143af6ff368f9cd21c863bfa4274c406",
  "2024/canvaskit/canvaskit.js": "eb8797020acdbdf96a12fb0405582c1b",
  "2024/canvaskit/canvaskit.wasm": "73584c1a3367e3eaf757647a8f5c5989",
  "2024/canvaskit/skwasm.worker.js": "bfb704a6c714a75da9ef320991e88b03"
};

const CORE = [
  "2024/main.dart.js",
  "2024/index.html",
  "2024/assets/AssetManifest.json",
  "2024/assets/FontManifest.json"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});

self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        self.clients.claim();
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 6); // 跳过 '2024/' 部分
        if (key == "") {
          key = "/";
        }
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      self.clients.claim();
      return;
    } catch (err) {
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 6); // 跳过 '2024/' 部分
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  if (!RESOURCES[key]) {
    return;
  }
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});
