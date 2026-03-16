'use client';

import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

function getIsDark() {
  return document.documentElement.classList.contains('dark');
}

function getServerSnapshot() {
  return true; // default to dark on server
}

export function HeroVideo() {
  const isDark = useSyncExternalStore(subscribe, getIsDark, getServerSnapshot);

  return (
    <video
      key={isDark ? 'dark' : 'light'}
      autoPlay
      loop
      muted
      playsInline
      className="w-full h-auto border border-border rounded-lg"
    >
      <source
        src={isDark ? '/hero-video.mp4' : '/hero-video-light.mp4'}
        type="video/mp4"
      />
    </video>
  );
}
