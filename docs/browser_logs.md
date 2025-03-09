Sending insights generation request with auth token
chat.tsx:403 Trying new /api/insights endpoint...
chat.tsx:422 Successfully used new /api/insights endpoint
chat.tsx:443 Response from /api/insights - status: 200 OK
chat.tsx:450 Response headers: {access-control-allow-credentials: 'true', access-control-allow-origin: 'http://localhost:3000', connection: 'keep-alive', content-length: '2632', content-type: 'text/html; charset=utf-8', …}
chat.tsx:523 Error parsing JSON response: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
handleGenerateInsights @ chat.tsx:523
await in handleGenerateInsights
(anonymous) @ chat.tsx:230
setTimeout
handleNewMessage @ chat.tsx:229
handleSubmitResponse @ ConversationView.tsx:219
callCallback2 @ chunk-276SZO74.js?v=2ff988cd:3674
invokeGuardedCallbackDev @ chunk-276SZO74.js?v=2ff988cd:3699
invokeGuardedCallback @ chunk-276SZO74.js?v=2ff988cd:3733
invokeGuardedCallbackAndCatchFirstError @ chunk-276SZO74.js?v=2ff988cd:3736
executeDispatch @ chunk-276SZO74.js?v=2ff988cd:7014
processDispatchQueueItemsInOrder @ chunk-276SZO74.js?v=2ff988cd:7034
processDispatchQueue @ chunk-276SZO74.js?v=2ff988cd:7043
dispatchEventsForPlugins @ chunk-276SZO74.js?v=2ff988cd:7051
(anonymous) @ chunk-276SZO74.js?v=2ff988cd:7174
batchedUpdates$1 @ chunk-276SZO74.js?v=2ff988cd:18913
batchedUpdates @ chunk-276SZO74.js?v=2ff988cd:3579
dispatchEventForPluginEventSystem @ chunk-276SZO74.js?v=2ff988cd:7173
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-276SZO74.js?v=2ff988cd:5478
dispatchEvent @ chunk-276SZO74.js?v=2ff988cd:5472
dispatchDiscreteEvent @ chunk-276SZO74.js?v=2ff988cd:5449Understand this errorAI
chat.tsx:526 Raw response text: <!DOCTYPE html>
<html lang="en">
  <head>
    <style data-vite-theme="" data-inject-first="">:root {
      --background: 0 0% 100%;
--foreground: 20 14.3% 4.1%;
--muted: 60 4.8% 95.9%;
--muted-foreground: 25 5.3% 44.7%;
--popover: 0 0% 100%;
--popover-foreground: 20 14.3% 4.1%;
--card: 0 0% 100%;
--card-foreground: 20 14.3% 4.1%;
--border: 20 5.9% 90%;
--input: 20 5.9% 90%;
--primary: 142 76% 36%;
--primary-foreground: 127 38% 98%;
--secondary: 60 4.8% 95.9%;
--secondary-foreground: 24 9.8% 10%;
--accent: 60 4.8% 95.9%;
--accent-foreground: 24 9.8% 10%;
--destructive: 0 84.2% 60.2%;
--destructive-foreground: 60 9.1% 97.8%;
--ring: 20 14.3% 4.1%;
--radius: 0.5rem;
  }
  .dark {
      --background: 240 10% 3.9%;
--foreground: 0 0% 98%;
--muted: 240 3.7% 15.9%;
--muted-foreground: 240 5% 64.9%;
--popover: 240 10% 3.9%;
--popover-foreground: 0 0% 98%;
--card: 240 10% 3.9%;
--card-foreground: 0 0% 98%;
--border: 240 3.7% 15.9%;
--input: 240 3.7% 15.9%;
--primary: 142 76% 36%;
--primary-foreground: 127 38% 98%;
--secondary: 240 3.7% 15.9%;
--secondary-foreground: 0 0% 98%;
--accent: 240 3.7% 15.9%;
--accent-foreground: 0 0% 98%;
--destructive: 0 62.8% 30.6%;
--destructive-foreground: 0 0% 98%;
--ring: 240 4.9% 83.9%;
--radius: 0.5rem;
  }</style>

    <script type="module">
import RefreshRuntime from "/@react-refresh"
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true
</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="theme-color" content="#ffffff" />
    <title>SahabAI - Islamic Self-Reflection Tool</title>
    <meta name="description" content="An AI-powered tool for Islamic self-reflection and spiritual growth" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="/icon-192.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <!-- Arabic fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Scheherazade+New:wght@400;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?v=2RqJOAVzZyBGKn1Oi-Buf"></script>
  </body>
</html>
handleGenerateInsights @ chat.tsx:526
await in handleGenerateInsights
(anonymous) @ chat.tsx:230
setTimeout
handleNewMessage @ chat.tsx:229
handleSubmitResponse @ ConversationView.tsx:219
callCallback2 @ chunk-276SZO74.js?v=2ff988cd:3674
invokeGuardedCallbackDev @ chunk-276SZO74.js?v=2ff988cd:3699
invokeGuardedCallback @ chunk-276SZO74.js?v=2ff988cd:3733
invokeGuardedCallbackAndCatchFirstError @ chunk-276SZO74.js?v=2ff988cd:3736
executeDispatch @ chunk-276SZO74.js?v=2ff988cd:7014
processDispatchQueueItemsInOrder @ chunk-276SZO74.js?v=2ff988cd:7034
processDispatchQueue @ chunk-276SZO74.js?v=2ff988cd:7043
dispatchEventsForPlugins @ chunk-276SZO74.js?v=2ff988cd:7051
(anonymous) @ chunk-276SZO74.js?v=2ff988cd:7174
batchedUpdates$1 @ chunk-276SZO74.js?v=2ff988cd:18913
batchedUpdates @ chunk-276SZO74.js?v=2ff988cd:3579
dispatchEventForPluginEventSystem @ chunk-276SZO74.js?v=2ff988cd:7173
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-276SZO74.js?v=2ff988cd:5478
dispatchEvent @ chunk-276SZO74.js?v=2ff988cd:5472
dispatchDiscreteEvent @ chunk-276SZO74.js?v=2ff988cd:5449Understand this errorAI
chat.tsx:530 Error generating insights: Error: Failed to parse response: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
    at handleGenerateInsights (chat.tsx:527:15)