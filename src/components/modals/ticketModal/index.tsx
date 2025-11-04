import React from 'react';
import styles from './ticketModal.module.css'
import AppModal from "@/components/UI/modal";
import Icon from "@/components/icons/Icon";


interface TicketModalProps {
    open?: boolean;
    setOpen?: (open: boolean) => void;
}

const TicketModal= ({open, setOpen}:TicketModalProps) => {

    return (
        <AppModal
            isOpen={open}
            onClose={() => setOpen(false)}
            title="Детали перелёта"
            subTitle={'В пути 33ч 0м'}
            width="600px"
        >
            <div className={styles.ticketModalItem}>
                <div className={styles.ticketModalItemTitle}>
                    <p>Перелёт туда</p>
                </div>
                <div className={styles.ticketModalItemAir}>
                    <div className={styles.ticketModalItemAirIcon}></div>
                    <p className={styles.ticketModalItemAirName}>Gulf Air</p>
                    <div className={styles.ticketModalItemAirCode}>
                        <p>Airbus A321-100/200</p>
                    </div>
                </div>
                <ul>
                    <li>Блочный</li>
                    <li>Эконом</li>
                    <li>Ручная кладь 10 кг туда</li>
                    <li>Ручная кладь 5 кг обратно</li>
                    <li>Багаж 10 кг туда</li>
                    <li>Багаж 20 кг обратно</li>
                </ul>
                <div className={styles.ticketModalItemDest}>
                    <div className={styles.ticketModalItemDestStep}>
                        <div className={styles.dotStep}></div>
                        <div className={styles.lineStep}></div>
                        <Icon name={'air'}/>
                        <div className={styles.lineStep}></div>
                        <div className={styles.dotStep}></div>
                    </div>
                    <div className={styles.ticketModalItemDestInfo}>
                        <div className={styles.ticketModalItemDestLine}>
                            <div className={styles.ticketModalItemDestLineTime}>
                                <p>16:10</p>
                                <p>Москва</p>
                            </div>
                            <div className={styles.ticketModalItemDestLineTime}>
                                <p>7 авг, чт</p>
                                <p>Домодедово, DME</p>
                            </div>
                        </div>
                        <div className={styles.ticketModalItemDuretion}>
                            <p>6ч 15м в пути, регулярный</p>
                        </div>
                        <div className={styles.ticketModalItemDestLine}>
                            <div className={styles.ticketModalItemDestLineTime}>
                                <p>22:25</p>
                                <p>Мухаррак</p>
                            </div>
                            <div className={styles.ticketModalItemDestLineTime}>
                                <p>7 авг, чт</p>
                                <p>Бахрейн Международный, BAH</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.ticketModalItemMessage}>
                    <div className={styles.ticketModalItemMessageTitle}>
                        <Icon name={'circle'}/>
                        <p>Пересадка, Мухаррак</p>
                    </div>
                    <p>23ч 0м обычная пересадка</p>
                </div>

            </div>
            <div className={styles.ticketModalItem}>
                <div className={styles.ticketModalItemTitle}>
                    <p>Перелёт обратно</p>
                </div>
                <div className={styles.ticketModalItemAir}>
                    <div className={styles.ticketModalItemAirIcon}></div>
                    <p className={styles.ticketModalItemAirName}>Gulf Air</p>
                    <div className={styles.ticketModalItemAirCode}>
                        <p>Airbus A321-100/200</p>
                    </div>
                </div>
                <ul>
                    <li>Блочный</li>
                    <li>Эконом</li>
                    <li>Ручная кладь 10 кг туда</li>
                    <li>Ручная кладь 5 кг обратно</li>
                    <li>Багаж 10 кг туда</li>
                    <li>Багаж 20 кг обратно</li>
                </ul>
                <div className={styles.ticketModalItemDest}>
                    <div className={styles.ticketModalItemDestStep}>
                        <div className={styles.dotStep}></div>
                        <div className={styles.lineStep}></div>
                        <Icon name={'air'}/>
                        <div className={styles.lineStep}></div>
                        <div className={styles.dotStep}></div>
                    </div>
                    <div className={styles.ticketModalItemDestInfo}>
                        <div className={styles.ticketModalItemDestLine}>
                            <div className={styles.ticketModalItemDestLineTime}>
                                <p>16:10</p>
                                <p>Москва</p>
                            </div>
                            <div className={styles.ticketModalItemDestLineTime}>
                                <p>7 авг, чт</p>
                                <p>Домодедово, DME</p>
                            </div>
                        </div>
                        <div className={styles.ticketModalItemDuretion}>
                            <p>6ч 15м в пути, регулярный</p>
                        </div>
                        <div className={styles.ticketModalItemDestLine}>
                            <div className={styles.ticketModalItemDestLineTime}>
                                <p>22:25</p>
                                <p>Мухаррак</p>
                            </div>
                            <div className={styles.ticketModalItemDestLineTime}>
                                <p>7 авг, чт</p>
                                <p>Бахрейн Международный, BAH</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.ticketModalItemAlert}>
                    <Icon name={'info'}/>
                    <p>Указано местное время, багаж на пассажира</p>
                </div>

            </div>
        </AppModal>
    );
};

export default TicketModal;
