/* eslint-disable @next/next/no-img-element */

import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { AnchorHTMLAttributes, ImgHTMLAttributes, ReactNode } from 'react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

vi.mock('next/image', () => ({
  default: function MockImage(props: ImgHTMLAttributes<HTMLImageElement>) {
    return <img alt={props.alt ?? ''} {...props} />;
  },
}));

vi.mock('next/link', () => ({
  default: function MockLink({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string | URL | { pathname?: string };
    children: ReactNode;
  }) {
    const resolvedHref = typeof href === 'string' ? href : String(href);
    return (
      <a href={resolvedHref} {...props}>
        {children}
      </a>
    );
  },
}));
