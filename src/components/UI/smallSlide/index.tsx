import React, {CSSProperties, useEffect, useState} from 'react';
import Slider from 'react-slick';
import styles from './smallSlide.module.css';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Icon from "@/components/icons/Icon";
import Image from "next/image";
import AppImage from "@/components/UI/appImage";


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

const SmallSlider = ({images}) => {
    const [selectedIndex, setSelectedIndex] = useState(null);

    useEffect(() => {
        if(images?.length > 0){
            console.log(images[0]['x900'])
            setSelectedIndex(images[0]['x900']);
        }

    },[images])

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
                {/*<img*/}
                {/*    src={selectedIndex}*/}
                {/*    alt="Selected"*/}

                {/*    className={styles.selectedImage}*/}
                {/*/>*/}
                <AppImage imageUrl={selectedIndex}/>
            </div>
            <Slider {...settings}>
                {images.map((img, index) => (
                    <div key={index} onClick={() => setSelectedIndex(img['x900'])}>
                        <div
                            className={`${styles.slideItem} ${
                                selectedIndex === img['x900'] ? styles.selected : ''
                            }`}
                        >
                            <img  src={img['x900']} alt={`No Image`} className={styles.thumbnail} />
                        </div>
                    </div>
                ))}
            </Slider>
        </div>
    );
};

export default SmallSlider;
