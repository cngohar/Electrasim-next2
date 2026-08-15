import favicon from '@assets/electrasim-favicon.svg';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="flex items-center gap-3">
            <img src={favicon} alt="ElectraSim" className="w-6 h-6 opacity-60 hover:opacity-100 transition-all" />
            <span className="font-serif text-xl font-bold text-slate-900">ElectraSim</span>
          </div>
          <p className="text-sm text-slate-400 font-sans">Free online electrical wiring simulator.</p>
        </div>
        
        <div className="flex items-center gap-8 text-sm font-mono text-slate-500">
          <a href="#blog" className="hover:text-amber-500 transition-colors">Blog</a>
          <a href="#about" className="hover:text-amber-500 transition-colors">About</a>
          <a href="#" className="hover:text-amber-500 transition-colors">Contact</a>
        </div>
        
        <div className="text-sm text-slate-400 font-mono">
          © 2025 ElectraSim
        </div>
      </div>
    </footer>
  );
}
