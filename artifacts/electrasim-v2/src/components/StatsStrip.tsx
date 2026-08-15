import { motion } from 'framer-motion';

const stats = [
  { value: "100%", label: "Free Forever" },
  { value: "0", label: "Sign-ups Required" },
  { value: "16+", label: "Component Types" },
  { value: "60fps", label: "Live Simulation" }
];

export default function StatsStrip() {
  return (
    <section id="stats" className="min-h-screen py-16 relative z-10 bg-white flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="relative overflow-visible group"
            >
              {/* Left pins — 4 legs, current sparking outward on the 2nd pin */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-evenly -translate-x-5 pointer-events-none">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="relative w-5 h-1.5 bg-gradient-to-l from-slate-300 to-slate-400 rounded-l-sm overflow-visible">
                    {j === 1 && (
                      <motion.span
                        className="absolute top-1/2 -translate-y-1/2 right-0 w-1 h-1 rounded-full bg-blue-500"
                        style={{ boxShadow: '0 0 6px rgba(37,99,235,0.9)' }}
                        animate={{ x: [0, -20], opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 1.3, repeat: Infinity, repeatDelay: 1.7, delay: i * 0.35, ease: 'easeIn' }}
                      />
                    )}
                  </div>
                ))}
              </div>
              
              {/* Right pins — 4 legs, mirrored spark */}
              <div className="absolute right-0 top-0 h-full flex flex-col justify-evenly translate-x-5 pointer-events-none">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="relative w-5 h-1.5 bg-gradient-to-r from-slate-300 to-slate-400 rounded-r-sm overflow-visible">
                    {j === 2 && (
                      <motion.span
                        className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-1 rounded-full bg-blue-500"
                        style={{ boxShadow: '0 0 6px rgba(37,99,235,0.9)' }}
                        animate={{ x: [0, 20], opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 1.3, repeat: Infinity, repeatDelay: 1.7, delay: i * 0.35 + 0.65, ease: 'easeIn' }}
                      />
                    )}
                  </div>
                ))}
              </div>
              
              {/* Card body */}
              <div className="relative bg-white border border-slate-200 rounded-xl p-8 h-full flex flex-col items-center justify-center text-center chip-border-pattern group-hover:border-blue-500/50 transition-colors duration-500">
                <span className="font-mono text-4xl md:text-5xl font-bold text-slate-900 mb-2 tracking-tight">
                  {stat.value}
                </span>
                <span className="text-sm font-mono text-slate-500 uppercase tracking-widest">
                  {stat.label}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
