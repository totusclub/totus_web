import React, { useState, useEffect, CSSProperties } from 'react';
import Slider from 'react-slick';
import Modal from 'react-modal';
import styles from './galleryModal.module.css';
import Icon from "@/components/icons/Icon";
import 'slick-carousel/slick/slick.css';

interface ArrowProps {
    onClick?: () => void;
    className?: string;
    style?: CSSProperties;
}

const ArrowLeft = ({ onClick }: ArrowProps) => (
    <div className={styles.arrowLeft} onClick={onClick}>
        <Icon name="leftArrow" size={24} color="var(--textPrimary)" />
    </div>
);

const ArrowRight = ({ onClick }: ArrowProps) => (
    <div className={styles.arrowRight} onClick={onClick}>
        <Icon name="rightArrow" size={24} color="var(--textPrimary)" />
    </div>
);

type ImageItem = {
    x500?: string;
    x900?: string;
    x800?: string;
    x620?: string;
    src?: string;
    [key: string]: string | undefined;
};

interface GalleryModalProps {
    isOpen: boolean;
    onClose: () => void;
    images: ImageItem[];
    initialIndex?: number;
}

const GalleryModal: React.FC<GalleryModalProps> = ({ isOpen, onClose, images, initialIndex = 0 }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [thumbnailSliderDesktop, setThumbnailSliderDesktop] = useState<Slider | null>(null);
    const [thumbnailSliderMobile, setThumbnailSliderMobile] = useState<Slider | null>(null);

    useEffect(() => {
        if (typeof document !== 'undefined') {
            Modal.setAppElement('#root');
        }
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const scrollY = window.scrollY;
        const previousBodyPosition = document.body.style.position;
        const previousBodyTop = document.body.style.top;
        const previousBodyWidth = document.body.style.width;
        const previousBodyOverflow = document.body.style.overflow;
        const previousHtmlOverflow = document.documentElement.style.overflow;

        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';

        return () => {
            document.body.style.position = previousBodyPosition;
            document.body.style.top = previousBodyTop;
            document.body.style.width = previousBodyWidth;
            document.body.style.overflow = previousBodyOverflow;
            document.documentElement.style.overflow = previousHtmlOverflow;
            window.scrollTo(0, scrollY);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            // Set initial slider position after a short delay to ensure slider is ready
            setTimeout(() => {
                if (thumbnailSliderDesktop && images.length > 0) {
                    const slidesToShow = 3;
                    let targetSlide = initialIndex;

                    if (initialIndex > 0 && initialIndex < images.length - 1) {
                        targetSlide = Math.max(0, initialIndex - 1);
                    } else if (initialIndex >= images.length - 1) {
                        targetSlide = Math.max(0, images.length - slidesToShow);
                    }

                    thumbnailSliderDesktop.slickGoTo(targetSlide);
                }
            }, 100);
        }
    }, [isOpen, initialIndex, thumbnailSliderDesktop, images.length]);

    // Sync desktop thumbnail slider to show active thumbnail (show 3 items, center active one)
    useEffect(() => {
        if (isOpen && thumbnailSliderDesktop && images.length > 0) {
            const slidesToShow = 3;
            let targetSlide = currentIndex;

            // Center the active thumbnail when possible
            if (currentIndex > 0 && currentIndex < images.length - 1) {
                targetSlide = Math.max(0, currentIndex - 1);
            } else if (currentIndex >= images.length - 1) {
                // If near the end, show the last 3 items
                targetSlide = Math.max(0, images.length - slidesToShow);
            }

            thumbnailSliderDesktop.slickGoTo(targetSlide);
        }
    }, [isOpen, currentIndex, thumbnailSliderDesktop, images.length]);

    // Sync mobile thumbnail slider
    useEffect(() => {
        if (isOpen && thumbnailSliderMobile) {
            thumbnailSliderMobile.slickGoTo(currentIndex);
        }
    }, [isOpen, currentIndex, thumbnailSliderMobile]);

    if (!images || images.length === 0) return null;

    const resolveImageUrl = (value?: string) => {
        if (!value) return '';
        if (value.startsWith('http://') || value.startsWith('https://')) return value;
        return `https://img.cdn.level.travel/${value}`;
    };

    const currentImage = images[currentIndex];
    const currentImageUrl = currentImage
        ? resolveImageUrl(
            currentImage['x900'] ||
            currentImage['x800'] ||
            currentImage['x620'] ||
            currentImage['x500'] ||
            currentImage.src
        )
        : '';

    const handlePrevious = () => {
        const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
        setCurrentIndex(newIndex);
    };

    const handleNext = () => {
        const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
        setCurrentIndex(newIndex);
    };

    const handleThumbnailClick = (index: number) => {
        setCurrentIndex(index);
    };

    // Desktop: Vertical slider for thumbnails on left (show 3 at a time)
    const thumbnailSettingsDesktop = {
        vertical: true,
        slidesToShow: 3,
        slidesToScroll: 1,
        infinite: false,
        arrows: false, // No arrows on thumbnail slider
        dots: false,
    };

    // Mobile: Horizontal slider for thumbnails below (always show 3)
    const thumbnailSettingsMobile = {
        vertical: false,
        slidesToShow: 3,
        slidesToScroll: 1,
        infinite: false,
        arrows: false, // No arrows on thumbnail slider
        dots: false,
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
            handlePrevious();
        } else if (e.key === 'ArrowRight') {
            handleNext();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            overlayClassName={styles.modalOverlay}
            className={styles.galleryModal}
            closeTimeoutMS={300}
            shouldCloseOnOverlayClick={true}
            contentLabel="Фотографии"
        >
            <div
                className={styles.galleryModalContent}
                onKeyDown={handleKeyDown}
                tabIndex={-1}
                ref={(el) => {
                    if (el && isOpen) {
                        setTimeout(() => el.focus(), 100);
                    }
                }}
            >
                {/* Header with Close Button */}
                <div className={styles.modalHeader}>
                    <div className={styles.modalHeaderLine}></div>
                    <button className={styles.closeButton} onClick={onClose} aria-label="Close gallery">
                        <Icon name="closeLine" size={24} color="var(--textPrimary)" />
                    </button>
                </div>

                <div className={styles.galleryContainer}>
                    {/* Desktop: Left Thumbnail Slider (Vertical) */}
                    <div className={styles.thumbnailSliderWrapperDesktop}>
                        <Slider
                            {...thumbnailSettingsDesktop}
                            ref={(slider) => setThumbnailSliderDesktop(slider)}
                        >
                            {images.map((img: ImageItem, index: number) => {
                                const thumbnailUrl = resolveImageUrl(
                                    img['x500'] || img['x620'] || img['x800'] || img['x900'] || img.src
                                );
                                return (
                                    <div key={index} className={styles.thumbnailSlideDesktop}>
                                        <img
                                            src={thumbnailUrl}
                                            alt={`Thumbnail ${index + 1}`}
                                            className={`${styles.thumbnailDesktop} ${index === currentIndex ? styles.activeThumbnail : ''}`}
                                            onClick={() => handleThumbnailClick(index)}
                                        />
                                    </div>
                                );
                            })}
                        </Slider>
                    </div>

                    {/* Main Image with Arrows */}
                    <div className={styles.mainImageSection}>
                        <ArrowLeft onClick={handlePrevious} />
                        <div className={styles.mainImageWrapper}>
                            <img
                                src={currentImageUrl}
                                alt={`Gallery image ${currentIndex + 1}`}
                                className={styles.mainImage}
                            />
                            {/* Mobile arrows - only visible on mobile */}
                            <div className={styles.arrowLeftMobile} onClick={handlePrevious}>
                                <Icon name="leftArrow" size={24} color="var(--textPrimary)" />
                            </div>
                            <div className={styles.arrowRightMobile} onClick={handleNext}>
                                <Icon name="rightArrow" size={24} color="var(--textPrimary)" />
                            </div>
                        </div>
                        <ArrowRight onClick={handleNext} />
                    </div>

                    {/* Mobile: Bottom Thumbnail Slider (Horizontal) */}
                    <div className={styles.thumbnailSliderWrapperMobile}>
                        <Slider
                            {...thumbnailSettingsMobile}
                            ref={(slider) => setThumbnailSliderMobile(slider)}
                        >
                            {images.map((img: ImageItem, index: number) => {
                                const thumbnailUrl = resolveImageUrl(
                                    img['x500'] || img['x620'] || img['x800'] || img['x900'] || img.src
                                );
                                return (
                                    <div key={index} className={styles.thumbnailSlideMobile}>
                                        <img
                                            src={thumbnailUrl}
                                            alt={`Thumbnail ${index + 1}`}
                                            className={`${styles.thumbnailMobile} ${index === currentIndex ? styles.activeThumbnail : ''}`}
                                            onClick={() => handleThumbnailClick(index)}
                                        />
                                    </div>
                                );
                            })}
                        </Slider>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default GalleryModal;

