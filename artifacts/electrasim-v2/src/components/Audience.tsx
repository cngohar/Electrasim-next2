import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, Wrench, Lightbulb } from 'lucide-react';

const audiences = [
  {
    icon: GraduationCap,
    title: "Students",
    desc: "Practice house wiring online without risk of shocks or blown fuses."
  },
  {
    icon: BookOpen,
    title: "Teachers",
    desc: "Live classroom demos. Share circuits via URL for homework."
  },
  {
    icon: Wrench,
    title: "Electricians",
    desc: "Prototype layouts, demonstrate faults, validate logic before going on-site."
  },
  {
    icon: Lightbulb,
    title: "Hobbyists",
    desc: "Experiment with ideas. Learn by doing at your own pace."
  }
];

export default function Audience() {
  return (
    <section id="audience" className="min-h-screen py-16 bg-[#F8FAFC] flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative">
          {/* Connecting rail above the cards — current jumps right-to-left across every audience */}
          <div className="absolute -top-4 left-10 right-10 h-px bg-slate-200 hidden lg:block pointer-events-none" aria-hidden="true">
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500"
              style={{ boxShadow: '0 0 8px rgba(37,99,235,0.85)' }}
              animate={{ left: ['100%', '0%'], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: 'linear' }}
            />
          </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {audiences.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-amber-500 hover:shadow-[0_0_30px_rgba(255,184,0,0.15)] transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-6 text-slate-500 group-hover:text-amber-500 group-hover:bg-amber-500/10 transition-all duration-300">
                  <Icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-slate-900 mb-3 group-hover:text-amber-500 transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-600 font-sans leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </section>
  );
}
