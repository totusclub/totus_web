import styles from './ticketItem.module.css';
import { useRouter } from "next/router";
import Button from "@/components/UI/button";
import Icon from "@/components/icons/Icon";
import TicketModal from "@/components/modals/ticketModal";
import { useState, FC } from "react";
import useAuth from "@/hooks/useAuth";
import AuthModal from "@/components/auth";

interface TicketItemProps {
    green?: boolean;
    item:any
    price?: number
}

const TicketItem: FC<TicketItemProps> = ({ green,item ,price}) => {
    const [open, setOpen] = useState<boolean>(false);
    const router = useRouter();
    const [authModal,setAuthModal] = useState(false)
    const {user,token} = useAuth()

    const handleClick = (id) => {
        if(token){
            router.push(`/booking?package=${router.query.package}&flight_pair_id=${id}`);
        }else{
            setAuthModal(true)
        }

    };

    function formatRussianDateTime(isoString) {
        const date = new Date(isoString);

        const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Europe/Moscow', // Adjust if needed
        });

        const time = timeFormatter.format(date);          // "14:45"
        return `${time}`;
    }

   const formatRussianDate =(isoString)=>{
       const date = new Date(isoString);

       const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
           day: '2-digit',
           month: 'short',
           weekday: 'short',
           timeZone: 'Europe/Moscow',
       });
       const datePart = dateFormatter.format(date);
       return `${datePart}`
   }


    function secondsToRussianTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        const hoursStr = hours > 0 ? `${hours}ч` : '';
        const minutesStr = minutes > 0 ? `${minutes}м` : '';

        return `${hoursStr} ${minutesStr}`.trim();
    }

    const classFlight = {
        econom:'Эконом',
        business:'Бизнес'
    }
    return (
        <>
            <div className={green ? styles.ticketItemWrapper : ''}>
                <div
                    className={styles.ticketItem}
                    style={{ border: green ? 'none' : '1px solid var(--borderTertiary)' }}
                >
                    <div className={styles.ticketItemInfo}>
                        <div className={styles.ticketItemBadge}>
                            <p>Лучший выбор</p>
                        </div>


                        <div className={styles.ticketItemLine}>
                            <div className={styles.ticketItemLineItem}>
                                {/*<div className={styles.ticketItemLogo}>*/}
                                {/*    <img src={item?.to?.airline?.logo?.src} alt={item?.to?.airline?.name}/>*/}
                                {/*</div>*/}
                                <div className={styles.ticketItemDate}>
                                    <p>{formatRussianDateTime(item?.to?.departure)} - {formatRussianDateTime(item?.to?.arrival)}</p>
                                    <p>{formatRussianDate(item?.to?.departure)}</p>

                                </div>
                            </div>
                            <div className={styles.ticketItemLineItem}>
                                <div className={styles.ticketItemDate}>
                                    <p>{item.back.direct ? 'Прямой' : item?.direction}</p>
                                    <p>{item?.to?.airline?.name}</p>
                                </div>
                            </div>
                            <div className={styles.ticketItemLineItem}>
                                <div className={styles.ticketItemDate}>
                                    <p>{secondsToRussianTime(item?.to?.time)}</p>
                                    <p>{item.to.origin.code}-{item.to.destination.code}</p>
                                </div>
                            </div>
                        </div>
                        <div className={styles.ticketItemLine}>
                            <div className={styles.ticketItemLineItem}>
                                {/*<div className={styles.ticketItemLogo}>*/}
                                {/*    <img src={item?.back?.airline?.logo?.src} alt={item?.to?.airline?.name}/>*/}
                                {/*</div>*/}
                                <div className={styles.ticketItemDate}>
                                    <p>{formatRussianDateTime(item?.back?.departure)} - {formatRussianDateTime(item?.back?.arrival)}</p>
                                    <p>{formatRussianDate(item?.back?.departure)}</p>

                                </div>
                            </div>
                            <div className={styles.ticketItemLineItem}>
                                <div className={styles.ticketItemDate}>
                                    <p>{item.back.direct ? 'Прямой' : item?.direction}</p>
                                    <p>{item?.back?.airline?.name}</p>
                                </div>
                            </div>
                            <div className={styles.ticketItemLineItem}>
                                <div className={styles.ticketItemDate}>
                                    <p>{secondsToRussianTime(item?.back?.time)}</p>
                                    <p>{item.back.origin.code}-{item.back.destination.code}</p>
                                </div>
                            </div>
                        </div>


                        <ul>
                            <li>{classFlight[item.to.class]}</li>
                            {item?.to?.luggage?.hand?.count > 0 && (
                                <li>Ручная кладь {item?.to?.luggage?.hand?.weight} кг туда</li>
                            )}
                            {item?.back?.luggage?.hand?.count > 0 && (
                                <li>Ручная кладь {item?.back?.luggage?.hand?.weight} кг обратно</li>
                            )}
                            {item?.to?.luggage?.hold?.count > 0 && (
                                <li>Багаж {item?.to?.luggage?.hold?.weight} кг туда</li>
                            )}
                            {item?.to?.luggage?.hold?.count > 0 && (
                                <li>Багаж {item?.to?.luggage?.hold?.weight} кг обратно</li>
                            )}

                        </ul>
                    </div>

                    <div className={styles.ticketItemPriceInfo}>
                        <div className={styles.ticketItemPrice}>
                            <p>{(price + item?.fuel_charge).toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')}₽</p>
                            <p>Доплаты и сборы: +{item?.fuel_charge}₽</p>
                            <p>За тур с перелётом</p>
                        </div>
                        <Button
                            onClick={()=>handleClick(item?.flight_pair_id)}
                            title="Выбрать"
                            height="40px"
                            full={true}
                        />
                        <div onClick={() => setOpen(true)} className={styles.ticketItemDetails}>
                            <Icon name="info" size={16}/>
                            <p>Детали перелёта</p>
                        </div>
                    </div>
                </div>

                {green && (
                    <div className={styles.ticketItemAlert}>
                        <Icon name="light" size={20} color="var(--bgPrimary)"/>
                        <p>Самый выгодный рейс к туру</p>
                    </div>
                )}
            </div>

            <TicketModal open={open} setOpen={setOpen}/>
            <AuthModal open={authModal} setOpen={setAuthModal} />
        </>
    );
};

export default TicketItem;



