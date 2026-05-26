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

  lightbox.on('uiRegister', function() {
    const pswp = lightbox.pswp;
    if (!pswp?.ui) return;

    pswp.ui.registerElement({
      name: 'custom-caption',
      order: 9,
      isButton: false,
      appendTo: 'root',
      html: 'Caption text',
      onInit: (el) => {
        const pswp = lightbox.pswp;
        if (!pswp) return;

        pswp.on('change', () => {
          const currSlideElement = pswp.currSlide?.data?.element as Element | undefined;
          let captionHTML = '';
          if (currSlideElement) {
            const hiddenCaption = currSlideElement.querySelector('.hidden-caption-content');
            if (hiddenCaption instanceof HTMLElement) {
              captionHTML = hiddenCaption.innerHTML;
            } else {
              const img = currSlideElement.querySelector('img');
              captionHTML = img?.getAttribute('alt') ?? '';
            }
          }
          el.innerHTML = captionHTML;
        });
      },
    });
  });

  lightbox.init();
}