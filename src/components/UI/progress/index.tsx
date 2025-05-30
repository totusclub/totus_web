import styles from './progress.module.css';
import Icon from "@/components/icons/Icon";

interface InputProps {
    title?: string;
}

const Progress = ({title}: InputProps) => {

    return (
        <div className={styles.progressWrapper}>
            <div className={styles.progressLoader}>
                <div className={styles.progressSpin}>
                    <Icon name={'loader'} size={20}/>
                </div>
                <p className={styles.progressTitle}>{title}</p>
            </div>
            <div className={styles.progressContainer}>
                <div className={styles.progressBar}></div>
            </div>
        </div>
    );
};

export default Progress;
