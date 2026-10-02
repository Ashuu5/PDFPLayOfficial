import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function CanonicalTag() {
  const { pathname } = useLocation();

  useEffect(() => {
    const baseUrl = 'https://pdfplayofficial.com';

    // ✅ pathname ko saaf karo
    let cleanPath = pathname
      .toLowerCase()            // uppercase hatao
      .replace(/\/+$/, '');     // trailing slash hatao

    // homepage ka canonical bina slash
    if (cleanPath === '' || cleanPath === '/') {
      cleanPath = '';
    }

    const canonicalUrl = `${baseUrl}${cleanPath}`;

    // ✅ canonical link update karo
    let link = document.querySelector(
      "link[rel='canonical']"
    ) as HTMLLinkElement | null;

    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }

    link.href = canonicalUrl;

    // ✅ og:url bhi update karo (Google ke liye signal)
    let ogUrl = document.querySelector(
      "meta[property='og:url']"
    ) as HTMLMetaElement | null;

    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', canonicalUrl);
  }, [pathname]);

  return null;
}