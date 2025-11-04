import styles from './trackPrices.module.css';
import Icon from "@/components/icons/Icon";
import Switch from "@/components/UI/switch";
import React from 'react';

interface TrackPricesProps {
    priceTrack: boolean;
    setPriceTrack: (value: boolean) => void;
    text: string;
}

const TrackPrices: React.FC<TrackPricesProps> = ({ priceTrack, setPriceTrack, text }) => {
    return (
        <div className={styles.trackPrices}>
            <div className={styles.trackPricesNotify}>
                <Icon name="notification" size={24} />
                <p>Отслеживайте цены.</p>
            </div>
            <div className={styles.trackPricesSwitch}>
                <p>
                    {text.split('\n').map((line, index) => (
                        <React.Fragment key={index}>
                            {line}
                            <br />
                        </React.Fragment>
                    ))}
                </p>
                <Switch isOn={priceTrack} setIsOn={setPriceTrack} />
            </div>
        </div>
    );
};

export default TrackPrices;
