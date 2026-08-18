import React, { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  schema?: Record<string, any> | Record<string, any>[];
}

export const SEO: React.FC<SEOProps> = ({
  title = 'ElectraSim — Interactive Electrical Engineering & Circuit Simulation Suite',
  description = 'Professional online electrical calculation suite for electricians, electrical engineers, and solar designers. Includes 3D Battery Backup Sizer, NEC & IEC Cable Sizing, Conduit Fill Packing Sizer, Three-Phase Power, and Voltage Drop calculators.',
  keywords = 'electrical calculator, battery backup sizer, inverter calculator, conduit fill calculator, cable sizing calculator, NEC 2023, IEC 60364, BS 7671, voltage drop calculator, three phase power calculator, electrical engineering simulator',
  canonicalUrl,
  ogType = 'website',
  ogImage = '/og-image.png',
  schema
}) => {
  useEffect(() => {
    // 1. Update Document Title
    const fullTitle = title.includes('ElectraSim') ? title : `${title} | ElectraSim`;
    document.title = fullTitle;

    // 2. Helper to set or update meta tag
    const setMeta = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (isProperty) {
          el.setAttribute('property', name);
        } else {
          el.setAttribute('name', name);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Standard Meta
    setMeta('description', description);
    setMeta('keywords', keywords);
    setMeta('author', 'ElectraSim Engineering');
    setMeta('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');

    // OpenGraph
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', description, true);
    setMeta('og:type', ogType, true);
    setMeta('og:site_name', 'ElectraSim', true);
    if (ogImage) setMeta('og:image', ogImage, true);
    if (canonicalUrl || typeof window !== 'undefined') {
      const url = canonicalUrl || window.location.href;
      setMeta('og:url', url, true);

      // Canonical link tag
      let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonicalEl) {
        canonicalEl = document.createElement('link');
        canonicalEl.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalEl);
      }
      canonicalEl.setAttribute('href', url);
    }

    // Twitter Cards
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    if (ogImage) setMeta('twitter:image', ogImage);

    // 3. Inject Structured Data (JSON-LD)
    const scriptId = 'electrasim-structured-data';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }

    // Default WebApplication & FAQ schema
    const defaultSchema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          '@id': 'https://electrasim.com/#app',
          'name': 'ElectraSim Electrical Engineering & Calculation Suite',
          'applicationCategory': 'EngineeringSoftware',
          'operatingSystem': 'Any (Web Browser)',
          'description': description,
          'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'USD'
          },
          'featureList': [
            '3D Battery Backup & Inverter Sizer with live discharge simulation',
            '2D/3D Conduit & Trunking Fill Sizer adhering to NEC Chapter 9 & BS 7671',
            'Dual-Standard Cable Sizing Calculator (NEC 2023 & IEC 60364)',
            'Three-Phase Active, Reactive & Apparent Power Analyzer',
            'MCB & RCBO Protective Circuit Breaker Curve Selector',
            'Voltage Drop and Maximum Circuit Distance Calculator',
            'A/B Engineering Scenario Comparison Simulator',
            'Engineering Submittal Dossier Generator'
          ]
        },
        {
          '@type': 'Organization',
          '@id': 'https://electrasim.com/#org',
          'name': 'ElectraSim',
          'url': 'https://electrasim.com',
          'logo': 'https://electrasim.com/favicon.svg'
        }
      ]
    };

    const finalSchema = schema ? (Array.isArray(schema) ? { '@context': 'https://schema.org', '@graph': schema } : schema) : defaultSchema;
    scriptEl.textContent = JSON.stringify(finalSchema, null, 2);

    return () => {
      // Optional cleanup if needed
    };
  }, [title, description, keywords, canonicalUrl, ogType, ogImage, schema]);

  return null;
};
