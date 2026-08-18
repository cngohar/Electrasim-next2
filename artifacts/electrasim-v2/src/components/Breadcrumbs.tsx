import React, { useEffect } from 'react';
import { ChevronRight, Home as HomeIcon } from 'lucide-react';
import { Link } from 'wouter';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  active?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  isDark?: boolean;
  className?: string;
  showHomeIcon?: boolean;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  isDark = false,
  className = '',
  showHomeIcon = true,
}) => {
  // Inject BreadcrumbList JSON-LD structured data for SEO indexing
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://electrasim.app';
    const schemaItems = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${origin}/`,
      },
      ...items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: item.label,
        ...(item.href ? { item: `${origin}${item.href}` } : {}),
      })),
    ];

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: schemaItems,
    };

    let scriptElement = document.getElementById('jsonld-breadcrumbs') as HTMLScriptElement | null;
    if (!scriptElement) {
      scriptElement = document.createElement('script');
      scriptElement.id = 'jsonld-breadcrumbs';
      scriptElement.type = 'application/ld+json';
      document.head.appendChild(scriptElement);
    }
    scriptElement.textContent = JSON.stringify(breadcrumbSchema);

    return () => {
      const el = document.getElementById('jsonld-breadcrumbs');
      if (el) el.remove();
    };
  }, [items]);

  return (
    <nav
      id="site-breadcrumbs-navigation"
      aria-label="Breadcrumb"
      className={`w-full py-2.5 px-4 rounded-xl border text-xs font-medium backdrop-blur-md transition-colors ${
        isDark
          ? 'bg-slate-900/70 border-slate-800/80 text-slate-300'
          : 'bg-slate-50/80 border-slate-200/80 text-slate-600'
      } ${className}`}
    >
      <ol className="flex items-center flex-wrap gap-1.5 list-none p-0 m-0">
        {/* Home Base Link */}
        <li className="flex items-center">
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
              isDark
                ? 'hover:bg-slate-800 hover:text-white text-slate-400'
                : 'hover:bg-slate-200/70 hover:text-slate-900 text-slate-500'
            }`}
            title="Return to ElectraSim Homepage"
          >
            {showHomeIcon && <HomeIcon size={13} className="shrink-0 text-blue-500" />}
            <span className="font-semibold">Home</span>
          </Link>
        </li>

        {/* Trail Items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1 || item.active;
          const Icon = item.icon;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              <ChevronRight
                size={12}
                className={`shrink-0 opacity-40 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
                aria-hidden="true"
              />

              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    isDark
                      ? 'hover:bg-slate-800 hover:text-white text-slate-300'
                      : 'hover:bg-slate-200/70 hover:text-slate-900 text-slate-600'
                  }`}
                >
                  {Icon && <Icon size={13} className="shrink-0 opacity-70" />}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg font-bold font-mono text-[11px] uppercase tracking-wide ${
                    isDark
                      ? 'bg-blue-950/60 text-blue-400 border border-blue-800/40'
                      : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                  }`}
                >
                  {Icon && <Icon size={12} className="shrink-0" />}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
