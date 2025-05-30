import React from 'react';
import styles from './tourModal.module.css'
import AppModal from "@/components/UI/modal";


const TourModel: React.FC = ({open,setOpen}) => {

    return (
        <AppModal
            isOpen={open}
            onClose={() => setOpen(false)}
            title="Тур"
            width="600px"
        >
            <div className={styles.tourModal}>
                <div className={styles.tourModalItem}>
                    <p>Турция, Белек</p>
                    <p>Курорт</p>
                </div>
                <div className={styles.tourModalItem}>
                    <p>7 августа, чт – 12 августа, вт</p>
                    <p>Даты перелёта</p>
                </div>
                <div className={styles.tourModalItem}>
                    <p>1 взрослый</p>
                    <p>Туристы</p>
                </div>
                <div className={styles.tourModalItem}>
                    <p>Selectum Noa Belek (Ex. Cesars Belek), 5*</p>
                    <p>Отель</p>
                </div>
                <div className={styles.tourModalItem}>
                    <p>Стандартный с видом на окрестности</p>
                    <p>Номер</p>
                </div>
                <div className={styles.tourModalItem}>
                    <p>Ультра всё включено</p>
                    <p>Питание</p>
                </div>
                <div className={styles.tourModalItem}>
                    <p>Включен в стоимость</p>
                    <p>Трансфер</p>
                </div>
                <div className={styles.tourModalItem}>
                    <p>Включена в стоимость</p>
                    <p>Страховка</p>
                </div>
                <div className={styles.tourModalItem}>
                    <p>AnexTour</p>
                    <p>Туроператор</p>
                </div>
            </div>
        </AppModal>
    );
};

export default TourModel;
