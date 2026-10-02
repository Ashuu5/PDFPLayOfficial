import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function CanonicalTag() {
  const { pathname } = useLocation();

  useEffect(() => {
    const baseUrl = 'https://pdfplayofficial.com';
    const canonicalUrl = `${baseUrl}${pathname === '/' ? '' : pathname}`;

    let link = document.querySelector(
      "link[rel='canonical']"
    ) as HTMLLinkElement | null;

    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }

    link.href = canonicalUrl;
  }, [pathname]);

  return null;
}