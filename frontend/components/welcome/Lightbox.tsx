'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface LightboxImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export function LightboxImage({ src, alt, width, height }: LightboxImageProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="border border-border rounded-lg overflow-hidden cursor-pointer hover:border-ring transition-colors group w-full">
        <Image src={src} alt={alt} width={width} height={height} className="w-full h-auto transition group-hover:brightness-110" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 border-none bg-transparent shadow-none">
          <Image src={src} alt={alt} width={width} height={height} className="max-w-full max-h-[90vh] w-auto h-auto object-contain" />
        </DialogContent>
      </Dialog>
    </>
  );
}
