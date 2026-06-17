import { useEffect, useState } from 'react';
import { useLightbox } from '../../hooks/useLightbox';

export function Lightbox() {
  const src = useLightbox((s) => s.src);
  const close = useLightbox((s) => s.close);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!src) return;
    setScale(1);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === '+' || e.key === '=') setScale((s) => Math.min(s + 0.2, 4));
      if (e.key === '-') setScale((s) => Math.max(s - 0.2, 0.2));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [src, close]);

  if (!src) return null;

  return (
    <div className="lightbox-overlay" onClick={close}>
      <img
        src={src}
        className="lightbox-img"
        style={{ transform: `scale(${scale})` }}
        onClick={(e) => e.stopPropagation()}
        alt=""
      />
    </div>
  );
}
