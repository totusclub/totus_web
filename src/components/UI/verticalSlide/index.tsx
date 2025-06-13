import React, {CSSProperties, useEffect, useState} from 'react';
import Slider from 'react-slick';
import styles from './verticalSlide.module.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Icon from "@/components/icons/Icon";

// const images = [
//     'https://s1.at.atcdn.net/wp-content/uploads/2025/01/2025-openings-australia-1-800x600.png',
//     'https://xohotels.com/wp-content/uploads/2025/01/x3.-XO-Hotel-Inner-Twin-room-800x800.jpg.pagespeed.ic.o5Dzxvw734.jpg',
//     'https://image-tc.galaxy.tf/wijpeg-5w2ddxfspi5d5hfg7p5e8d503/falkensteiner-hotel-bozen-zimmerbild-1-980x980.jpg?width=800',
//     'https://so-hotels.com/wp-content/uploads/sites/19/2023/02/vienna-sq-800x800-room-lofty-weilguny014.jpg',
//     'https://vretreats.com/wp-content/uploads/2024/08/atlantis_bay_taormina_5-800x800.jpg',
//     'https://vretreats.com/wp-content/uploads/2024/08/atlantis_bay_taormina_5-800x800.jpg',
//     'https://www.rimrockresort.com/content/uploads/2023/06/Signature-GrandView_800_Room_1_1920w-800x800.jpg',
//     'https://xohotels.com/wp-content/uploads/2024/08/x24.-Artemis-Restaurant-terrace-800x800.jpg.pagespeed.ic.gS9NTtd-88.jpg',
// ];

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
    const [selectedImage, setSelectedImage] = useState(null);


    useEffect(() => {
        if(images?.length> 0){
            setSelectedImage(`https://img.cdn.level.travel/${images?.[0]['x500']}`);
        }
    },[images])

    const settings = {
        vertical: true,
        slidesToShow: 6,
        slidesToScroll: 1,
        infinite: false,
        arrows: true,
        nextArrow: <ArrowBottom />,
        prevArrow: <ArrowTop />,
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
                                tabIndex={-1}
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
