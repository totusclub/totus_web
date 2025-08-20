import React from 'react';
import styles from './tourModal.module.css'
import AppModal from "@/components/UI/modal";
import { format } from "date-fns";
import {ru} from "date-fns/locale";

interface Props {
    checkIn: string;  // "2025-08-26"
    checkOut: string; // "2025-09-02"
}

const DateRange = ({ checkIn, checkOut }: Props) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    // Format: "7 августа, вт"
    const startFormatted = format(start, "d MMMM, EE", { locale: ru });
    const endFormatted = format(end, "d MMMM, EE", { locale: ru });

    return <p>{startFormatted} – {endFormatted}</p>;
};


const TourModel: React.FC = ({open,setOpen,packages}) => {


    // console.log('packages',packages)
    return (
        <AppModal
            isOpen={open}
            onClose={() => setOpen(false)}
            title="Тур"
            width="600px"
        >
            <div className={styles.tourModal}>
                <div className={styles.tourModalItem}>
                    <p>{packages?.hotel?.city}, {packages?.hotel?.country}</p>
                    <p>Курорт</p>
                </div>
                <div className={styles.tourModalItem}>
                    <DateRange checkIn={packages?.dates_info?.check_in} checkOut={packages?.dates_info?.check_out} />
                    <p>Даты перелёта</p>
                </div>
                <div className={styles.tourModalItem}>
                    <p>{packages?.adults_count} взрослый</p>
                    <p>Туристы</p>
                </div>
                <div className={styles.tourModalItem}>
                    <p>{packages?.hotel?.name}</p>
                    <p>Отель</p>
                </div>
                <div className={styles.tourModalItem}>
                    <p>{packages?.room_type}</p>
                    <p>Номер</p>
                </div>
                <div className={styles.tourModalItem}>
                    <p>{packages?.pansion_description}</p>
                    <p>Питание</p>
                </div>
                {/*<div className={styles.tourModalItem}>*/}
                {/*    <p>Включен в стоимость</p>*/}
                {/*    <p>Трансфер</p>*/}
                {/*</div>*/}
                {/*<div className={styles.tourModalItem}>*/}
                {/*    <p>Включена в стоимость</p>*/}
                {/*    <p>Страховка</p>*/}
                {/*</div>*/}
                <div className={styles.tourModalItem}>
                    <p>{packages?.operator?.name}</p>
                    <p>Туроператор</p>
                </div>
            </div>
        </AppModal>
    );
};

export default TourModel;
