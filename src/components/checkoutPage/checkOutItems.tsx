import React, { useMemo, useState, useEffect } from "react";
import styles from './checkout.module.css';
import Icon from "@/components/icons/Icon";
import TicketModal from "@/components/modals/ticketModal";
import { Packagesflights } from "@/api/levelTravelApi";

function formatPhoneDisplay(phone: unknown): string {
    const digits = String(phone ?? '').replace(/\D/g, '');
    if (!digits) return '';

    if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
        const n = `7${digits.slice(1)}`;
        return `+${n[0]} (${n.slice(1, 4)}) ${n.slice(4, 7)}-${n.slice(7, 9)}-${n.slice(9, 11)}`;
    }
    if (digits.length === 10) {
        return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
    }
    return digits.startsWith('+') ? String(phone) : `+${digits}`;
}

function getBuyerContacts(
    order: any,
    fromBooking?: { email?: string; phone?: string },
): { email: string; phone: string } {
    // Prefer what user typed on booking screen
    const bookingEmail = String(fromBooking?.email || '').trim();
    const bookingPhone = String(fromBooking?.phone || '').trim();

    const email =
        bookingEmail ||
        order?._customer_email ||
        order?.client?.email ||
        order?.package?.client?.email ||
        order?.email ||
        '';

    const phoneRaw =
        bookingPhone ||
        order?._customer_phone ||
        order?.client?.phone ||
        order?.package?.client?.phone ||
        order?.phone ||
        '';

    return {
        email: String(email || '').trim(),
        phone: formatPhoneDisplay(phoneRaw),
    };
}

