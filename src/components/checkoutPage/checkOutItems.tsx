import React, {useMemo, useState} from "react";
import styles from './checkout.module.css';
import Icon from "@/components/icons/Icon";
import TicketModal from "@/components/modals/ticketModal";


const CheckoutItems = ({order}:any) => {
    const [modalTicket, setModalTicket] = useState<boolean>(false);


    const formatDate = useMemo(()=>{
        if(order){
            const startDate = new Date(order?.package?.dates_info?.start_date);
            const endDate = new Date(order?.package?.dates_info?.end_date);

            const formatter = new Intl.DateTimeFormat("ru-RU", {
                day: "numeric",
                month: "long"
            });

            const weekdayFormatter = new Intl.DateTimeFormat("ru-RU", {
                weekday: "short"
            });

            const startDay = formatter.format(startDate);
            const startWeekday = weekdayFormatter.format(startDate);

            const endDay = formatter.format(endDate);
            const endWeekday = weekdayFormatter.format(endDate);
            return `${startDay}, ${startWeekday} – ${endDay}, ${endWeekday}`;
        }

    },[order])
    return (
        <div className={styles.checkoutItemsWrap}>
            <div className={styles.checkoutMessage}>
                <Icon name={'info'} size={24} color={'var(--core_Orange'} />
                <p>Оплатите заказ в течение II часов</p>
            </div>
            <div className={styles.checkoutItems}>
                <div className={styles.checkoutItemsHead}>
                    <p>Отдыхаем {order?.package?.dates_info?.nights_count} ночей</p>
                </div>
                <div className={styles.checkoutItem}>
                    <div className={styles.checkoutItemHead}>
                        <p>Самое важное</p>
                    </div>
                    <div className={styles.checkoutItemLayout}>
                        <div className={styles.checkoutInfoItem} onClick={() => setModalTicket(true)}>
                            <div className={styles.checkoutItemsList}>
                                <p>Даты перелёта</p>
                                <p>{formatDate}</p>
                            </div>
                            <Icon name={'rightArrow'}/>
                        </div>
                        <div className={styles.checkoutInfoItem}>
                            <div className={styles.checkoutItemsList}>
                                <p>Курорт</p>
                                <p>{order?.package?.hotel?.city}, {order?.package?.hotel?.country}</p>
                            </div>
                            {order?.package?.hotel?.visa?.needed && (
                                <p>Требуется виза</p>
                            )}

                        </div>
                        <div className={styles.checkoutInfoItem}>
                            <div className={styles.checkoutItemsList}>
                                <p>Скорость бронирования</p>
                                <p>Быстрое подтверждение</p>
                            </div>
                            <Icon name={'rightArrow'}/>
                        </div>
                        <div className={styles.checkoutInfoItem}>
                            <div className={styles.checkoutItemsList}>
                                <p>Туроператор</p>
                                <p>{order?.package?.operator?.name}</p>
                            </div>
                            <Icon name={'rightArrow'}/>
                        </div>
                    </div>
                </div>
                <div className={styles.checkoutItem}>
                    <div className={styles.checkoutItemHead}>
                        <p>Кто летит</p>
                    </div>
                    <div className={styles.checkoutItemLayout}>
                        {order?.tourists.map((item) => (
                            <div className={styles.checkoutInfoItem}>
                                <div className={styles.checkoutItemsList}>
                                    <p>{item.name} {item.surname}</p>
                                    <p>{item.birthday}, загран. паспорт {item.passport}</p>
                                </div>
                                <Icon name={'rightArrow'}/>
                            </div>
                        ))}

                    </div>
                </div>
                <div className={styles.checkoutItem}>
                    <div className={styles.checkoutItemHead}>
                        <p>Где живем</p>
                    </div>
                    <div className={styles.checkoutItemLayout}>
                        <div className={styles.checkoutInfoItem}>
                            <div className={styles.checkoutItemsList}>
                                <p>Отель</p>
                                <p>{order?.package?.hotel?.name}</p>
                            </div>
                            <Icon name={'rightArrow'}/>
                        </div>
                        <div className={styles.checkoutInfoItem}>
                            <div className={styles.checkoutItemsList}>
                                <p>Номер</p>
                                <p>{order?.package?.room_info?.name_ru}</p>
                            </div>
                            <Icon name={'rightArrow'}/>
                        </div>
                        <div className={styles.checkoutInfoItem}>
                            <div className={styles.checkoutItemsList}>
                                <p>Питание</p>
                                <p>{order?.package?.pansion_description}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.checkoutItem}>
                    <div className={styles.checkoutItemHead}>
                        <p>А что еще</p>
                    </div>
                    <div className={styles.checkoutItemLayout}>
                        <div className={styles.checkoutInfoItem}>
                            <div className={styles.checkoutItemsList}>
                                <p>Страховка</p>
                                <p>Включена в стоимость</p>
                            </div>
                            <Icon name={'rightArrow'}/>
                        </div>
                        <div className={styles.checkoutInfoItem}>
                            <div className={styles.checkoutItemsList}>
                                <p>Трансфер</p>
                                <p>Не включен в стоимость</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.checkoutItem}>
                    <div className={styles.checkoutItemHead}>
                        <p>Контакты покупателя</p>
                    </div>
                    <div className={styles.checkoutItemLayout}>
                        <div className={styles.checkoutInfoItem}>
                            <div className={styles.checkoutItemsList}>
                                <p>+79057990000</p>
                            </div>
                        </div>
                        <div className={styles.checkoutInfoItem}>
                            <div className={styles.checkoutItemsList}>
                                <p>tokclub@yandex.ru</p>
                            </div>
                        </div>
                    </div>
                    <div className={styles.checkoutMessage}>
                        <Icon name={'info'} size={24} color={'var(--core_Orange'}/>
                        <p>Отправим документы на <span>tokclub@yandex.ru</span></p>
                    </div>
                </div>
            </div>

            <TicketModal open={modalTicket} setOpen={setModalTicket} />

        </div>
    );
};

export default CheckoutItems;
