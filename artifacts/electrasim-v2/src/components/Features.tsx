import { motion } from 'framer-motion';

const features = [
  {
    title: "Drag & Drop Components",
    desc: "Place MCBs, switches, bulbs, fans, motors and sockets from the palette.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
    )
  },
  {
    title: "Real-Time Simulation",
    desc: "Hit Run and watch electricity flow instantly. Wires animate, bulbs light up, fans spin.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
    )
  },
  {
    title: "Fault Detection",
    desc: "Trace open/short circuits. Inject reverse-polarity and missing-earth faults.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
    )
  },
  {
    title: "Smart Wire Routing",
    desc: "Auto-routes orthogonal wires around components.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
    )
  },
  {
    title: "Multi-Select & Align",
    desc: "Shift-click or drag-select. Align with one click.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
    )
  },
  {
    title: "Import, Export & Share",
    desc: "Save as JSON, export as SVG/PNG, or share via URL. Autosaved locally.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
    )
  }
];

export default function Features() {
  return (
    <section id="features" className="min-h-screen py-16 bg-[#F8FAFC] relative overflow-hidden flex flex-col justify-center">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-20">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            A real workbench,<br/><span className="text-blue-600">without the mess.</span>
          </h2>
          <p className="text-slate-500 font-mono max-w-2xl text-lg">
            Everything you need to build, test, and break circuits safely. 
            Designed for precision, built for speed.
          </p>
        </div>

        <div className="relative">
          {/* SVG pulse layer behind cards */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 1000 800" preserveAspectRatio="none">
            {/* Horizontal traces */}
            <line x1="0" y1="270" x2="1000" y2="270" stroke="rgba(37,99,235,0.15)" strokeWidth="1.5" />
            <line x1="0" y1="530" x2="1000" y2="530" stroke="rgba(37,99,235,0.15)" strokeWidth="1.5" />
            
            {/* Vertical traces */}
            <line x1="330" y1="0" x2="330" y2="800" stroke="rgba(37,99,235,0.15)" strokeWidth="1.5" />
            <line x1="670" y1="0" x2="670" y2="800" stroke="rgba(37,99,235,0.15)" strokeWidth="1.5" />
            
            {/* Circuit nodes at intersections */}
            <circle cx="330" cy="270" r="4" fill="rgba(37,99,235,0.3)" />
            <circle cx="670" cy="270" r="4" fill="rgba(37,99,235,0.3)" />
            <circle cx="330" cy="530" r="4" fill="rgba(37,99,235,0.3)" />
            <circle cx="670" cy="530" r="4" fill="rgba(37,99,235,0.3)" />
            
            {/* Animated traveling particles — use motion.g to avoid SVG cx/cy attribute errors */}
            {/* Particle 1: horizontal */}
            <motion.g
              initial={{ x: 0, y: 270 }}
              animate={{ x: [0, 1000], y: [270, 270] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            >
              <circle r="3" fill="#FFB800" style={{ filter: 'drop-shadow(0 0 5px #FFB800)' }} />
            </motion.g>

            {/* Particle 2: vertical */}
            <motion.g
              initial={{ x: 670, y: 0 }}
              animate={{ x: [670, 670], y: [0, 800] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
            >
              <circle r="3" fill="#FFB800" style={{ filter: 'drop-shadow(0 0 5px #FFB800)' }} />
            </motion.g>

            {/* Particle 3: orthogonal path */}
            <motion.g
              initial={{ x: 0, y: 530 }}
              animate={{ x: [0, 330, 330, 670, 670, 1000], y: [530, 530, 270, 270, 530, 530] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
            >
              <circle r="3" fill="#FFB800" style={{ filter: 'drop-shadow(0 0 5px #FFB800)' }} />
            </motion.g>
          </svg>
          
          {/* Features grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group relative bg-white border border-slate-200 p-8 rounded-2xl hover:shadow-[0_0_0_1px_rgba(255,184,0,0.4),0_0_20px_rgba(255,184,0,0.08)] transition-shadow duration-300"
              >
                {/* Circuit node connection dot */}
                <div className="absolute top-8 right-8 w-2 h-2 rounded-full bg-slate-300 group-hover:bg-amber-500 group-hover:shadow-[0_0_10px_rgba(255,184,0,0.8)] transition-all duration-300" />
                
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-wide">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed font-sans">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
