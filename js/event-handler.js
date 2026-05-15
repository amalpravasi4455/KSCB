document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    const galleryGrid = document.getElementById('event-gallery-grid');
    const eventTitle = document.getElementById('event-title');
    const eventDesc = document.getElementById('event-description');

    if (!galleryData[eventId]) {
        if (eventTitle) eventTitle.innerText = "Event Not Found";
        if (galleryGrid) galleryGrid.innerHTML = "<p>The requested event does not exist.</p>";
        return;
    }

    const event = galleryData[eventId];
    if (eventTitle) eventTitle.innerText = event.title;
    document.title = `${event.title} | Kozhikode QA`;
    if (event.description && eventDesc) eventDesc.innerText = event.description;

    // specific back link logic
    const backLink = document.querySelector('.back-link');
    if (backLink) {
        const isEnglish = window.location.pathname.endsWith('_en.html');
        if (eventId === 'videos') {
            backLink.href = isEnglish ? 'gallery_en.html' : 'gallery.html';
            backLink.innerHTML = isEnglish ? '<i class="fas fa-arrow-left"></i> Back to Main Gallery' : '<i class="fas fa-arrow-left"></i> ചിത്രങ്ങളുടെ ഗാലറിയിലേക്ക്';
        } else {
            backLink.href = isEnglish ? 'image-gallery_en.html' : 'image-gallery.html';
            backLink.innerHTML = isEnglish ? '<i class="fas fa-arrow-left"></i> Back to Image Gallery' : '<i class="fas fa-arrow-left"></i> പ്രധാന ഗാലറിയിലേക്ക്';
        }
    }


    // Helper to generate video thumbnail
    function generateVideoThumbnail(videoSrc, targetImg, targetThumbnail = null) {
        const video = document.createElement('video');
        video.src = videoSrc;
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;

        video.onloadedmetadata = () => {
            video.currentTime = 1; // Seek to 1 second to get a good frame
        };

        video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataURL = canvas.toDataURL('image/jpeg', 0.7);
            
            if (targetImg) targetImg.src = dataURL;
            if (targetThumbnail) targetThumbnail.querySelector('img').src = dataURL;
            
            // Cleanup
            video.remove();
        };

        video.onerror = () => {
            console.error("Error loading video for thumbnail:", videoSrc);
            if (targetImg) targetImg.src = 'images/img1.webp'; // Fallback
        };
    }

    // Render Items
    if (galleryGrid) {
        event.images.forEach((itemData, index) => {
            const item = document.createElement('div');
            item.classList.add('gallery-item');

            // Determine if item is simple string (image) or object (video)
            let imgSrc, title;
            let isVideo = false;
            let videoSrc = null;

            if (typeof itemData === 'string') {
                imgSrc = itemData;
                title = event.title;
            } else {
                imgSrc = itemData.thumb;
                title = itemData.title || 'Video';
                isVideo = true;
                videoSrc = itemData.src;
            }

            // Create container for relative positioning
            const imgContainer = document.createElement('div');
            imgContainer.style.position = 'relative';
            imgContainer.style.overflow = 'hidden'; // Ensure content stays inside

            // Make clickable
            imgContainer.style.cursor = "pointer";
            imgContainer.onclick = () => openLightbox(index);

            // Create image element
            const img = document.createElement('img');
            img.src = imgSrc || 'images/welcome-agri.png'; // Improved placeholder logic
            img.alt = title;
            img.loading = "lazy";
            
            if (isVideo && !imgSrc && videoSrc) {
                generateVideoThumbnail(videoSrc, img);
            }

            img.onerror = function () {
                if (this.closest('.gallery-item')) {
                    this.closest('.gallery-item').style.display = 'none';
                }
                console.error("Failed to load image:", imgSrc);
            };
            imgContainer.appendChild(img);

            // Add play icon overlay if it's a video
            if (isVideo) {
                const playIcon = document.createElement('div');
                playIcon.innerHTML = '<i class="fas fa-play-circle"></i>';
                playIcon.classList.add('video-play-icon');
                imgContainer.appendChild(playIcon);
            }

            item.appendChild(imgContainer);
            galleryGrid.appendChild(item);
        });
    }
});

let currentIndex = 0;

function openLightbox(index) {
    const lightbox = document.getElementById('lightbox');
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    const event = galleryData[eventId];

    if (!event || !event.images[index]) return;

    currentIndex = index;
    lightbox.style.display = 'block';

    // Generate Thumbnails
    const thumbContainer = document.getElementById('lightbox-thumbnails');
    if (thumbContainer) {
        thumbContainer.innerHTML = '';
        event.images.forEach((itemData, i) => {
            let thumbSrc;
            let videoSrc = null;
            if (typeof itemData === 'string') {
                thumbSrc = itemData;
            } else {
                thumbSrc = itemData.thumb;
                if (itemData.type === 'video' || itemData.type === 'youtube') {
                    videoSrc = itemData.src;
                }
            }

            const thumb = document.createElement('div');
            thumb.classList.add('lightbox-thumb');
            if (i === currentIndex) thumb.classList.add('active');

            thumb.onclick = () => {
                currentIndex = i;
                updateLightboxImage();
            };

            const img = document.createElement('img');
            img.src = thumbSrc || 'images/welcome-agri.png';
            thumb.appendChild(img);

            if (!thumbSrc && videoSrc && itemData.type === 'video') {
                generateVideoThumbnail(videoSrc, null, thumb);
            } else if (!thumbSrc && itemData.type === 'youtube') {
                // For YouTube, we can try to guess the thumbnail URL
                const videoId = videoSrc.split('/').pop().split('?')[0];
                img.src = `https://img.youtube.com/vi/${videoId}/default.jpg`;
            }

            thumbContainer.appendChild(thumb);
        });
    }

    updateLightboxImage();
    document.body.style.overflow = 'hidden'; // Disable scroll
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.style.display = 'none';
    document.body.style.overflow = 'auto'; // Enable scroll
}

