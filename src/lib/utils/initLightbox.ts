// src/lib/utils/initLightbox.ts
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';

export function initGallery() {
  const lightbox = new PhotoSwipeLightbox({

    zoom: false,
    gallery: '.gallery',
    children: 'a',

  initialZoomLevel: 'fill',
  secondaryZoomLevel: 'fill',

    pswpModule: () => import('photoswipe'),
  });
  lightbox.init();
}
