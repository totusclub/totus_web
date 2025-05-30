import styles from './selectedtour.module.css';
import Icon from "@/components/icons/Icon";
import TourModel from "@/components/modals/tourModal";
import {useState} from "react";




const SelectedTour = () => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <div className={styles.selectedTour}>
                <div className={styles.selectedTourHead}>
                    <div className={styles.selectedTourCheck}>
                        <Icon name={'check'} size={24} color={'var(--secondary_green)'}/>
                        <p>Выбранный тур</p>
                    </div>
                    <div onClick={()=>setOpen(true)} className={styles.selectedTourMore}>
                        <Icon name={'info'} size={16}/>
                        <p>Подробнее</p>
                    </div>
                </div>
                <div className={styles.selectedTourBody}>
                    <div className={styles.selectedTourImage}></div>
                    <div className={styles.selectedTourInfo}>
                        <ul>
                            <li>
                                <Icon name={'hotel'} size={14}/>
                                <p>Шарм-эль-Шейх, Отель 5*</p>
                            </li>
                            <li>
                                <Icon name={'star'} size={14}/>
                                <p>5 ･ Превосходно</p>
                            </li>
                        </ul>
                        <p className={styles.selectedTourName}>Atlantis The Palm</p>
                        <div className={styles.selectedTourList}>
                            <Icon name={'user'} size={16}/>
                            <p>2 взрослых</p>
                        </div>
                        <div className={styles.selectedTourList}>
                            <Icon name={'eays'} size={16}/>
                            <p>Level.Trave</p>
                        </div>
                        <div className={styles.selectedTourList}>
                            <Icon name={'hotel'} size={16}/>
                            <p>Номер Palm King, питание «Завтрак»</p>
                        </div>

                    </div>
                </div>
            </div>
            <TourModel open={open} setOpen={setOpen} />
        </>


    );
};

export default SelectedTour;
