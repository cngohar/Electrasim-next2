import { motion } from 'framer-motion';

export default function FinalCTA() {
  return (
    <section id="cta" className="min-h-screen py-16 bg-white relative overflow-hidden flex flex-col items-center justify-center">
      {/* Blue radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_60%,rgba(37,99,235,0.07)_0%,transparent_70%)] pointer-events-none" />
      {/* Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage:
            'linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
        aria-hidden="true"
      />
      {/* Vertical trace — power flows down from the breaker icon into the CTA */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-20 bottom-20 w-px hidden md:block pointer-events-none"
        style={{ background: 'repeating-linear-gradient(to bottom, rgba(37,99,235,0.18) 0 6px, transparent 6px 14px)' }}
        aria-hidden="true"
      >
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400"
          style={{ boxShadow: '0 0 8px rgba(255,184,0,0.85)' }}
          animate={{ top: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        {/* Power button icon */}
        <motion.div
          className="mx-auto w-20 h-20 mb-10 rounded-full border-2 border-blue-200 bg-blue-50 flex items-center justify-center text-blue-600 relative cursor-pointer hover:border-blue-500 hover:bg-blue-100 transition-all duration-300 group"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-ping opacity-30 group-hover:opacity-50" />
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
            <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
          </svg>
        </motion.div>

        <motion.h2
          className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-[1.05] tracking-tight"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          The virtual lab for{' '}
          <span className="text-blue-600">students,<br />teachers</span>{' '}
          &amp; electricians.
        </motion.h2>

        <motion.p
          className="text-xl text-slate-500 mb-12 max-w-xl mx-auto leading-relaxed"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          viewport={{ once: true }}
        >
          Free forever. No download. No sign-up. Start simulating in seconds.
        </motion.p>

        <motion.a
          href="https://electrasim.com/app/"
          className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg transition-all duration-200"
          style={{ boxShadow: '0 4px 32px rgba(37,99,235,0.35)' }}
          whileHover={{ scale: 1.03, boxShadow: '0 8px 50px rgba(37,99,235,0.5)' }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          viewport={{ once: true }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          Launch ElectraSim — It's Free
        </motion.a>
      </div>
    </section>
  );
}
