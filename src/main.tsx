import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { measurePerformance } from "./utils/lazyLoad";

// Performance monitoring
window.addEventListener('load', () => {
  // Measure and log performance metrics
  setTimeout(() => {
    measurePerformance();
  }, 0);
});

// Mount React app first
const rootElement = document.getElementById("root")!;
createRoot(rootElement).render(<App />);

// Remove initial loader right after first paint to avoid blank flashes
requestAnimationFrame(() => {
  const loader = rootElement.querySelector('.initial-loader');
  if (loader) loader.remove();
});
