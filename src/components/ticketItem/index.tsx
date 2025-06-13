import styles from './ticketItem.module.css';
import { useRouter } from "next/router";
import Button from "@/components/UI/button";
import Icon from "@/components/icons/Icon";
import TicketModal from "@/components/modals/ticketModal";
import { useState, FC } from "react";

interface TicketItemProps {
    green?: boolean;
    item:any
    price?: number
}

const TicketItem: FC<TicketItemProps> = ({ green,item ,price}) => {
    const [open, setOpen] = useState<boolean>(false);
    const router = useRouter();

    const handleClick = () => {
        router.push('/booking');
    };
    // console.log('item',item)

    function formatRussianDateTime(isoString) {
        // console.log('isoString',isoString)
        const date = new Date(isoString);

        const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Europe/Moscow', // Adjust if needed
        });

        const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
            day: '2-digit',
            month: 'short',
            weekday: 'short',
            timeZone: 'Europe/Moscow',
        });

        const time = timeFormatter.format(date);          // "14:45"
        const datePart = dateFormatter.format(date);      // "20 июл, вс"

        return `${time} ${datePart}`;
    }


    function secondsToRussianTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        const hoursStr = hours > 0 ? `${hours}ч` : '';
        const minutesStr = minutes > 0 ? `${minutes}м` : '';

        return `${hoursStr} ${minutesStr}`.trim();
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
                                <div className={styles.ticketItemLogo}></div>
                                <div className={styles.ticketItemDate}>
                                    <p>{formatRussianDateTime(item?.to?.departure)} - {formatRussianDateTime(item?.to?.arrival)}</p>
                                    <p>Уральские авиалинии</p>
                                </div>
                            </div>
                            <div className={styles.ticketItemLineItem}>
                                <div className={styles.ticketItemDate}>
                                    <p>Прямой</p>
                                    <p>ATH</p>
                                </div>
                            </div>
                            <div className={styles.ticketItemLineItem}>
                                <div className={styles.ticketItemDate}>
                                    <p>{secondsToRussianTime(item?.to?.time)}</p>
                                    <p>EVN–FCO</p>
                                </div>
                            </div>
                        </div>
                        <div className={styles.ticketItemLine}>
                            <div className={styles.ticketItemLineItem}>
                                <div className={styles.ticketItemLogo}></div>
                                <div className={styles.ticketItemDate}>
                                    <p>{formatRussianDateTime(item?.back?.departure)} - {formatRussianDateTime(item?.back?.arrival)}</p>
                                    <p>Уральские авиалинии</p>
                                </div>
                            </div>
                            <div className={styles.ticketItemLineItem}>
                                <div className={styles.ticketItemDate}>
                                    <p>Прямой</p>
                                    <p>ATH</p>
                                </div>
                            </div>
                            <div className={styles.ticketItemLineItem}>
                                <div className={styles.ticketItemDate}>
                                    <p>{secondsToRussianTime(item?.back?.time)}</p>
                                    <p>EVN–FCO</p>
                                </div>
                            </div>
                        </div>


                        <ul>
                            <li>Блочный</li>
                            <li>ЭкономЭконом</li>
                            <li>Ручная кладь 10 кг туда</li>
                            <li>Ручная кладь 5 кг обратно</li>
                            <li>Багаж 10 кг туда</li>
                            <li>Багаж 20 кг обратно</li>
                        </ul>
                    </div>

                    <div className={styles.ticketItemPriceInfo}>
                        <div className={styles.ticketItemPrice}>
                            <p>{price}₽</p>
                            <p>Доплаты и сборы: +{item?.fuel_charge}₽</p>
                            <p>За тур с перелётом</p>
                        </div>
                        <Button
                            onClick={handleClick}
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
        </>
    );
};

export default TicketItem;



