import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import * as Sentry from "@sentry/react";
import App from "./App.jsx";
import AppProvider from "./app/AppProvider.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import { sentryConfig, shouldInitializeSentry } from "./config/sentry.js";
import "./assets/styles/theme.css";
import "../index.css";

// Initialize Sentry for production error tracking
if (shouldInitializeSentry()) {
  Sentry.init({
    dsn: sentryConfig.dsn,
    environment: sentryConfig.environment,
    release: sentryConfig.release,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: sentryConfig.tracesSampleRate,
    replaysSessionSampleRate: sentryConfig.replaysSessionSampleRate,
    replaysOnErrorSampleRate: sentryConfig.replaysOnErrorSampleRate,
    beforeSend: sentryConfig.beforeSend,
    ignoreErrors: sentryConfig.ignoreErrors,
    denyUrls: sentryConfig.denyUrls,
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </AppProvider>
    </BrowserRouter>
  </StrictMode>
);