function InfoRow({
    label,
    value,
    onClick,
    badge,
}: {
    label: string;
    value?: React.ReactNode;
    onClick?: () => void;
    badge?: string;
}) {
    if (value == null || value === '') return null;

    return (
        <div
            className={`${styles.checkoutInfoItem}${onClick ? ` ${styles.checkoutInfoItemClickable}` : ''}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={
                onClick
                    ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') onClick();
                      }
                    : undefined
            }
        >
            <div className={styles.checkoutItemsList}>
                <p>{label}</p>
                <p>{value}</p>
            </div>
            {badge ? <p className={styles.checkoutBadge}>{badge}</p> : null}
            {onClick ? <Icon name={'rightArrow'} size={16} /> : null}
        </div>
    );
}

const CheckoutItems = ({ order, dataLoading, buyerFromBooking }: any) => {
    const [modalTicket, setModalTicket] = useState<boolean>(false);
    const [flightData, setFlightData] = useState<any>(null);

    const buyerContacts = useMemo(
        () => getBuyerContacts(order, buyerFromBooking),
        [order, buyerFromBooking],
    );
    const pkg = order?.package || order;
    const hotel = pkg?.hotel;
    const nights = pkg?.dates_info?.nights_count ?? pkg?.nights_count;
    const tourists = order?.tourists || [];

    useEffect(() => {
        if (!order) return;

        const orderFlightData =
            order?.package?.flight ||
            order?.package?.flight_pair ||
            order?.flight ||
            order?.flight_pair;

        if (orderFlightData) {
            setFlightData(orderFlightData);
            return;
        }

        const packageId = order?.package?.id || order?.package_id;
        if (!packageId) return;

        Packagesflights({ package_id: packageId })
            .then((response) => {
                const selectedFlight =
                    response?.flights?.find(
                        (flight: any) =>
                            String(flight.flight_pair_id) ===
                            String(order?.package?.flight_pair_id || order?.flight_pair_id),
                    ) || response?.flights?.[0];

                if (selectedFlight) setFlightData(selectedFlight);
            })
            .catch((err) => {
                console.error('Failed to fetch flight data:', err);
            });
    }, [order]);

    const formatDate = useMemo(() => {
        const startRaw = pkg?.dates_info?.start_date || pkg?.start_date;
        const endRaw = pkg?.dates_info?.end_date || pkg?.end_date;
        if (!startRaw || !endRaw) return '';

        const startDate = new Date(startRaw);
        const endDate = new Date(endRaw);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return '';

        const formatter = new Intl.DateTimeFormat('ru-RU', {
            day: 'numeric',
            month: 'long',
        });
        const weekdayFormatter = new Intl.DateTimeFormat('ru-RU', {
            weekday: 'short',
        });

        return `${formatter.format(startDate)}, ${weekdayFormatter.format(startDate)} – ${formatter.format(endDate)}, ${weekdayFormatter.format(endDate)}`;
    }, [pkg]);

    const destination = [hotel?.city, hotel?.country].filter(Boolean).join(', ');
    const roomName =
        pkg?.room_info?.name_ru ||
        pkg?.room_info?.name ||
        pkg?.room_type ||
        '';
    const meal =
        pkg?.pansion_description ||
        pkg?.pansion?.description ||
        pkg?.pansion?.name ||
        pkg?.pansion ||
        '';
    const operatorName = pkg?.operator?.name || order?.operator?.name || '';
    const hotelName = hotel?.name || '';
    const hotelStars = hotel?.stars ? `${hotel.stars}★` : '';

    return (
        <div className={styles.checkoutItemsWrap}>
            <div className={styles.checkoutMessage}>
                <Icon name={'info'} size={24} color={'var(--core_Orange)'} />
                <p>Оплатите заказ в течение 30 минут</p>
            </div>

            {dataLoading && !order ? (
                <div className={styles.checkoutItems}>
                    <div className={styles.checkoutItemsHead}>
                        <p>Загрузка заказа…</p>
                    </div>
                </div>
            ) : null}

            <div className={styles.checkoutItems} style={{ display: order ? undefined : dataLoading ? 'none' : undefined }}>
                <div className={styles.checkoutItemsHead}>
                    <p>{nights ? `Отдыхаем ${nights} ночей` : 'Ваш заказ'}</p>
                </div>

                <div className={styles.checkoutItem}>
                    <div className={styles.checkoutItemHead}>
                        <p>Самое важное</p>
                    </div>
                    <div className={styles.checkoutItemLayout}>
                        <InfoRow
                            label="Даты перелёта"
                            value={formatDate}
                            onClick={flightData ? () => setModalTicket(true) : undefined}
                        />
                        <InfoRow
                            label="Курорт"
                            value={destination}
                            badge={hotel?.visa?.needed ? 'Требуется виза' : undefined}
                        />
                        <InfoRow label="Скорость бронирования" value="Быстрое подтверждение" />
                        <InfoRow label="Туроператор" value={operatorName} />
                    </div>
                </div>

                <div className={styles.checkoutItem}>
                    <div className={styles.checkoutItemHead}>
                        <p>Кто летит</p>
                    </div>
                    <div className={styles.checkoutItemLayout}>
                        {tourists.map((item: any, index: number) => {
                            const passport =
                                item.passport ||
                                item.passport_number ||
                                item.document_number ||
                                '';
                            const fullName = [item.name, item.surname].filter(Boolean).join(' ');
                            const details = [
                                item.birthday,
                                passport ? `загран. паспорт ${passport}` : '',
                            ]
                                .filter(Boolean)
                                .join(', ');

                            return (
                                <div
                                    className={styles.checkoutInfoItem}
                                    key={`${passport || index}-${item?.name}-${item?.surname}`}
                                >
                                    <div className={styles.checkoutItemsList}>
                                        <p>{fullName || `Турист ${index + 1}`}</p>
                                        {details ? <p>{details}</p> : null}
                                    </div>
                                </div>
                            );
                        })}
                        {tourists.length === 0 ? (
                            <div className={styles.checkoutInfoItem}>
                                <div className={styles.checkoutItemsList}>
                                    <p>Туристы</p>
                                    <p>Данные появятся после загрузки заказа</p>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className={styles.checkoutItem}>
                    <div className={styles.checkoutItemHead}>
                        <p>Где живем</p>
                    </div>
                    <div className={styles.checkoutItemLayout}>
                        <InfoRow
                            label="Отель"
                            value={hotelStars ? `${hotelName} · ${hotelStars}` : hotelName}
                        />
                        <InfoRow label="Номер" value={roomName} />
                        <InfoRow label="Питание" value={meal} />
                    </div>
                </div>

                <div className={styles.checkoutItem}>
                    <div className={styles.checkoutItemHead}>
                        <p>А что еще</p>
                    </div>
                    <div className={styles.checkoutItemLayout}>
                        <InfoRow label="Страховка" value="Включена в стоимость" />
                        <InfoRow label="Трансфер" value="Не включен в стоимость" />
                    </div>
                </div>

                <div className={styles.checkoutItem}>
                    <div className={styles.checkoutItemHead}>
                        <p>Контакты покупателя</p>
                    </div>
                    <div className={styles.checkoutItemLayout}>
                        {buyerContacts.phone ? (
                            <div className={styles.checkoutInfoItem}>
                                <div className={styles.checkoutItemsList}>
                                    <p>{buyerContacts.phone}</p>
                                </div>
                            </div>
                        ) : null}
                        {buyerContacts.email ? (
                            <div className={styles.checkoutInfoItem}>
                                <div className={styles.checkoutItemsList}>
                                    <p>{buyerContacts.email}</p>
                                </div>
                            </div>
                        ) : null}
                        {!buyerContacts.phone && !buyerContacts.email ? (
                            <div className={styles.checkoutInfoItem}>
                                <div className={styles.checkoutItemsList}>
                                    <p>Контакты не указаны</p>
                                </div>
                            </div>
                        ) : null}
                    </div>
                    {buyerContacts.email ? (
                        <div className={styles.checkoutMessage}>
                            <Icon name={'info'} size={24} color={'var(--core_Orange)'} />
                            <p>
                                Отправим документы на <span>{buyerContacts.email}</span>
                            </p>
                        </div>
                    ) : null}
                </div>
            </div>

            <TicketModal open={modalTicket} setOpen={setModalTicket} item={flightData} />
        </div>
    );
};

export default CheckoutItems;
