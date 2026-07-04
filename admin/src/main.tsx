import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ── APP RESTRICTIONS: Disable Right Click & Zoom ────────────────────────
if (typeof window !== 'undefined') {
    // Disable Right Click
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // Disable Data Extraction (Copy/Select)
    document.addEventListener('copy', (e) => e.preventDefault());
    document.addEventListener('selectstart', (e) => e.preventDefault());

    // Disable Zoom & DevTools (Ctrl + Wheel, Ctrl + Keyboard)
    document.addEventListener('wheel', (e) => {
        if (e.ctrlKey) e.preventDefault();
    }, { passive: false });

    document.addEventListener('keydown', (e) => {
        // Zoom Prevention (Ctrl + Plus, Minus, 0)
        if (e.ctrlKey && (['=', '-', '0', '+'].includes(e.key))) {
            e.preventDefault();
        }
        
        // DevTools / Source Prevention
        // F12
        if (e.key === 'F12') {
            e.preventDefault();
            return false;
        }

        // Ctrl + Shift + I/J/C (DevTools)
        if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) {
            e.preventDefault();
            return false;
        }

        // Ctrl + U (View Source)
        if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
            e.preventDefault();
            return false;
        }
    });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
