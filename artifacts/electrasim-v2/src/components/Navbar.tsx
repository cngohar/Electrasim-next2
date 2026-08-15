import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X } from 'lucide-react';
import favicon from '@assets/electrasim-favicon.svg';

interface NavbarProps {
  theme?: 'light' | 'dark';
}

export default function Navbar({ theme = 'light' }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();

  const isHome = location === '/';
  const isDark = theme === 'dark';

  const LINKS = [
    { href: isHome ? '#features' : '/#features', label: 'Features', isPage: false },
    { href: isHome ? '#guide' : '/#guide', label: 'Guide', isPage: false },
    { href: '/assistant', label: 'Assistant', isPage: true },
    { href: '/blog', label: 'Blog', isPage: true },
    { href: isHome ? '#compare' : '/#compare', label: 'Compare', isPage: false },
    { href: isHome ? '#about' : '/#about', label: 'About', isPage: false },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 72);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu on route/hash navigation or resize past mobile
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const navSolid = scrolled || menuOpen;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        navSolid
          ? isDark
            ? 'bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md'
            : 'bg-white/93 backdrop-blur-md border-b border-slate-200/80 shadow-sm'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group" onClick={() => setMenuOpen(false)}>
          <img src={favicon} alt="ElectraSim" className="w-7 h-7 sm:w-8 sm:h-8 group-hover:scale-105 transition-transform" />
          <span
            className={`text-lg sm:text-xl font-bold tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Electra<span className="text-blue-600">Sim</span>
          </span>
        </Link>

        <div className={`hidden md:flex items-center gap-7 text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          {LINKS.map(l => l.isPage ? (
            <Link key={l.href} href={l.href} className="hover:text-blue-500 transition-colors">{l.label}</Link>
          ) : (
            <a key={l.href} href={l.href} className="hover:text-blue-500 transition-colors">{l.label}</a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://electrasim.com/app/"
            className={`hidden sm:flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-sm transition-all duration-200 ${
              scrolled || isDark
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_2px_12px_rgba(37,99,235,0.3)]'
                : 'bg-white/90 hover:bg-white text-blue-700 border border-blue-200 shadow-sm'
            }`}
          >
            Open App <span className="text-base leading-none">→</span>
          </a>

          {/* Mobile menu toggle */}
          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(v => !v)}
            className={`md:hidden flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
              isDark 
                ? 'text-slate-200 bg-slate-800 border border-slate-700 hover:bg-slate-700' 
                : navSolid ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-800 bg-white/80 border border-slate-200'
            }`}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      {menuOpen && (
        <div className={`md:hidden border-t shadow-lg ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="px-4 py-4 flex flex-col gap-1">
            {LINKS.map(l => l.isPage ? (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  isDark 
                    ? 'text-slate-200 hover:bg-slate-800 hover:text-blue-400' 
                    : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                {l.label}
              </Link>
            ) : (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  isDark 
                    ? 'text-slate-200 hover:bg-slate-800 hover:text-blue-400' 
                    : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                {l.label}
              </a>
            ))}
            <a
              href="https://electrasim.com/app/"
              className="mt-2 flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all duration-200"
            >
              Open App <span className="text-base leading-none">→</span>
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
