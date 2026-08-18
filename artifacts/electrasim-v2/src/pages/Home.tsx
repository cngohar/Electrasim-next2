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
import { SEO }      from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-white text-slate-900 selection:bg-blue-500/20 selection:text-blue-700 font-sans">
      <SEO 
        title="ElectraSim — Interactive 3D Electrical Engineering & Circuit Simulation Suite"
        description="Next-generation electrical engineering calculation platform. Features interactive 3D simulations for battery backup & inverters, conduit fill packing, dual-standard NEC/IEC cable sizing, and protective device curves."
        keywords="electrical calculator, 3d circuit simulator, battery backup sizer, inverter calculator, conduit fill sizer, cable sizing calculator, NEC 2023, IEC 60364, BS 7671"
      />
      <Navbar />
      <SectionNav />
      <main>
        {/* ── Hero (only native scroll-snap anchor on the page) ── */}
        <LiveCircuit />

        {/* Global Breadcrumb Navigation Bar & Real-Time Performance Monitor */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Breadcrumbs
              items={[{ label: '3D Simulation & Calculation Platform', active: true }]}
              isDark={false}
              className="max-w-fit"
            />
            <PerformanceMonitor isDark={false} className="hidden sm:inline-block" />
          </div>
        </div>

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
