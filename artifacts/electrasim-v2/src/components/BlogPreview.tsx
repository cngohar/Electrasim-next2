import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

const articles = [
  { title: "ElectraSim v1.6: Dark Mode, RCBOs, and Smarter Switching", tag: "App Update" },
  { title: "How Does a Push Button Switch Work?", tag: "Beginner Guide" },
  { title: "Why Do My Lights Flicker?", tag: "Electrical Safety" }
];

export default function BlogPreview() {
  return (
    <section id="blog" className="min-h-screen py-16 bg-white relative flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 max-w-lg leading-tight">
            Learn electrical wiring the easy way.
          </h2>
          <Link href="/blog" className="flex items-center gap-2 text-amber-500 hover:text-amber-600 font-mono tracking-wide group">
            Read all guides <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Connecting wire behind articles — a paired data burst travels left to right */}
          <div className="absolute top-1/2 left-10 right-10 h-px bg-slate-200 hidden md:block -z-10">
            {[0, 0.7].map((delay) => (
              <motion.div
                key={delay}
                className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500"
                style={{ boxShadow: '0 0 8px rgba(37,99,235,0.85)' }}
                animate={{ left: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'linear', delay }}
              />
            ))}
          </div>
          
          {articles.map((article, i) => (
            <Link key={i} href="/blog">
              <div
                className="bg-[#F8FAFC] p-8 rounded-2xl border border-slate-200 hover:border-blue-500/50 hover:bg-white transition-all cursor-pointer group h-full"
              >
                <div className="text-xs font-mono text-blue-600 uppercase tracking-wider mb-4 inline-block px-3 py-1 bg-blue-50 rounded-full">
                  {article.tag}
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-serif group-hover:text-blue-600 transition-colors line-clamp-3">
                  {article.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
