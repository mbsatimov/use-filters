import { ImageResponse } from 'next/og';

import { siteConfig } from '@/lib/metadata';

/** Site-wide social card (Open Graph + Twitter). Next injects it into every route's tags. */
export const alt = siteConfig.title;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#0a0a0a',
        padding: '80px',
        fontFamily: 'sans-serif',
        color: '#fafafa'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div
          style={{
            display: 'flex',
            width: '72px',
            height: '72px',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '18px',
            background: 'linear-gradient(160deg, #818cf8, #4f46e5)'
          }}
        >
          <svg fill='#ffffff' height='44' viewBox='0 0 24 24' width='44'>
            <path d='M3 5h18l-7 8v6h-4v-6z' />
          </svg>
        </div>
        <div style={{ display: 'flex', fontSize: '40px', fontWeight: 700 }}>{siteConfig.name}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div
          style={{
            display: 'flex',
            fontSize: '66px',
            fontWeight: 700,
            lineHeight: 1.1,
            maxWidth: '960px'
          }}
        >
          Headless, URL-synced filter state for React
        </div>
        <div style={{ display: 'flex', fontSize: '30px', color: '#a1a1aa', maxWidth: '900px' }}>
          Typed params, resolved filter state, and nuqs-backed URL sync — bring your own UI.
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '26px',
          color: '#a1a1aa'
        }}
      >
        <div style={{ display: 'flex', fontFamily: 'monospace' }}>npm i @mbsatimov/use-filters</div>
        <div style={{ display: 'flex' }}>use-filters.vercel.app</div>
      </div>
    </div>,
    { ...size }
  );
}
