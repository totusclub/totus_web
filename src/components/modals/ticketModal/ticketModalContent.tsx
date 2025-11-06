import React from 'react';
import styles from './ticketModal.module.css';
import Icon from "@/components/icons/Icon";
import { formatRussianDateTime, formatRussianDate, secondsToRussianTime } from "@/utils/dateTimeUtils";

interface TicketModalContentProps {
    item?: any;
}

const TicketModalContent = ({ item }: TicketModalContentProps) => {

    const classFlight = {
        econom: 'Эконом',
        business: 'Бизнес'
    };

    const renderFlightSection = (flight: any, title: string) => {
        if (!flight) return null;

        return (
            <div className={styles.ticketModalItem} key={title}>
                <div className={styles.ticketModalItemTitle}>
                    <p>{title}</p>
                </div>
                <div className={styles.ticketModalItemAir}>
                    <div className={styles.ticketModalItemAirIcon}>
                        {flight?.airline?.logo?.src && (
                            <img src={flight.airline.logo.src} alt={flight.airline.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        )}
                    </div>
                    <p className={styles.ticketModalItemAirName}>{flight?.airline?.name || ''}</p>
                    {flight?.flight_no && (
                        <div className={styles.ticketModalItemAirCode}>
                            <p>{flight.flight_no}</p>
                        </div>
                    )}
                </div>
                <ul>
                    {flight?.blocked && <li>Блочный</li>}
                    {flight?.class && <li>{classFlight[flight.class as keyof typeof classFlight] || flight.class}</li>}
                    {item?.to?.luggage?.hand?.count > 0 && (
                        <li>Ручная кладь {item.to.luggage.hand.weight} кг туда</li>
                    )}
                    {item?.back?.luggage?.hand?.count > 0 && (
                        <li>Ручная кладь {item.back.luggage.hand.weight} кг обратно</li>
                    )}
                    {item?.to?.luggage?.hold?.count > 0 && (
                        <li>Багаж {item.to.luggage.hold.weight} кг туда</li>
                    )}
                    {item?.back?.luggage?.hold?.count > 0 && (
                        <li>Багаж {item.back.luggage.hold.weight} кг обратно</li>
                    )}
                </ul>
                <div className={styles.ticketModalItemDest}>
                    <div className={styles.ticketModalItemDestStep}>
                        <div className={styles.dotStep}></div>
                        <div className={styles.lineStep}></div>
                        <Icon name={'air'} />
                        <div className={styles.lineStep}></div>
                        <div className={styles.dotStep}></div>
                    </div>
                    <div className={styles.ticketModalItemDestInfo}>
                        {/* Departure */}
                        <div className={styles.ticketModalItemDestLine}>
                            <div className={styles.ticketModalItemDestLineTime}>
                                <p>{formatRussianDateTime(flight.departure)}</p>
                                <p>{flight.origin?.city?.name || flight.origin?.name?.split(',')[0] || ''}</p>
                            </div>
                            <div className={styles.ticketModalItemDestLineTime}>
                                <p>{formatRussianDate(flight.departure)}</p>
                                <p>{flight.origin?.name || ''}</p>
                            </div>
                        </div>
                        {/* Duration */}
                        <div className={styles.ticketModalItemDuretion}>
                            <p>{secondsToRussianTime(flight.time)} в пути{flight.type === 'regular' ? ', регулярный' : ''}</p>
                        </div>
                        {/* Arrival */}
                        <div className={styles.ticketModalItemDestLine}>
                            <div className={styles.ticketModalItemDestLineTime}>
                                <p>{formatRussianDateTime(flight.arrival)}</p>
                                <p>{flight.destination?.city?.name || flight.destination?.name?.split(',')[0] || ''}</p>
                            </div>
                            <div className={styles.ticketModalItemDestLineTime}>
                                <p>{formatRussianDate(flight.arrival)}</p>
                                <p>{flight.destination?.name || ''}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };


    return (
        <>
            <div className={styles.ticketModalItemContent}>
                {item?.to && renderFlightSection(item.to, 'Перелёт туда')}
                {/* Transfer between flights */}
                {item?.to && item?.back && item.to.destination && item.back.origin && item.to.destination.code !== item.back.origin.code && (
                    <div className={styles.ticketModalItemMessage}>
                        <div className={styles.ticketModalItemMessageTitle}>
                            <Icon name={'circle'} />
                            <p>Пересадка, {item.to.destination.city?.name || item.to.destination.name?.split(',')[0] || item.to.destination.name || ''}</p>
                        </div>
                        {item.to.arrival && item.back.departure && (
                            <p>{secondsToRussianTime(Math.floor((new Date(item.back.departure).getTime() - new Date(item.to.arrival).getTime()) / 1000))} обычная пересадка</p>
                        )}
                    </div>
                )}
                {item?.back && renderFlightSection(item.back, 'Перелёт обратно')}
            </div>
            <div className={styles.ticketModalItemAlert}>
                <Icon name={'info'} />
                <p>Указано местное время, багаж на пассажира</p>
            </div>
        </>
    );
};

export default TicketModalContent;

