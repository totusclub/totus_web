import styles from './ticketItem.module.css';
import { useRouter } from "next/router";
import Button from "@/components/UI/button";
import Icon from "@/components/icons/Icon";
import TicketModal from "@/components/modals/ticketModal";
import { useState, FC } from "react";

interface TicketItemProps {
    green?: boolean;
}

const TicketItem: FC<TicketItemProps> = ({ green }) => {
    const [open, setOpen] = useState<boolean>(false);
    const router = useRouter();

    const handleClick = () => {
        router.push('/booking');
    };

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

                        {[1, 2].map((_, i) => (
                            <div key={i} className={styles.ticketItemLine}>
                                <div className={styles.ticketItemLineItem}>
                                    <div className={styles.ticketItemLogo}></div>
                                    <div className={styles.ticketItemDate}>
                                        <p>15:55 – 22:15 </p>
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
                                        <p>3ч 10м</p>
                                        <p>EVN–FCO</p>
                                    </div>
                                </div>
                            </div>
                        ))}

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
                            <p>99 143₽</p>
                            <p>За тур с перелётом</p>
                        </div>
                        <Button
                            onClick={handleClick}
                            title="Выбрать"
                            height="40px"
                            full={true}
                        />
                        <div onClick={() => setOpen(true)} className={styles.ticketItemDetails}>
                            <Icon name="info" size={16} />
                            <p>Детали перелёта</p>
                        </div>
                    </div>
                </div>

                {green && (
                    <div className={styles.ticketItemAlert}>
                        <Icon name="light" size={20} color="var(--bgPrimary)" />
                        <p>Самый выгодный рейс к туру</p>
                    </div>
                )}
            </div>

            <TicketModal open={open} setOpen={setOpen} />
        </>
    );
};

export default TicketItem;
