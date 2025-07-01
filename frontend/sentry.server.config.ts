import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://e361b6f5a71325c0649205ce514e1a31@o4509546120675328.ingest.us.sentry.io/4509546126114816",
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 0.1,  // Reduce to 10% in development
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  
  // Additional options
  environment: process.env.NODE_ENV,
  
  // Server-specific options
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    
    // Don't send errors in development
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    
    return event;
  },
  
  // Integrations
  integrations: [
    // Default integrations will be added automatically
  ],
});