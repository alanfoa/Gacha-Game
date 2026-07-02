import { useEffect, useRef } from 'react';

export function usePreloader(imageUrls: string[]) {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const unique = [...new Set(imageUrls)];
    unique.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [imageUrls]);
}
