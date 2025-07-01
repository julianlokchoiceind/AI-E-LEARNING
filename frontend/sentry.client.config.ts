import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://e361b6f5a71325c0649205ce514e1a31@o4509546120675328.ingest.us.sentry.io/4509546126114816",
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 0.1,  // Reduce to 10% in development
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  
  replaysOnErrorSampleRate: 1.0,
  
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Performance Monitoring
  beforeSend(event, hint) {
    // Filter out specific errors in development
    if (process.env.NODE_ENV === 'development') {
      // Don't send localhost errors
      if (event.request?.url?.includes('localhost')) {
        return null;
      }
    }
    return event;
  },
  
  // Additional options
  environment: process.env.NODE_ENV,
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    // Random plugins/extensions
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    // Facebook related errors
    'fb_xd_fragment',
    // IE specific errors
    'Non-Error promise rejection captured',
  ],
});