import styles from './selectedtour.module.css';
import Icon from "@/components/icons/Icon";
import TourModel from "@/components/modals/tourModal";
import {useEffect, useState} from "react";




const SelectedTour = ({packages}:any) => {
    const [open, setOpen] = useState(false);

    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    window.location.reload();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer); // Cleanup
    }, []);
    const formatTime = (seconds) => {
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        return `${m}:${s}`;
    };

  if(packages){
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
                          <p className={styles.actualePackageLable}>Гарантия лучшей цены <Icon name={'help'} size={14}/></p>
                          {/*{analytics_min_price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')}₽*/}
                          <p className={styles.actualePackageTotal}>{(packages?.price + packages?.predicted_surcharge).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')}₽</p>
                          <div className={styles.actualePackageParices}>
                              <del>{packages?.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')}₽</del>
                              <Icon name={'prev'} size={16}/>
                              <p>{(packages?.price + packages?.predicted_surcharge).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')}₽</p>
                          </div>
                          <p className={styles.feesText}>Доплаты и сборы +{packages?.predicted_surcharge.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')}₽</p>
                          <div className={styles.timeDown}>
                              <p>Проверка цены через</p>
                              <Icon name={'time'} size={14}/>
                              <p>{formatTime(timeLeft)}</p>
                          </div>
                      </div>
                  </div>
              </div>
              <TourModel packages={packages} open={open} setOpen={setOpen}/>
          </>
      );
  }  else{
      return (
          <div className={styles.selectedTour}>
              <div className={styles.selectTourLazyImage}>
              </div>
              <div className={styles.hotelStart}>
                  <Icon name={'star'} size={18} color={'#dcdcdc'}/>
                  <Icon name={'star'} size={18} color={'#dcdcdc'}/>
                  <Icon name={'star'} size={18} color={'#dcdcdc'}/>
                  <Icon name={'star'} size={18} color={'#dcdcdc'}/>
                  <Icon name={'star'} size={18} color={'#dcdcdc'}/>
              </div>
              <div className={styles?.animationTextlazy} style={{ width: '40%'}}></div>
              <div className={styles?.animationTextlazy} style={{ width: '60%'}}></div>
              <div className={styles?.animationTextlazy} style={{ width: '30%'}}></div>
          </div>
      )
  }

};

export default SelectedTour;
