import styles from './rating.module.css';
import Icon from "@/components/icons/Icon";


const Rating = () => {
    return (
        <div className={styles.rating}>
                <Icon name={'star'} size={24} color="var(--core_Orange)"/>
                <Icon name={'star'} size={24} color="var(--core_Orange)"/>
                <Icon name={'star'} size={24} color="var(--core_Orange)"/>
                <Icon name={'star'} size={24} color="var(--core_Orange)"/>
                <Icon name={'star'} size={24} color="var(--core_Orange)"/>
        </div>
    );
};

export default Rating;
