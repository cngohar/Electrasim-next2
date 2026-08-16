import { useEffect } from 'react';

interface PageSeoOptions {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  schema?: Record<string, unknown>;
}

const SITE_ORIGIN = 'https://electrasim.com';
const DEFAULT_TITLE = 'ElectraSim — Electrical Simulation & Engineering Tools';
const DEFAULT_DESCRIPTION = "Explore electrical circuits and practical engineering calculations with ElectraSim's free, browser-based simulation and assistant tools.";

function upsertMeta(selector: string, attribute: string, value: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    const [name, key] = attribute.split(':');
    element.setAttribute(name, key);
    document.head.appendChild(element);
  }
  element.content = value;
}

function upsertCanonical(url: string) {
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = url;
}

export function usePageSeo({ title, description, path, keywords = [], schema }: PageSeoOptions) {
  useEffect(() => {
    const canonicalUrl = `${SITE_ORIGIN}${path}`;
    document.title = title;
    upsertMeta('meta[name="description"]', 'name:description', description);
    upsertMeta('meta[name="keywords"]', 'name:keywords', keywords.join(', '));
    upsertMeta('meta[property="og:title"]', 'property:og:title', title);
    upsertMeta('meta[property="og:description"]', 'property:og:description', description);
    upsertMeta('meta[property="og:url"]', 'property:og:url', canonicalUrl);
    upsertMeta('meta[name="twitter:title"]', 'name:twitter:title', title);
    upsertMeta('meta[name="twitter:description"]', 'name:twitter:description', description);
    upsertCanonical(canonicalUrl);

    const scriptId = 'electrasim-page-schema';
    document.getElementById(scriptId)?.remove();
    const schemaNode = document.createElement('script');
    schemaNode.id = scriptId;
    schemaNode.type = 'application/ld+json';
    schemaNode.textContent = JSON.stringify(schema ?? {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: title.split('|')[0].trim(),
      description,
      url: canonicalUrl,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    });
    document.head.appendChild(schemaNode);

    return () => {
      schemaNode.remove();
      document.title = DEFAULT_TITLE;
      upsertMeta('meta[name="description"]', 'name:description', DEFAULT_DESCRIPTION);
      upsertMeta('meta[property="og:title"]', 'property:og:title', DEFAULT_TITLE);
      upsertMeta('meta[property="og:description"]', 'property:og:description', DEFAULT_DESCRIPTION);
      upsertMeta('meta[name="twitter:title"]', 'name:twitter:title', DEFAULT_TITLE);
      upsertMeta('meta[name="twitter:description"]', 'name:twitter:description', DEFAULT_DESCRIPTION);
      upsertCanonical(`${SITE_ORIGIN}/`);
    };
  }, [description, keywords, path, schema, title]);
}
