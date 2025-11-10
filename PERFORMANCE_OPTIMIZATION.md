# Performance Optimization Guide

## Overview
This document outlines the comprehensive performance optimizations implemented to maximize SI (Speed Index), FCP (First Contentful Paint), and LCP (Largest Contentful Paint) for both mobile and desktop.

## Implemented Optimizations

### 1. Critical Resource Optimization
- **Preconnect & DNS Prefetch**: Added for Supabase and Google Analytics domains
- **Critical CSS Inline**: Essential styles inlined in HTML for faster FCP
- **Resource Hints**: Implemented for faster resource loading

### 2. Loading Performance
- **Initial Loading Spinner**: Provides visual feedback during app initialization
- **Lazy Loading**: Images load only when entering viewport
- **Code Splitting**: Vendor chunks separated for better caching
- **Asset Optimization**: Small assets inlined (<4KB)

### 3. Core Web Vitals Monitoring
Real-time monitoring of:
- **LCP (Largest Contentful Paint)**: Target < 2.5s
- **FID (First Input Delay)**: Target < 100ms
- **CLS (Cumulative Layout Shift)**: Target < 0.1

### 4. Build Optimizations
- **Manual Chunks**: Vendor libraries split for optimal caching
- **CSS Code Splitting**: Separate CSS bundles per route
- **Modern Target**: ESNext for smaller bundle sizes
- **Minification**: ESBuild for fast, efficient compression

### 5. Image Optimization
- **OptimizedImage Component**: Lazy loading with intersection observer
- **Aspect Ratio Preservation**: Prevents layout shift
- **Progressive Loading**: Blur-up effect during load
- **Content Visibility**: Browser-native lazy rendering

### 6. Font Optimization
- **Font Display Swap**: Prevents invisible text (FOIT)
- **System Fonts**: Fallback to system fonts for instant rendering

### 7. PWA Features
- **Web App Manifest**: Enables PWA installation
- **Theme Color**: Native app-like experience
- **Offline Support Ready**: Infrastructure for service worker

## Performance Targets

### Mobile
- **FCP**: < 1.8s
- **LCP**: < 2.5s
- **SI**: < 3.4s
- **TTI**: < 3.8s

### Desktop
- **FCP**: < 0.9s
- **LCP**: < 1.2s
- **SI**: < 1.3s
- **TTI**: < 2.5s

## How to Verify Performance

### 1. Chrome DevTools
```javascript
// Open Console and check logged metrics
// You'll see: LCP, FID, CLS, and other timing metrics
```

### 2. Lighthouse Audit
1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Performance" category
4. Run audit for both Mobile and Desktop

### 3. WebPageTest
Visit https://www.webpagetest.org/
- Enter your site URL
- Test from multiple locations
- Compare mobile vs desktop results

### 4. Chrome User Experience Report (CrUX)
Check real-user metrics at:
https://developers.google.com/speed/pagespeed/insights/

## Best Practices for Maintaining Performance

1. **Always Use OptimizedImage Component**
   ```tsx
   import { OptimizedImage } from '@/components/OptimizedImage';
   
   <OptimizedImage 
     src="/path/to/image.jpg"
     alt="Description"
     width={800}
     height={600}
     loading="lazy"
   />
   ```

2. **Lazy Load Heavy Components**
   ```tsx
   const HeavyComponent = lazy(() => import('./HeavyComponent'));
   
   <Suspense fallback={<LoadingSpinner />}>
     <HeavyComponent />
   </Suspense>
   ```

3. **Use Content Visibility**
   ```tsx
   <div className="lazy-load">
     {/* Content that's off-screen */}
   </div>
   ```

4. **Monitor Bundle Size**
   ```bash
   npm run build
   # Check dist/ folder size
   # Main bundle should be < 500KB
   ```

## Performance Budget

| Metric | Budget | Current |
|--------|--------|---------|
| Total JS | < 500KB | Check build |
| Total CSS | < 100KB | Check build |
| Images | < 2MB | Monitor |
| Fonts | < 200KB | System fonts |
| Third-party | < 200KB | Analytics only |

## Continuous Monitoring

The app includes real-time performance monitoring that logs Core Web Vitals to the console. In production, you should:

1. Set up Real User Monitoring (RUM)
2. Track performance metrics over time
3. Set up alerts for degradation
4. Monitor field data from real users

## Future Optimizations

- [ ] Implement Service Worker for offline support
- [ ] Add WebP/AVIF image format support
- [ ] Implement HTTP/2 Server Push
- [ ] Add predictive prefetching for routes
- [ ] Implement edge caching strategies

## Resources

- [Web.dev Performance](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse Scoring](https://web.dev/performance-scoring/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
