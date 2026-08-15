import { motion } from 'framer-motion';

const steps = [
  {
    num: '01',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
    ),
    title: 'Open the app',
    desc: 'Loads instantly in any modern browser. Works fully offline after first visit — no install, no account.',
    tag: 'electrasim.com/app',
  },
  {
    num: '02',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 17.5h7M17.5 14v7"/>
      </svg>
    ),
    title: 'Place components',
    desc: 'MCB, switches, bulbs, fans, sockets — click from the panel to drop components on your canvas grid.',
    tag: 'From the component panel',
  },
  {
    num: '03',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 12H7M7 12l4-4M7 12l4 4"/><circle cx="19" cy="12" r="2"/><circle cx="5" cy="12" r="2"/>
      </svg>
    ),
    title: 'Wire them up',
    desc: 'Click any port, drag to another — ElectraSim auto-routes the wire and snaps it to the grid.',
    tag: 'Auto-routed connections',
  },
  {
    num: '04',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    title: 'Run & learn',
    desc: 'Hit Run. Toggle switches, inject faults, trace current paths — see exactly what happens in real time.',
    tag: 'Live simulation',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13 } },
};
const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function HowItWorks() {
  return (
    <section id="guide" className="min-h-screen py-16 bg-white relative overflow-hidden flex flex-col justify-center">
      {/* Decorative trace line across the section — current travels step 01 → 04, left to right */}
      <div className="absolute left-0 right-0 top-1/2 hidden lg:block pointer-events-none" aria-hidden="true">
        <svg width="100%" height="4" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <line x1="0" y1="2" x2="100%" y2="2" stroke="rgba(37,99,235,0.08)" strokeWidth="1" strokeDasharray="8 6"/>
        </svg>
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-400"
          style={{ boxShadow: '0 0 8px rgba(255,184,0,0.85)' }}
          animate={{ left: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <span className="font-mono text-sm text-blue-600 tracking-widest uppercase mb-4 block">
            How it works
          </span>
          <h2
            className="text-4xl md:text-5xl font-bold text-slate-900 mb-4"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            From blank canvas to<br className="hidden sm:block" /> live circuit in minutes.
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            No tutorials needed. ElectraSim is designed to feel instantly familiar.
          </p>
        </motion.div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div
              key={i}
              className="relative group"
            >
              {/* Connector line between cards (desktop) */}
              {i < steps.length - 1 && (
                <div
                  className="hidden lg:block absolute top-10 left-[calc(100%+12px)] w-[calc(100%-24px)] h-px bg-blue-100 z-0"
                  aria-hidden="true"
                />
              )}

              <div className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:border-blue-200 hover:shadow-[0_0_0_1px_rgba(37,99,235,0.15),0_8px_32px_rgba(37,99,235,0.08)] transition-all duration-300 h-full flex flex-col">
                {/* Step number + icon row */}
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300">
                    {step.icon}
                  </div>
                  <span
                    className="font-mono text-3xl font-bold text-slate-100 group-hover:text-blue-100 transition-colors duration-300 select-none"
                    aria-hidden="true"
                  >
                    {step.num}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {step.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed flex-1">{step.desc}</p>

                {/* Tag */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <span className="font-mono text-xs text-blue-500 bg-blue-50 px-2.5 py-1 rounded-md">
                    {step.tag}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          viewport={{ once: true }}
        >
          <a
            href="https://electrasim.com/app/"
            className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-500 transition-colors"
          >
            Start building your first circuit
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
