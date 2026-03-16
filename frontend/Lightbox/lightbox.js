let currentImageIndex = 0;
const images = [];

function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');

    const allImgs = Array.from(document.querySelectorAll('img')).filter(img => {
        if (img.id === 'like-icon' || img.id === 'view-icon') return false;
        if (img.closest('.logo')) return false;
        if (img.closest('a')) return false;
        if (img.hasAttribute('onclick')) return false;

        return img.closest('.image-wrapper') || img.closest('.recipe-description') || img.closest('.recipe-steps');
    });


    allImgs.forEach((img, index) => {
        images.push({
            src: img.src,
            alt: img.alt || "Изображение"
        });
        img.addEventListener('click', () => {
            openLightbox(index);
        });
    });

    function openLightbox(index) {
        currentImageIndex = index;
        lightbox.style.display = 'flex';
        updateLightboxContent();
        document.body.style.overflow = 'hidden';
    }

    function updateLightboxContent() {
        const data = images[currentImageIndex];
        lightboxImg.src = data.src;
        lightboxCaption.textContent = data.alt;
    }

    const closeLightbox = () => {
        const lightbox = document.getElementById('lightbox');
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto';
    };
    const showNext = () => {
        currentImageIndex = (currentImageIndex + 1) % images.length;
        updateLightboxContent();
    };
    const showPrev = () => {
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        updateLightboxContent();
    };

    lightbox.onclick = (e) => {
        if (e.target === lightbox) {
            lightbox.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };

    document.querySelector('.close-lightbox').onclick = closeLightbox;
    document.querySelector('.lightbox-content img').onclick = closeLightbox;
    document.querySelector('.lightbox-next').onclick = (e) => {
        e.stopPropagation();
        showNext();
    };
    document.querySelector('.lightbox-prev').onclick = (e) => {
        e.stopPropagation();
        showPrev();
    };

    document.addEventListener('keydown', (event) => {
        const lightbox = document.getElementById('lightbox');

        if (lightbox.style.display === 'flex') {
            if (event.key === "Escape") {
                closeLightbox();
            } else if (event.key === "ArrowRight") {
                showNext();
            } else if (event.key === "ArrowLeft") {
                showPrev();
            }
        }
    });
}

initLightbox();