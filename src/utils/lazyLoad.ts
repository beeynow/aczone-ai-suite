// Lazy loading utility for images and components
export const lazyLoadImage = (img: HTMLImageElement) => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const lazyImage = entry.target as HTMLImageElement;
          const src = lazyImage.getAttribute('data-src');
          if (src) {
            lazyImage.src = src;
            lazyImage.removeAttribute('data-src');
          }
          observer.unobserve(lazyImage);
        }
      });
    },
    {
      rootMargin: '50px 0px',
      threshold: 0.01,
    }
  );

  observer.observe(img);
};

// Performance monitoring utilities
export const measurePerformance = () => {
  if (typeof window === 'undefined') return;

  const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (perfData) {
    const metrics = {
      // First Contentful Paint
      FCP: perfData.responseStart - perfData.fetchStart,
      // Time to Interactive
      TTI: perfData.domInteractive - perfData.fetchStart,
      // DOM Content Loaded
      DCL: perfData.domContentLoadedEventEnd - perfData.fetchStart,
      // Load Complete
      LC: perfData.loadEventEnd - perfData.fetchStart,
    };

    console.log('Performance Metrics:', metrics);
    return metrics;
  }
};

// Optimize images for web
export const optimizeImage = (src: string, width?: number, quality = 75): string => {
  // If it's a URL, return as is
  if (src.startsWith('http')) return src;
  
  // For local images, you could implement image optimization here
  return src;
};

// Prefetch critical resources
export const prefetchResource = (href: string, as: 'script' | 'style' | 'font' | 'fetch' = 'fetch') => {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = as;
  link.href = href;
  document.head.appendChild(link);
};

// Critical CSS injection
export const injectCriticalCSS = (css: string) => {
  if (typeof window === 'undefined') return;
  
  const style = document.createElement('style');
  style.innerHTML = css;
  document.head.appendChild(style);
};
