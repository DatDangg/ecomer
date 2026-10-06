import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@/lib/i18n";
import "@/index.css";
import { App } from "@/App";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Không tìm thấy phần tử gốc #root để render ứng dụng");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
