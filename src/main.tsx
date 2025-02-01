import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.tsx";
import { VERSION_WITHOUT_V } from "./version.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

console.log("Launched Collage Maker v" + VERSION_WITHOUT_V + ".");
