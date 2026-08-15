import Navbar      from '@/components/Navbar';
import LiveCircuit  from '@/components/LiveCircuit';
import StatsStrip   from '@/components/StatsStrip';
import Features     from '@/components/Features';
import HowItWorks   from '@/components/HowItWorks';
import Audience     from '@/components/Audience';
import BlogPreview  from '@/components/BlogPreview';
import FinalCTA     from '@/components/FinalCTA';
import Footer       from '@/components/Footer';
import SectionNav   from '@/components/SectionNav';

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-white text-slate-900 selection:bg-blue-500/20 selection:text-blue-700 font-sans">
      <Navbar />
      <SectionNav />
      <main>
        {/* ── Hero (only native scroll-snap anchor on the page) ── */}
        <LiveCircuit />

        <StatsStrip />
        <Features />
        <HowItWorks />
        <Audience />
        <BlogPreview />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
