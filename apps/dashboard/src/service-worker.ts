/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

import { build, files, version } from "$service-worker"

const worker = self as unknown as ServiceWorkerGlobalScope
const CACHE = `cache-${version}`
const ASSETS = [...build, ...files]

worker.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)))
  worker.skipWaiting()
})

worker.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys.filter(key => key !== CACHE).map(key => caches.delete(key)),
        ),
      )
      .then(() => worker.clients.claim()),
  )
})

worker.addEventListener("fetch", event => {
  if (event.request.method !== "GET") {
    return
  }

  const url = new URL(event.request.url)

  if (!ASSETS.includes(url.pathname)) {
    return
  }

  event.respondWith(
    caches
      .open(CACHE)
      .then(
        async cache =>
          (await cache.match(url.pathname)) ?? fetch(event.request),
      ),
  )
})
