import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "ol/ol.css";
import "ol-layerswitcher/dist/ol-layerswitcher.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
