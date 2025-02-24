// frontend/src/App.js
import React, { createContext, useMemo } from "react";
import { AppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";

import createApp from "@shopify/app-bridge";
import MonobankSettingsPage from "./MonobankSettingsPage";

// Создаём свой контекст для App Bridge
export const AppBridgeContext = createContext(null);

function App() {
  const params = new URLSearchParams(window.location.search);
  const host = params.get("host") || "";
  // const shop = params.get("shop") || ""; // Закомментируем неиспользуемую переменную

  const appBridge = useMemo(() => {
    if (!host) {
      console.error("No host parameter found");
      return null;
    }
    
    const apiKey = process.env.REACT_APP_SHOPIFY_API_KEY;
    if (!apiKey) {
      console.error("No REACT_APP_SHOPIFY_API_KEY found in environment");
      return null;
    }
    
    console.log("Host:", host);
    console.log("API Key available:", !!apiKey);
    
    return createApp({
      apiKey,
      host,
      forceRedirect: true
    });
  }, [host]);

  if (!appBridge) {
    return (
      <div>Error: Could not initialize App Bridge</div>
    );
  }

  return (
    <AppProvider i18n={enTranslations}>
      <AppBridgeContext.Provider value={appBridge}>
        <MonobankSettingsPage />
      </AppBridgeContext.Provider>
    </AppProvider>
  );
}

export default App;