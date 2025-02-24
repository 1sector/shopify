// Пример MonobankSettingsPage.js
import React, { useState, useCallback, useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react"; // <-- или используйте контекст
import { getSessionToken } from "@shopify/app-bridge-utils";
import { Page, Card, TextField, Button, Toast, Frame } from "@shopify/polaris";

function MonobankSettingsPage() {
  const appBridge = useAppBridge(); 
  const [tokenValue, setTokenValue] = useState("");
  const [toastActive, setToastActive] = useState(false);
  const [toastContent, setToastContent] = useState("");

  // При загрузке — GET /settings
  useEffect(() => {
    getSessionToken(appBridge).then((sessionToken) => {
      fetch("/settings", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(res)))
        .then((data) => {
          // data = { monobank_token: "..." }
          setTokenValue(data.monobank_token || "");
        })
        .catch((err) => {
          setToastContent("Failed to load token");
          setToastActive(true);
          console.error(err);
        });
    });
  }, [appBridge]);

  // Сохранение токена — POST /settings
  const handleSave = useCallback(() => {
    console.log("Starting token save...");
    
    getSessionToken(appBridge)
      .then((sessionToken) => {
        console.log("Got session token length:", sessionToken?.length);
        
        return fetch("/settings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ monobank_token: tokenValue }),
        });
      })
      .then((res) => {
        console.log("Response status:", res.status);
        if (!res.ok) {
          return res.json().then(err => Promise.reject(err));
        }
        return res.json();
      })
      .then((data) => {
        console.log("Success response:", data);
        setToastContent("Token saved successfully!");
        setToastActive(true);
      })
      .catch((err) => {
        console.error("Error saving token:", err);
        setToastContent(err.error || "Failed to save token");
        setToastActive(true);
      });
  }, [appBridge, tokenValue]);

  return (
    <Frame>
      {toastActive && <Toast content={toastContent} onDismiss={() => setToastActive(false)} />}
      <Page title="Monobank Settings">
        <Card sectioned>
          <TextField
            label="Monobank Token"
            value={tokenValue}
            onChange={setTokenValue}
            autoComplete="off"
          />
          <Button primary onClick={handleSave}>
            Save Token
          </Button>
        </Card>
      </Page>
    </Frame>
  );
}

export default MonobankSettingsPage;