function changeSlide(n) {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    const event = galleryData[eventId];

    currentIndex += n;
    if (currentIndex >= event.images.length) currentIndex = 0;
    if (currentIndex < 0) currentIndex = event.images.length - 1;

    updateLightboxImage();
}

function updateLightboxImage() {
    // Reset zoom when changing image
    if (typeof resetZoom === 'function') resetZoom();

    const lightboxContent = document.getElementById('lightbox-content-wrapper'); // We need a wrapper
    if (!lightboxContent) return;

    lightboxContent.innerHTML = ''; // Clear previous content

    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    const event = galleryData[eventId];
    const item = event.images[currentIndex];

    // Determine content type and source
    let contentSrc;
    let isVideo = false;
    let isYoutube = false;

    if (typeof item === 'string') {
        contentSrc = item;
    } else if (item.type === 'youtube') {
        contentSrc = item.src;
        isVideo = true;
        isYoutube = true;
    } else if (item.type === 'video') {
        contentSrc = item.src;
        isVideo = true;
    }

    const zoomControls = document.querySelector('.zoom-controls');

    if (isVideo) {
        if (zoomControls) zoomControls.style.display = 'none';

        if (isYoutube) {
            // YouTube Embed
            const iframe = document.createElement('iframe');
            iframe.src = contentSrc;
            iframe.className = 'lightbox-content lightbox-video';
            iframe.frameBorder = "0";
            iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
            iframe.allowFullscreen = true;
            lightboxContent.appendChild(iframe);
        } else {
            // HTML5 Video
            const video = document.createElement('video');
            video.src = contentSrc;
            video.className = 'lightbox-content lightbox-video';
            video.controls = true;
            video.autoplay = true;
            lightboxContent.appendChild(video);
        }
    } else {
        // It's an image
        if (zoomControls) zoomControls.style.display = 'flex';

        const img = document.createElement('img');
        img.src = contentSrc;
        img.className = 'lightbox-content';
        img.id = 'lightbox-img';
        img.style.transition = 'transform 0.3s ease'; // Smooth zoom
        img.onerror = function () {
            // Ideally notify user in UI
            const wrapper = document.getElementById('lightbox-content-wrapper');
            if (wrapper) {
                wrapper.innerHTML = '<div style="color:white;text-align:center;"><i class="fas fa-exclamation-triangle" style="font-size:3rem;margin-bottom:10px;"></i><br>Image not available</div>';
            }
        };
        lightboxContent.appendChild(img);
    }

    // Update Thumbnail Active State
    const thumbContainer = document.getElementById('lightbox-thumbnails');
    if (thumbContainer) {
        const thumbs = thumbContainer.children;
        for (let i = 0; i < thumbs.length; i++) {
            thumbs[i].classList.remove('active');
        }
        if (thumbs[currentIndex]) {
            thumbs[currentIndex].classList.add('active');
            thumbs[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
}

// Zoom Logic
let currentZoom = 1;
const ZOOM_STEP = 0.2;
const MAX_ZOOM = 3;
const MIN_ZOOM = 1;

function zoomIn() {
    if (currentZoom < MAX_ZOOM) {
        currentZoom += ZOOM_STEP;
        applyZoom();
    }
}

function zoomOut() {
    if (currentZoom > MIN_ZOOM) {
        currentZoom -= ZOOM_STEP;
        applyZoom();
    }
}

function resetZoom() {
    currentZoom = 1;
    applyZoom();
}

function applyZoom() {
    // Try by ID first, then by class inside lightbox
    let img = document.getElementById('lightbox-img');
    if (!img) {
        img = document.querySelector('#lightbox-content-wrapper img');
    }

    if (img) {
        img.style.transform = `scale(${currentZoom})`;
        console.log(`Zoom applied: ${currentZoom}`);
    } else {
        console.warn("Zoom target not found");
    }
}

// Close on click outside
window.onclick = function (event) {
    const lightbox = document.getElementById('lightbox');
    if (event.target == lightbox) {
        closeLightbox();
    }
}

// Close button event listener (if element exists)
const closeBtn = document.querySelector('.close-lightbox');
if (closeBtn) {
    closeBtn.addEventListener('click', closeLightbox);
}

// Keyboard navigation
document.addEventListener('keydown', function (event) {
    const lightbox = document.getElementById('lightbox');
    if (lightbox.style.display === 'block') {
        if (event.key === 'Escape') closeLightbox();
        if (event.key === 'ArrowLeft') changeSlide(-1);
        if (event.key === 'ArrowRight') changeSlide(1);
    }
});

// Expose functions to global scope
window.openLightbox = openLightbox;
window.changeSlide = changeSlide;
window.closeLightbox = closeLightbox;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
