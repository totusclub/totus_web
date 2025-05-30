import React, {CSSProperties, useState} from 'react';
import Slider from 'react-slick';
import styles from './smallSlide.module.css';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Icon from "@/components/icons/Icon";
import Image from "next/image";


interface ArrowProps {
    onClick?: () => void;
    className?: string;
    style?: CSSProperties;
}

const NextArrow = ({ onClick }: ArrowProps) => {
    return (
        <div className={styles.nextArrowSmall} onClick={onClick}>
            <Icon name="rightArrow" size={24} color="#000" />
        </div>
    );
};

const PrevArrow = ({ onClick }: ArrowProps) => {
    return (
        <div className={styles.prevArrowSmall} onClick={onClick}>
            <Icon name="leftArrow" size={24} color="#000" />
        </div>
    );
};

const SmallSlider = () => {
    const images = [
        'https://www.staysomedays.com/wp-content/uploads/2021/12/hotel-grof-800x800.jpg',
        'https://www.staysomedays.com/wp-content/uploads/2021/12/hotel-grof-800x800.jpg',
        'https://www.staysomedays.com/wp-content/uploads/2021/12/hotel-grof-800x800.jpg',
        'https://www.staysomedays.com/wp-content/uploads/2021/12/hotel-grof-800x800.jpg',
        'https://www.staysomedays.com/wp-content/uploads/2021/12/hotel-grof-800x800.jpg',
        'https://www.staysomedays.com/wp-content/uploads/2021/12/hotel-grof-800x800.jpg',
    ];

    const [selectedIndex, setSelectedIndex] = useState(0);

    const settings = {
        dots: false,
        infinite: true,
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 1,
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
    };

    return (
        <div className={styles.containerSmallSlider}>
            <div className={styles.selectedImageWrapper}>
                <img
                    src={images[selectedIndex]}
                    alt="Selected"

                    className={styles.selectedImage}
                />
            </div>
            <Slider {...settings}>
                {images.map((img, index) => (
                    <div key={index} onClick={() => setSelectedIndex(index)}>
                        <div
                            className={`${styles.slideItem} ${
                                selectedIndex === index ? styles.selected : ''
                            }`}
                        >
                            <img  src={img} alt={`No Image`} className={styles.thumbnail} />
                        </div>
                    </div>
                ))}
            </Slider>
        </div>
    );
};

export default SmallSlider;
