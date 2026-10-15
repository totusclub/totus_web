import styles from '../hotelDetails.module.css';
import HotelIcon from '@/components/icons/totus/HotelIcon';
import { amenityTextIcon } from '@/components/icons/totus/ltIcons';


const HotelDetailsDesc = ({info,loading}:any) => {

   if(!loading){
       return (
           <div className={'content'}>
               <div>
                   <div className={styles.HotelDetailsDesc}>
                       <div className={styles.HotelDetailsDescHead}>
                           <HotelIcon name="sec-general" size={20} />
                           <p>Описание</p>
                       </div>
                       <div className={styles.HotelDetailsDescText}>
                           <p>{`${info?.short_info}`}</p>
                       </div>
                   </div>
                   {info?.attractions?.length > 1 && (
                       <div className={styles.HotelDetailsDesc}>
                           <div className={styles.HotelDetailsDescHead}>
                               <HotelIcon name="sec-fun" size={20} />
                               <p>Развлечения</p>
                           </div>
                           <div className={styles.HotelDetailsDescItems}>
                               {info?.attractions?.map((item, index) => (
                                   <div key={index} className={styles.HotelDetailsDescItem}>
                                       <HotelIcon name={amenityTextIcon(item)} size={14} />
                                       <p>{item}</p>
                                   </div>
                               ))}
                           </div>
                       </div>
                   )}

                   {info?.territory?.length > 0 && (
                       <div className={styles.HotelDetailsDesc}>
                           <div className={styles.HotelDetailsDescHead}>
                               <HotelIcon name="sec-territory" size={20} />
                               <p>Территория</p>
                           </div>
                           <div className={styles.HotelDetailsDescItems}>
                               {info?.territory?.map((item, index) => (
                                   <div key={index} className={styles.HotelDetailsDescItem}>
                                       <HotelIcon name={amenityTextIcon(item)} size={14} />
                                       <p>{item}</p>
                                   </div>
                               ))}
                           </div>
                       </div>
                   )}

               </div>
           </div>
       );
   } else{
       return (
           <div className={'content'}>
               <div className={styles.HotelDetailsDesc}>
                   <div className={styles.HotelDetailsDescHead}>
                       <div className={styles.animationTextlazy2} style={{width:'30%'}}></div>
                   </div>
                   <div className={styles.HotelDetailsDescText}>
                       <div className={styles.animationTextlazy2} style={{width:'40%'}}></div>
                       <div className={styles.animationTextlazy2} style={{width:'60%'}}></div>
                       <div className={styles.animationTextlazy2} style={{width:'40%'}}></div>
                   </div>
               </div>
           </div>
       )
   }

};

export default HotelDetailsDesc;
