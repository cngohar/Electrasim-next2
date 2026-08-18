import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Clock, ArrowLeft, ArrowRight, Sparkles, Tag, User, BookOpen, Share2, Check } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BLOG_POSTS, BlogPost } from '@/data/blogData';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export default function Blog() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activePost, setActivePost] = useState<BlogPost | null>(null);
  const [copied, setCopied] = useState(false);

  const categories = ['All', 'App Update', 'Beginner Guide', 'Electrical Safety', 'Tutorial'];

  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter((post) => {
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
      const matchesSearch =
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(search.toLowerCase()) ||
        post.category.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCategory]);

  const featuredPost = BLOG_POSTS[0];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-amber-500/20 selection:text-slate-900">
      <SEO 
        title={activePost ? `${activePost.title} | ElectraSim Engineering Blog` : 'Electrical Engineering Guides, NEC 2023 & Tutorials | ElectraSim Blog'}
        description={activePost ? activePost.excerpt : 'Practical tutorials and guides for electricians and engineers on NEC 2023 cable sizing, conduit fill rules, voltage drop formulas, and circuit protection.'}
        keywords="electrical engineering blog, NEC 2023 tutorial, cable sizing guide, conduit fill calculation, electrical safety, BS 7671 standards"
        ogType={activePost ? 'article' : 'website'}
      />
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6 mb-6">
          <Breadcrumbs
            items={
              activePost
                ? [
                    { label: 'Engineering Blog', href: '/blog' },
                    { label: activePost.title, active: true },
                  ]
                : [{ label: 'Engineering Blog & Guides', active: true }]
            }
            isDark={false}
          />
        </div>

        {activePost ? (
          /* Active Article Full View */
          <article className="max-w-4xl mx-auto px-6 animate-in fade-in duration-300">
            <button
              onClick={() => setActivePost(null)}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 mb-8 transition-colors group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to all articles
            </button>

            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
                {activePost.category}
              </span>
              <span className="text-slate-400 text-sm flex items-center gap-1">
                <Calendar size={14} />
                {activePost.date}
              </span>
              <span className="text-slate-400 text-sm flex items-center gap-1">
                <Clock size={14} />
                {activePost.readTime}
              </span>
            </div>

            <h1 className="font-serif text-3xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              {activePost.title}
            </h1>

            <div className="flex items-center justify-between py-6 border-y border-slate-200 mb-10">
              <div className="flex items-center gap-3">
                <img
                  src={activePost.author.avatar}
                  alt={activePost.author.name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <div className="font-bold text-slate-900 text-sm">{activePost.author.name}</div>
                  <div className="text-xs text-slate-500">{activePost.author.role}</div>
                </div>
              </div>

              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
                {copied ? 'Link Copied' : 'Share'}
              </button>
            </div>

            {/* Content Body */}
            <div className="prose prose-slate max-w-none prose-headings:font-serif prose-headings:font-bold prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-lg">
              {activePost.content.map((paragraph, idx) => {
                if (paragraph.startsWith('### ')) {
                  return (
                    <h3 key={idx} className="text-2xl font-bold text-slate-900 font-serif mt-10 mb-4">
                      {paragraph.replace('### ', '')}
                    </h3>
                  );
                }
                return (
                  <p key={idx} className="text-slate-700 text-lg leading-relaxed mb-6">
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {/* Bottom Callout */}
            <div className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h4 className="font-serif text-xl font-bold text-slate-900 mb-2">Want to try this in practice?</h4>
                <p className="text-slate-600 text-sm">Build and test this circuit safely in the ElectraSim live interactive simulator.</p>
              </div>
              <a
                href="https://electrasim.com/app/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors shrink-0 shadow-sm"
              >
                Launch Workbench
                <ArrowRight size={16} />
              </a>
            </div>
          </article>
        ) : (
          /* Main Blog Index View */
          <div className="max-w-7xl mx-auto px-6">
            {/* Header Banner */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-mono font-semibold uppercase tracking-wider mb-4">
                <Sparkles size={14} />
                Knowledge Base & Guides
              </div>
              <h1 className="font-serif text-4xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
                ElectraSim Engineering Blog
              </h1>
              <p className="text-slate-600 text-lg font-sans leading-relaxed">
                Tutorials, product updates, and practical electrical safety guides for students, teachers, and electricians.
              </p>
            </div>

            {/* Featured Post Card */}
            {featuredPost && (
              <div
                onClick={() => setActivePost(featuredPost)}
                className="mb-16 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 md:p-12 rounded-3xl cursor-pointer hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
              >
                {/* Background glow */}
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-3xl">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="font-mono text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
                      Featured
                    </span>
                    <span className="text-slate-400 text-xs font-mono">{featuredPost.date}</span>
                    <span className="text-slate-400 text-xs font-mono">• {featuredPost.readTime}</span>
                  </div>

                  <h2 className="font-serif text-2xl md:text-4xl font-bold mb-4 group-hover:text-amber-400 transition-colors leading-tight">
                    {featuredPost.title}
                  </h2>

                  <p className="text-slate-300 text-base md:text-lg mb-8 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={featuredPost.author.avatar}
                        alt={featuredPost.author.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <div className="font-bold text-white text-sm">{featuredPost.author.name}</div>
                        <div className="text-xs text-slate-400">{featuredPost.author.role}</div>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-2 text-amber-400 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                      Read Article <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search and Category Filters */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 pb-8 border-b border-slate-200">
              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-72">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Post Grid */}
            {filteredPosts.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200">
                <BookOpen size={36} className="mx-auto text-slate-400 mb-3" />
                <h3 className="text-lg font-bold text-slate-800 mb-1">No articles found</h3>
                <p className="text-slate-500 text-sm">Try adjusting your search query or category filter.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setActivePost(post)}
                    className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-blue-500/50 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full font-semibold uppercase">
                          {post.category}
                        </span>
                        <span className="text-slate-400 text-xs font-mono">{post.readTime}</span>
                      </div>

                      <h3 className="font-serif text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {post.title}
                      </h3>

                      <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <span className="text-xs font-medium text-slate-700">{post.author.name}</span>
                      </div>

                      <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        Read <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
