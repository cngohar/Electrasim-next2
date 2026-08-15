import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const SECTIONS = [
  { id: 'stats',    label: 'Stats' },
  { id: 'features', label: 'Features' },
  { id: 'guide',    label: 'How it works' },
  { id: 'audience', label: "Who it's for" },
  { id: 'blog',     label: 'Blog' },
  { id: 'cta',      label: 'Get started' },
];

// Fixed right-side dot rail — click any node to snap straight to that section.
export default function SectionNav() {
  const [active, setActive] = useState('stats');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show section nav only after scrolling past the hero section (~400px)
      setVisible(window.scrollY > 350);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    const els = SECTIONS
      .map(s => document.getElementById(s.id))
      .filter((el): el is HTMLElement => !!el);
    if (!els.length) return () => window.removeEventListener('scroll', handleScroll);

    const observer = new IntersectionObserver(
      (entries) => {
        let bestId: string | null = null;
        let bestRatio = 0;
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestId = entry.target.id;
          }
        }
        if (bestId) setActive(bestId);
      },
      { threshold: [0.2, 0.4, 0.6, 0.8], rootMargin: '-15% 0px -15% 0px' }
    );

    els.forEach(el => observer.observe(el));
    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!visible) return null;

  return (
    <nav
      aria-label="Section navigation"
      className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col items-center py-2"
    >
      {/* Vertical trace connecting every node */}
      <div className="absolute top-2 bottom-2 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-blue-200 to-transparent" aria-hidden="true" />
      {/* Traveling current, always running, ties the rail into the circuit theme */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400"
        style={{ boxShadow: '0 0 6px rgba(255,184,0,0.9)' }}
        animate={{ top: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
      />

      {SECTIONS.map((s) => {
        const isActive = active === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => goTo(s.id)}
            aria-label={`Go to ${s.label}`}
            aria-current={isActive}
            className="relative group flex items-center justify-center w-7 h-9 focus:outline-none"
          >
            {/* Hover label */}
            <span className="absolute right-full mr-3 whitespace-nowrap px-2 py-1 rounded-md bg-white border border-slate-200 text-xs font-mono text-slate-600 shadow-sm opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
              {s.label}
            </span>

            {/* Node */}
            <span
              className={`relative rounded-full border transition-all duration-300 ${
                isActive
                  ? 'w-2.5 h-2.5 bg-blue-600 border-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.7)]'
                  : 'w-1.5 h-1.5 bg-white border-slate-300 group-hover:border-blue-400 group-hover:bg-blue-50'
              }`}
            >
              {isActive && (
                <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-60" aria-hidden="true" />
              )}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
