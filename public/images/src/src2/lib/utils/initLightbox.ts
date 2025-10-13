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
    lightbox.pswp.ui.registerElement({
      name: 'custom-caption',
      order: 9,
      isButton: false,
      appendTo: 'root',
      html: 'Caption text',
      onInit: (el, pswp) => {
        lightbox.pswp.on('change', () => {
          const currSlideElement = lightbox.pswp.currSlide.data.element;
          let captionHTML = '';
          if (currSlideElement) {
            const hiddenCaption = currSlideElement.querySelector('.hidden-caption-content');
            if (hiddenCaption) {
              captionHTML = hiddenCaption.innerHTML;
            } else {
              captionHTML = currSlideElement.querySelector('img').getAttribute('alt');
            }
          }
          el.innerHTML = captionHTML || '';
        });
      },
    });
  });

  lightbox.init();
}
