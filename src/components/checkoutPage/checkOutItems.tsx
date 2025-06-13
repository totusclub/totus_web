import React ,{useState} from "react";
import styles from './checkout.module.css';
import Icon from "@/components/icons/Icon";
import TicketModal from "@/components/modals/ticketModal";






const CheckoutItems = () => {
    const [modalTicket, setModalTicket] = useState<boolean>(false);
    return (
        <div className={styles.checkoutItemsWrap}>
            <div className={styles.checkoutMessage}>
                <Icon name={'info'} size={24} color={'var(--core_Orange'} />
                <p>Оплатите заказ в течение II часов</p>
            </div>
            <div className={styles.checkoutItems}>
                <div className={styles.checkoutItemsHead}>
                    <p>Отдыхаем 8 ночей</p>
                </div>
                <div className={styles.checkoutItem}>
                    <div className={styles.checkoutItemHead}>
                        <p>Самое важное</p>
                    </div>
                    <div className={styles.checkoutItemLayout}>
                        <div className={styles.checkoutInfoItem} onClick={() => setModalTicket(true)}>
                            <div className={styles.checkoutItemsList}>
                                <p>Даты перелёта</p>
                                <p>12 мая, пн - 20 мая, вт</p>
                            </div>
                            <Icon name={'rightArrow'}/>
                        </div>
                        <div className={styles.checkoutInfoItem}>
                            <div className={styles.checkoutItemsList}>
                                <p>Курорт</p>
                                <p>Египет, Сома-Бэй</p>
                            </div>
                            <p>Требуется виза</p>
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
                                <p>Level.Travel</p>
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
                        <div className={styles.checkoutInfoItem}>
                            <div className={styles.checkoutItemsList}>
                                <p>Borisov Ivan</p>
                                <p>22 июля 1984, загран. паспорт 34 4782746</p>
                            </div>
                            <Icon name={'rightArrow'}/>
                        </div>
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
                                <p>Amwaj Beach Club Abu Soma (Ex. Amwaj Blue Beach Resort & Spa - Abu Soma), 4*</p>
                            </div>
                            <Icon name={'rightArrow'}/>
                        </div>
                        <div className={styles.checkoutInfoItem}>
                            <div className={styles.checkoutItemsList}>
                                <p>Номер</p>
                                <p>Стандартный с видом на бассейн</p>
                            </div>
                            <Icon name={'rightArrow'}/>
                        </div>
                        <div className={styles.checkoutInfoItem}>
                            <div className={styles.checkoutItemsList}>
                                <p>Питание</p>
                                <p>Всё включено</p>
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
                                <p>+7 *** *** ** **</p>
                            </div>
                        </div>
                        <div className={styles.checkoutInfoItem}>
                            <div className={styles.checkoutItemsList}>
                                <p>********@gmail.com</p>
                            </div>
                        </div>
                    </div>
                    <div className={styles.checkoutMessage}>
                        <Icon name={'info'} size={24} color={'var(--core_Orange'}/>
                        <p>Отправим документы на <span>********@gmail.com</span></p>
                    </div>
                </div>
            </div>

            <TicketModal open={modalTicket} setOpen={setModalTicket} />

        </div>
    );
};

export default CheckoutItems;
