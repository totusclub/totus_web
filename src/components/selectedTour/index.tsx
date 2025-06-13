import styles from './selectedtour.module.css';
import Icon from "@/components/icons/Icon";
import TourModel from "@/components/modals/tourModal";
import {useState} from "react";




const SelectedTour = ({packages}:any) => {
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
                    <div className={styles.selectedTourImage} style={{backgroundImage: `url(${packages?.room_info?.images?.[0]?.['x260x150']})`}}>
                    </div>
                    <div className={styles.selectedTourInfo}>
                        {/*<ul>*/}
                        {/*    <li>*/}
                        {/*        <Icon name={'hotel'} size={14}/>*/}
                        {/*        <p>Шарм-эль-Шейх, Отель 5*</p>*/}
                        {/*    </li>*/}
                        {/*    <li>*/}
                        {/*        <Icon name={'star'} size={14}/>*/}
                        {/*        <p>5 ･ Превосходно</p>*/}
                        {/*    </li>*/}
                        {/*</ul>*/}
                        <div className={styles.hotelStart}>
                            <Icon name={'star'} size={18}
                                  color={packages?.hotel?.stars >= 1 ? 'var(--core_Orange)' : 'var(--bgSecondary)'}/>
                            <Icon name={'star'} size={18}
                                  color={packages?.hotel?.stars >= 2 ? 'var(--core_Orange)' : 'var(--bgSecondary)'}/>
                            <Icon name={'star'} size={18}
                                  color={packages?.hotel?.stars >= 3 ? 'var(--core_Orange)' : 'var(--bgSecondary)'}/>
                            <Icon name={'star'} size={18}
                                  color={packages?.hotel?.stars >= 4 ? 'var(--core_Orange)' : 'var(--bgSecondary)'}/>
                            <Icon name={'star'} size={18}
                                  color={packages?.hotel?.stars >= 5 ? 'var(--core_Orange)' : 'var(--bgSecondary)'}/>
                        </div>
                        <p className={styles.selectedTourName}>{packages?.hotel?.name}</p>
                        <div className={styles.selectedTourList}>
                            <Icon name={'user'} size={16}/>
                            <p>{packages?.adults_count} взрослых</p>
                        </div>
                        <div className={styles.selectedTourList}>
                            <Icon name={'eays'} size={16}/>
                            <p>{packages?.operator?.name}</p>
                        </div>
                        <div className={styles.selectedTourList}>
                            <Icon name={'hotel'} size={16}/>
                            <p>{packages?.room_info?.name_ru}, «{packages?.pansion_description}»</p>
                        </div>

                    </div>
                    <div className={styles.actualePackage}>
                        <p className={styles.actualePackageLable}>Гарантия лучшей цены</p>
                        <p className={styles.actualePackageTotal}>{packages?.price + packages?.predicted_surcharge}₽</p>
                        <div className={styles.actualePackageParices}>
                            <del>{packages?.price}₽</del>
                            <p>{packages?.price + packages?.predicted_surcharge}₽</p>
                        </div>
                    </div>
                </div>
            </div>
            <TourModel open={open} setOpen={setOpen}/>
        </>


    );
};

export default SelectedTour;
