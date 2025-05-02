// src/components/GalleryLightboxInit.tsx
import { useEffect } from 'react';
import { initGallery } from '../lib/utils/initLightbox';

export default function GalleryLightboxInit() {
  useEffect(() => {
    initGallery();
  }, []);

  return null;
}
