import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Disable browser's default scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Force scroll to top immediately and repeatedly for a short duration
    // to fight against any late-loading content or other library interference
    const resetScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTo(0, 0);
      document.body.scrollTo(0, 0);
      
      // If any specific elements are scrolling, reset them too
      const main = document.querySelector('main');
      if (main) main.scrollTop = 0;
    };

    resetScroll();
    
    // Run multiple times over the first 500ms
    const intervals = [10, 50, 100, 200, 300, 400, 500];
    const timers = intervals.map(ms => setTimeout(resetScroll, ms));

    return () => timers.forEach(clearTimeout);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
