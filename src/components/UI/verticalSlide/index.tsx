import React, { CSSProperties, useEffect, useState } from 'react';
import Slider from 'react-slick';
import styles from './verticalSlide.module.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Icon from "@/components/icons/Icon";

interface ArrowProps {
    onClick?: () => void;
    className?: string;
    style?: CSSProperties;
}

const ArrowBottom = ({ onClick }: ArrowProps) => (
    <div className={styles.arrowBottom} onClick={onClick}>
        <Icon name="downArrow" size={24} color="#000" />
    </div>
);

const ArrowTop = ({ onClick }: ArrowProps) => (
    <div className={styles.arrowTop} onClick={onClick}>
        <Icon name="upArrow" size={24} color="#000" />
    </div>
);

const VerticalSlider = ({ images ,loading}: any) => {
    const [selectedImage, setSelectedImage] = useState<string>("");
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (images?.length > 0) {
            setSelectedImage(`https://image.totus.club/imagePath?directory=${images[0]['x500']}`);
        }
    }, [images]);

    const maxDots = 10;

    const settings = {
        vertical: true,
        slidesToShow: 6,
        slidesToScroll: 1,
        infinite: true,
        arrows: true,
        dots: false,
        nextArrow: <ArrowBottom />,
        prevArrow: <ArrowTop />,
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
                    slidesToShow: 2.2,
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
                    infinite: false,
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    dots: true,
                    arrows: false,
                },
            },
        ],
    };

if(loading){
    return (
        <div className={styles.container}>
            <div className={styles.sliderWrapper}>
                <Slider {...settings}>
                    {images.map((img: any, index: number) => (
                        <div
                            key={index}
                            onClick={() =>
                                setSelectedImage(`https://image.totus.club/imagePath?directory=${img['x500']}`)
                            }
                        >
                            <img
                                src={`https://image.totus.club/imagePath?directory=${img['x500']}`}
                                alt={`Thumb ${index}`}
                                className={`${styles.thumbnail} ${
                                    selectedImage ===
                                    `https://image.totus.club/imagePath?directory=${img['x500']}`
                                        ? styles.selectedThumbnail
                                        : ''
                                }`}
                                tabIndex={index}
                            />
                        </div>
                    ))}
                </Slider>
            </div>
            <div>
                <img
                    src={selectedImage}
                    alt="Selected"
                    className={styles.selectedImage}
                />
            </div>
        </div>
    );
}else{
    return (
        <div className={styles.image_placeholder}></div>
    )
}

};

export default VerticalSlider;
