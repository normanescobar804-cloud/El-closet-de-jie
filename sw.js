/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-b1bafff1'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "b0eb771438c050e1af3d074eda109dc3"
  }, {
    "url": "pwa-512x512.png",
    "revision": "29d3504a8053dfe9bd3a75368f6d8f81"
  }, {
    "url": "pwa-192x192.png",
    "revision": "6872eeb1406f3d634dd8252b5ea7da07"
  }, {
    "url": "portada.jpg",
    "revision": "a91fbadb7577d0b6191eab40b60247ac"
  }, {
    "url": "index.html",
    "revision": "9e28cd46c966f29362a417f1d81c792e"
  }, {
    "url": "icon.svg",
    "revision": "8d6c10cac65a9216cf348a08847f259f"
  }, {
    "url": "icon-maskable.svg",
    "revision": "ac464e139c15535b7323ccdb6d350b38"
  }, {
    "url": "favicon.png",
    "revision": "734b50c8def80bda47cfb0fed846cedc"
  }, {
    "url": "favicon.ico",
    "revision": "b74e61abefe541f9e64a82a749f985cb"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "e744ffc696056aeb76c54d8179dd1df5"
  }, {
    "url": "404.html",
    "revision": "4bcd826f1654a19a03181da5df442ba0"
  }, {
    "url": "assets/workbox-window.prod.es5-BBnX5xw4.js",
    "revision": null
  }, {
    "url": "assets/receipt-pdf-D7tZRfUN.js",
    "revision": null
  }, {
    "url": "assets/purify.es-CAi2OJFm.js",
    "revision": null
  }, {
    "url": "assets/portada_closet_jie_1789701820109-C8oT5xj6.jpg",
    "revision": null
  }, {
    "url": "assets/index.es-D7vByiwJ.js",
    "revision": null
  }, {
    "url": "assets/index-Ca5AuahJ.css",
    "revision": null
  }, {
    "url": "assets/index-BsxBArg6.js",
    "revision": null
  }, {
    "url": "assets/icons-BWnZwU1y.js",
    "revision": null
  }, {
    "url": "assets/firebase-bundle-BzJIgaf0.js",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_20261111-212604_464ee1dd.jpg",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_20261111-205918_bb9e0da4.jpg",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "e744ffc696056aeb76c54d8179dd1df5"
  }, {
    "url": "favicon.ico",
    "revision": "b74e61abefe541f9e64a82a749f985cb"
  }, {
    "url": "favicon.png",
    "revision": "734b50c8def80bda47cfb0fed846cedc"
  }, {
    "url": "icon-maskable.svg",
    "revision": "ac464e139c15535b7323ccdb6d350b38"
  }, {
    "url": "icon.svg",
    "revision": "8d6c10cac65a9216cf348a08847f259f"
  }, {
    "url": "portada.jpg",
    "revision": "a91fbadb7577d0b6191eab40b60247ac"
  }, {
    "url": "pwa-192x192.png",
    "revision": "6872eeb1406f3d634dd8252b5ea7da07"
  }, {
    "url": "pwa-512x512.png",
    "revision": "29d3504a8053dfe9bd3a75368f6d8f81"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "b0eb771438c050e1af3d074eda109dc3"
  }, {
    "url": "manifest.webmanifest",
    "revision": "1792f3ccafd9ec6012099856cb68314c"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/images\.unsplash\.com\/.*/i, new workbox.StaleWhileRevalidate({
    "cacheName": "product-catalog-images",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 150,
      maxAgeSeconds: 2592000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
