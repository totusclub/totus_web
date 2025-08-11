import React, {CSSProperties, useEffect, useState} from 'react';
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

const ArrowBottom = ({ onClick }: ArrowProps) => {
    return (
        <div className={styles.arrowBottom} onClick={onClick}>
            <Icon name="downArrow" size={24} color="#000" />
        </div>
    );
};

const ArrowTop = ({ onClick }: ArrowProps) => {
    return (
        <div className={styles.arrowTop} onClick={onClick}>
            <Icon name="upArrow" size={24} color="#000" />
        </div>
    );
};

const VerticalSlider = ({images}:any) => {
    const [selectedImage, setSelectedImage] = useState(0);


    useEffect(() => {
        if(images?.length> 0){
            setSelectedImage(`https://img.cdn.level.travel/${images?.[0]['x500']}`);
        }
    },[images])

    const settings = {
        vertical: true,
        slidesToShow: 6,
        slidesToScroll: 1,
        infinite: true,
        arrows: true,
        nextArrow: <ArrowBottom />,
        prevArrow: <ArrowTop />,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 3,
                    infinite: true,
                    dots: true
                }
            },
            {
                breakpoint: 600,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 2,
                    initialSlide: 2
                }
            },
            {
                breakpoint: 480,
                settings: {
                    vertical:false,
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    dots: false,
                    arrows:false
                }
            }

        ]
    };



    return (
        <div className={styles.container}>
            <div className={styles.sliderWrapper}>
                <Slider {...settings}>
                    {images.map((img, index) => (
                        <div key={index} onClick={() => setSelectedImage(`https://img.cdn.level.travel/${img['x500']}`)}>
                            <img
                                src={`https://img.cdn.level.travel/${img['x500']}`}
                                alt={`Thumb ${index}`}
                                className={`${styles.thumbnail} ${
                                    selectedImage === `https://img.cdn.level.travel/${img['x500']}` ? styles.selectedThumbnail : ''
                                }`}
                                tabIndex={index}
                            />
                        </div>
                    ))}
                </Slider>
            </div>
            <div>
                <img src={selectedImage} alt="Selected" className={styles.selectedImage}/>
            </div>
        </div>
    );
};

export default VerticalSlider;
