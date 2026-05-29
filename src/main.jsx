import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { InteractiveTextProvider } from "./context/InteractiveTextContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <InteractiveTextProvider>
      <App />
    </InteractiveTextProvider>
  </React.StrictMode>
);
