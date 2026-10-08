import React, { CSSProperties, useEffect, useState } from 'react';
import Slider from 'react-slick';
import styles from './smallSlide.module.css';
import "slick-carousel/slick/slick.css";
import Icon from "@/components/icons/Icon";
import Image from "next/image";
import AppImage from "@/components/UI/appImage";
import GalleryModal from "@/components/UI/galleryModal";
import { useIconColor } from "@/hooks/useTheme";


interface ArrowProps {
    onClick?: () => void;
    className?: string;
    style?: CSSProperties;
}

const NextArrow = ({ onClick }: ArrowProps) => {
    const iconColor = useIconColor();
    return (
        <div className={styles.nextArrowSmall} onClick={onClick}>
            <Icon name="rightArrow" size={24} color={iconColor} />
        </div>
    );
};

const PrevArrow = ({ onClick }: ArrowProps) => {
    const iconColor = useIconColor();
    return (
        <div className={styles.prevArrowSmall} onClick={onClick}>
            <Icon name="leftArrow" size={24} color={iconColor} />
        </div>
    );
};

const SmallSlider = ({ images }) => {
    const [selectedIndex, setSelectedIndex] = useState<string>('');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    useEffect(() => {
        if (images?.length > 0) {
            setSelectedIndex(images[0]['x900']);
        }
    }, [images]);

    const maxDots = 10;

    // useEffect(() => {
    //     if(images?.length > 0){
    //         console.log(images[0]['x900'])
    //         setSelectedIndex(`https://image.totus.club/imagePath?directory=${images[0]['x900']}`);
    //     }
    //
    // },[images])

    const settings = {
        vertical: false,
        slidesToShow: 3,
        slidesToScroll: 1,
        infinite: true,
        arrows: true,
        dots: false,
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
        beforeChange: (_: number, next: number) => setCurrentSlide(next),
        appendDots: (dots: React.ReactNode) => {
            const dotsArray = React.Children.toArray(dots);
            const total = dotsArray.length;

            let start = Math.max(0, currentSlide - Math.floor(maxDots - 2));
            let end = start + maxDots;

            if (end > total) {
                end = total;
                start = Math.max(0, end - maxDots);
            }

            const visibleDots = dotsArray.slice(start, end);

            return (
                <ul className={styles.cutomDoth} style={{ display: "flex", overflowX: "auto", gap: "1px" }}>
                    {visibleDots}
                </ul>
            );
        },
        customPaging: (i: number) => (
            <div
                style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: i === currentSlide ? "#FE732E" : "#8080804D", // Active dot = black
                    transition: "background 0.3s ease",
                }}
            />
        ),
        responsive: [
            {
                breakpoint: 1026,
                settings: {
                    vertical: false,
                    slidesToShow: 3,
                    slidesToScroll: 2,
                    arrows: false,
                    dots: true,
                },
            },
            {
                breakpoint: 600,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 2,
                    initialSlide: 2,
                    dots: true,
                },
            },
            {
                breakpoint: 480,
                settings: {
                    vertical: false,
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    dots: true,
                    arrows: false,
                },
            },
        ],
    };

    return (
        <div className={styles.containerSmallSlider}>
            <div
                className={styles.selectedImageWrapper}
                onClick={() => {
                    const index = images?.findIndex((img) => img['x900'] === selectedIndex) ?? 0;
                    setSelectedImageIndex(index >= 0 ? index : 0);
                    setIsModalOpen(true);
                }}
            >
                {/*<img*/}
                {/*    src={selectedIndex}*/}
                {/*    alt="Selected"*/}

                {/*    className={styles.selectedImage}*/}
                {/*/>*/}
                <AppImage imageUrl={selectedIndex} />
            </div>
            <Slider {...settings}>
                {images.map((img, index) => (
                    <div
                        key={index}
                        onClick={() => {
                            setSelectedIndex(img['x900']);
                            setSelectedImageIndex(index);
                            setIsModalOpen(true);
                        }}
                    >
                        <div
                            className={`${styles.slideItem} ${selectedIndex === img['x900'] ? styles.selected : ''
                                }`}
                        >
                            {/*<img  src={`https://image.totus.club/imagePath?directory=${img['x900'].replace("https://img.cdn.level.travel/", "")}`} alt={`No Image`} className={styles.thumbnail} />*/}
                            <img src={img['x900']} alt={`No Image`} className={styles.thumbnail} loading="lazy" decoding="async" />
                        </div>
                    </div>
                ))}
            </Slider>
            <GalleryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                images={images}
                initialIndex={selectedImageIndex}
            />
        </div>
    );
};

export default SmallSlider;
