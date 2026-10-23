// FINDS isolated PWA cache experiment — TEST 3
const CACHE='finds-isolated-pwa-test-v3';
const SHELL=['./index.html','./manifest.webmanifest','./version.json'];
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(SHELL.map(p=>new Request(p,{cache:'reload'})));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('finds-isolated-pwa-test-')&&k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 const url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 // Navigations always try the server, bypassing the HTTP cache.
 if(request.mode==='navigate'){
  event.respondWith((async()=>{
   try{
    const response=await fetch(new Request(request,{cache:'no-store'}));
    if(response.ok){
     const cache=await caches.open(CACHE);
     await cache.put('./index.html',response.clone());
    }
    return response;
   }catch(e){
    return (await caches.match('./index.html'))||Response.error();
   }
  })());
  return;
 }
 event.respondWith((async()=>{
  try{
   const response=await fetch(new Request(request,{cache:'no-store'}));
   if(response.ok)(await caches.open(CACHE)).put(request,response.clone());
   return response;
  }catch(e){return (await caches.match(request))||Response.error()}
 })());
});