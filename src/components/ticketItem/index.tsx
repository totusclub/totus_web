import styles from './ticketItem.module.css';
import { useRouter } from "next/router";
import Button from "@/components/UI/button";
import Icon from "@/components/icons/Icon";
import TicketModal from "@/components/modals/ticketModal";
import { useState, FC } from "react";
import useAuth from "@/hooks/useAuth";
import AuthModal from "@/components/auth";
import { formatRussianDateTime, formatRussianDate, secondsToRussianTime } from "@/utils/dateTimeUtils";
import { formatMoneyRub, getFlightOfferTotal, toMoney } from "@/utils/packagePrice";

interface TicketItemProps {
    green?: boolean;
    item: any
    price?: number
    lazy: boolean
}

const TicketItem: FC<TicketItemProps> = ({ green, item, price, lazy }) => {
    const [open, setOpen] = useState<boolean>(false);
    const router = useRouter();
    const [authModal, setAuthModal] = useState(false)
    const { user, token } = useAuth()

    const basePrice = toMoney(price);
    const fuelCharge = toMoney(item?.fuel_charge);
    const totalPrice = getFlightOfferTotal(basePrice, item);

    const getPlaceName = (place: any) =>
        place?.city?.name || place?.name?.split(',')[0] || place?.name || place?.code || '';

    const formatRoute = (flight: any) => {
        const from = getPlaceName(flight?.origin);
        const to = getPlaceName(flight?.destination);
        if (from && to) return `${from} — ${to}`;
        const fromCode = flight?.origin?.code;
        const toCode = flight?.destination?.code;
        if (fromCode && toCode) return `${fromCode}-${toCode}`;
        return '';
    };

    const getAirportName = (place: any) =>
        place?.code || '';

    const formatAirports = (flight: any) => {
        const from = getAirportName(flight?.origin);
        const to = getAirportName(flight?.destination);
        if (from && to) return `${from} — ${to}`;
        return from || to || '';
    };

    const handleClick = (id) => {
        if (token) {
            // Price comes from Level Travel actualize on booking — not from URL
            router.push({
                pathname: '/booking',
                query: {
                    package: router.query.package,
                    flight_pair_id: id,
                },
            });
        } else {
            setAuthModal(true)
        }
    };

    const classFlight = {
        econom: 'Эконом',
        business: 'Бизнес'
    }
    if (!lazy) {
        return (
            <>
                <div className={green ? styles.ticketItemWrapper : ''}>
                    <div
                        className={styles.ticketItem}
                        style={{ border: green ? 'none' : '1px solid var(--borderTertiary)' }}
                    >
                        <div className={styles.ticketItemInfo}>
                            <div className={styles.ticketItemLine}>
                                <span className={styles.ticketItemDirection} aria-hidden="true">
                                    Туда
                                </span>
                                <div className={styles.ticketItemLineBody}>
                                    <div className={styles.ticketItemLineItem}>
                                        <div className={styles.ticketItemLogo}>
                                            <img src={item?.to?.airline?.logo?.src} alt={item?.to?.airline?.name} />
                                        </div>
                                        <div className={styles.ticketItemDate}>
                                            <p>{formatRussianDateTime(item?.to?.departure)} - {formatRussianDateTime(item?.to?.arrival)}</p>
                                            <p>{formatRussianDate(item?.to?.departure)}</p>
                                        </div>
                                    </div>
                                    <div className={styles.ticketItemLineItem}>
                                        <div className={styles.ticketItemDate}>
                                            <p>{item?.to?.direct ? 'Прямой' : item?.direction}</p>
                                            <p>{item?.to?.airline?.name}</p>
                                        </div>
                                    </div>
                                    <div className={styles.ticketItemLineItem}>
                                        <div className={styles.ticketItemDate}>
                                            <p>{secondsToRussianTime(item?.to?.time)}</p>
                                            <p className={styles.ticketItemRoute}>{formatRoute(item?.to)}</p>
                                            <p className={styles.ticketItemAirport}>{formatAirports(item?.to)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.ticketItemLine}>
                                <span className={styles.ticketItemDirection} aria-hidden="true">
                                    Обратно
                                </span>
                                <div className={styles.ticketItemLineBody}>
                                    <div className={styles.ticketItemLineItem}>
                                        <div className={styles.ticketItemLogo}>
                                            <img src={item?.back?.airline?.logo?.src} alt={item?.back?.airline?.name} />
                                        </div>
                                        <div className={styles.ticketItemDate}>
                                            <p>{formatRussianDateTime(item?.back?.departure)} - {formatRussianDateTime(item?.back?.arrival)}</p>
                                            <p>{formatRussianDate(item?.back?.departure)}</p>
                                        </div>
                                    </div>
                                    <div className={styles.ticketItemLineItem}>
                                        <div className={styles.ticketItemDate}>
                                            <p>{item?.back?.direct ? 'Прямой' : item?.direction}</p>
                                            <p>{item?.back?.airline?.name}</p>
                                        </div>
                                    </div>
                                    <div className={styles.ticketItemLineItem}>
                                        <div className={styles.ticketItemDate}>
                                            <p>{secondsToRussianTime(item?.back?.time)}</p>
                                            <p className={styles.ticketItemRoute}>{formatRoute(item?.back)}</p>
                                            <p className={styles.ticketItemAirport}>{formatAirports(item?.back)}</p>
                                        </div>
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
                                <p>{formatMoneyRub(totalPrice).replace(' ₽', '₽')}</p>
                                <p>Доплаты и сборы: +{formatMoneyRub(fuelCharge).replace(' ₽', '₽')}</p>
                                <p>За тур с перелётом</p>
                            </div>
                            <Button
                                onClick={() => handleClick(item?.flight_pair_id)}
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

                <TicketModal open={open} setOpen={setOpen} item={item} />
                <AuthModal open={authModal} setOpen={setAuthModal} />
            </>
        );
    } else {
        const skeletonContent = (
            <div className={styles.ticketItem} style={{ border: green ? 'none' : '1px solid var(--borderTertiary)' }}>
                {/* Info Section - flex: 1 */}
                <div className={styles.ticketItemInfo}>
                    {/* Badge Section */}
                    <div className={styles.ticketItemBadgeSkeleton}>
                        <div className={styles.animationTaglazy} style={{ width: '90px' }}></div>
                    </div>

                    {/* Outbound Flight Line */}
                    <div className={styles.ticketItemLine}>
                        <span className={styles.ticketItemDirection}>Туда</span>
                        <div className={styles.ticketItemLineBody}>
                            <div className={styles.ticketItemLineItem}>
                                <div className={styles.ticketItemLogo}>
                                    <div className={styles.animationImagelazy} style={{ width: '50px', height: '50px' }}></div>
                                </div>
                                <div className={styles.ticketItemDate}>
                                    <div className={styles.animationTextlazy} style={{ width: '130px', height: '16px' }}></div>
                                    <div className={styles.animationTextlazy} style={{ width: '70px', height: '14px', marginTop: '4px' }}></div>
                                </div>
                            </div>
                            <div className={styles.ticketItemLineItem}>
                                <div className={styles.ticketItemDate}>
                                    <div className={styles.animationTextlazy} style={{ width: '60px', height: '16px' }}></div>
                                    <div className={styles.animationTextlazy} style={{ width: '100px', height: '14px', marginTop: '4px' }}></div>
                                </div>
                            </div>
                            <div className={styles.ticketItemLineItem}>
                                <div className={styles.ticketItemDate}>
                                    <div className={styles.animationTextlazy} style={{ width: '50px', height: '16px' }}></div>
                                    <div className={styles.animationTextlazy} style={{ width: '60px', height: '14px', marginTop: '4px' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Return Flight Line */}
                    <div className={styles.ticketItemLine}>
                        <span className={styles.ticketItemDirection}>Обратно</span>
                        <div className={styles.ticketItemLineBody}>
                            <div className={styles.ticketItemLineItem}>
                                <div className={styles.ticketItemLogo}>
                                    <div className={styles.animationImagelazy} style={{ width: '50px', height: '50px' }}></div>
                                </div>
                                <div className={styles.ticketItemDate}>
                                    <div className={styles.animationTextlazy} style={{ width: '130px', height: '16px' }}></div>
                                    <div className={styles.animationTextlazy} style={{ width: '70px', height: '14px', marginTop: '4px' }}></div>
                                </div>
                            </div>
                            <div className={styles.ticketItemLineItem}>
                                <div className={styles.ticketItemDate}>
                                    <div className={styles.animationTextlazy} style={{ width: '60px', height: '16px' }}></div>
                                    <div className={styles.animationTextlazy} style={{ width: '100px', height: '14px', marginTop: '4px' }}></div>
                                </div>
                            </div>
                            <div className={styles.ticketItemLineItem}>
                                <div className={styles.ticketItemDate}>
                                    <div className={styles.animationTextlazy} style={{ width: '50px', height: '16px' }}></div>
                                    <div className={styles.animationTextlazy} style={{ width: '60px', height: '14px', marginTop: '4px' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Luggage Info List */}
                    <ul>
                        <li><div className={styles.animationTextlazy} style={{ width: '70px', height: '16px' }}></div></li>
                        <li><div className={styles.animationTextlazy} style={{ width: '140px', height: '16px' }}></div></li>
                        <li><div className={styles.animationTextlazy} style={{ width: '120px', height: '16px' }}></div></li>
                        <li><div className={styles.animationTextlazy} style={{ width: '130px', height: '16px' }}></div></li>
                    </ul>
                </div>

                {/* Price Section - 200px width */}
                <div className={styles.ticketItemPriceInfo}>
                    {/* Price Details */}
                    <div className={styles.ticketItemPrice}>
                        <div className={styles.animationTextlazy} style={{ width: '120px', height: '24px' }}></div>
                        <div className={styles.animationTextlazy} style={{ width: '160px', height: '18px', marginTop: '4px' }}></div>
                        <div className={styles.animationTextlazy} style={{ width: '140px', height: '16px', marginTop: '4px' }}></div>
                    </div>

                    {/* Button */}
                    <div className={styles.leazyButton}></div>

                    {/* Details Link */}
                    <div className={styles.ticketItemDetails}>
                        <div className={styles.animationImagelazy} style={{ width: '16px', height: '16px' }}></div>
                        <div className={styles.animationTextlazy} style={{ width: '110px', height: '16px' }}></div>
                    </div>
                </div>
            </div>
        );

        return green ? (
            <div className={styles.ticketItemWrapper}>
                {skeletonContent}
            </div>
        ) : skeletonContent;
    }

};

export default TicketItem;




