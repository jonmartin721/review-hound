'use client';

import Image from 'next/image';
import { useState, useCallback, useEffect } from 'react';

interface LightboxImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export function LightboxImage({ src, alt, width, height }: LightboxImageProps) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  return (
    <>
      <button onClick={() => setOpen(true)} className="border border-[var(--border)] overflow-hidden cursor-pointer hover:border-[var(--border-bright)] transition-colors group w-full">
        <Image src={src} alt={alt} width={width} height={height} className="w-full h-auto transition group-hover:brightness-110" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 modal-backdrop flex items-center justify-center p-8 cursor-pointer" onClick={close}>
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <Image src={src} alt={alt} width={width} height={height} className="max-w-full max-h-[90vh] w-auto h-auto object-contain" />
          </div>
        </div>
      )}
    </>
  );
}
