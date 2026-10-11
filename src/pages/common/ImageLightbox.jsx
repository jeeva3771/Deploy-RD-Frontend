import React from 'react';

/**
 * Lightweight in-page image lightbox.
 * 
 * Props:
 *  src      – URL of the image to display (pass null/undefined to hide)
 *  fileName – Display name shown in the footer bar
 *  onClose  – Callback fired when the overlay or close button is clicked
 */
const ImageLightbox = ({ src, fileName, onClose }) => {
    if (!src) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            onClick={onClose}
            style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
        >
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-5 text-white/70 hover:text-white text-3xl leading-none z-10"
                title="Close"
            >
                <i className="fa-solid fa-xmark" />
            </button>

            {/* Image container — click stops propagation so overlay doesn't close */}
            <div
                className="relative max-w-[90vw] max-h-[90vh] rounded-xl overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <img
                    src={src}
                    alt={fileName}
                    className="max-w-[90vw] max-h-[90vh] object-contain block"
                />

            </div>
        </div>
    );
};

export default ImageLightbox;
