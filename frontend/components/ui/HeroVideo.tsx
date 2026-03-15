'use client';

import { useEffect, useState } from 'react';

export function HeroVideo() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const html = document.documentElement;
    setIsDark(html.classList.contains('dark'));

    const observer = new MutationObserver(() => {
      setIsDark(html.classList.contains('dark'));
    });
    observer.observe(html, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <video
      key={isDark ? 'dark' : 'light'}
      autoPlay
      loop
      muted
      playsInline
      className="w-full h-auto border border-[var(--border)]"
    >
      <source
        src={isDark ? '/hero-video.mp4' : '/hero-video-light.mp4'}
        type="video/mp4"
      />
    </video>
  );
}
