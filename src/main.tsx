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

// Remove initial loader
const rootElement = document.getElementById("root")!;
const loader = rootElement.querySelector('.initial-loader');
if (loader) {
  loader.remove();
}

createRoot(rootElement).render(<App />);
