import styles from './ticketItem.module.css';
import { useRouter } from "next/router";
import Button from "@/components/UI/button";
import Icon from "@/components/icons/Icon";
import TicketModal from "@/components/modals/ticketModal";
import { useState, FC } from "react";
import useAuth from "@/hooks/useAuth";
import AuthModal from "@/components/auth/LazyAuthModal";
import { formatRussianDateTime, formatRussianDate, secondsToRussianTime } from "@/utils/dateTimeUtils";
import { formatMoneyRub, getFlightOfferTotal, toMoney } from "@/utils/packagePrice";

interface TicketItemProps {
    green?: boolean;
    item: any
    price?: number
    lazy: boolean
    /** id пакета после актуализации на /tickets: перелёты списка принадлежат ему, а не id из адреса. */
    packageId?: number | string | null
}

const TicketItem: FC<TicketItemProps> = ({ green, item, price, lazy, packageId }) => {
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
                    // LT при актуализации может выдать пакету новый id — flight_pair_id из этого
                    // списка относится к нему; со старым id бронирование получает чужой перелёт.
                    package: packageId ?? router.query.package,
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

    // У рейса с пересадкой `item.direction` от API может не прийти — тогда строка была пустой.
    const transferLabel = (flight: any, lower = false) =>
        flight?.direct ? 'Прямой' : (item?.direction || (lower ? 'с пересадкой' : 'С пересадкой'));

    // Багаж «обратно» — из обратного рейса (раньше брался вес и наличие багажа «туда»).
    const luggageTags = item ? (
        <>
            <li>{classFlight[item?.to?.class]}</li>
            {item?.to?.luggage?.hand?.count > 0 && (
                <li>Ручная кладь {item?.to?.luggage?.hand?.weight} кг туда</li>
            )}
            {item?.back?.luggage?.hand?.count > 0 && (
                <li>Ручная кладь {item?.back?.luggage?.hand?.weight} кг обратно</li>
            )}
            {item?.to?.luggage?.hold?.count > 0 && (
                <li>Багаж {item?.to?.luggage?.hold?.weight} кг туда</li>
            )}
            {item?.back?.luggage?.hold?.count > 0 && (
                <li>Багаж {item?.back?.luggage?.hold?.weight} кг обратно</li>
            )}
        </>
    ) : null;

    /**
     * Телефон и планшет (до 1024 px) — вариант B «Билет» (утверждён 12.10.2026, артефакт «Билеты на телефоне»):
     * сегмент рейса как в билете — логотип, «Туда · дата», авиакомпания; крупно время вылета и прилёта,
     * между ними длительность и «Прямой / с пересадкой»; ниже аэропорты и города.
     */
    const renderMobileSegment = (flight: any, label: string) => (
        <div className={styles.mobSeg}>
            <div className={styles.mobSegHead}>
                {flight?.airline?.logo?.src ? (
                    <img className={styles.mobSegLogo} src={flight.airline.logo.src} alt="" loading="lazy" decoding="async" />
                ) : (
                    <span className={styles.mobSegLogo} aria-hidden="true" />
                )}
                <b>{label}</b>
                <span>{formatRussianDate(flight?.departure)}</span>
                <span className={styles.mobSegAirline}>{flight?.airline?.name}</span>
            </div>
            <div className={styles.mobSegTimes}>
                <b>{formatRussianDateTime(flight?.departure)}</b>
                <div className={styles.mobSegMid}>
                    <span>{secondsToRussianTime(flight?.time)}</span>
                    <i aria-hidden="true" />
                    <span className={flight?.direct ? styles.mobSegDirect : undefined}>{transferLabel(flight, true)}</span>
                </div>
                <b>{formatRussianDateTime(flight?.arrival)}</b>
            </div>
            <div className={styles.mobSegPlaces}>
                <span>{[flight?.origin?.code, getPlaceName(flight?.origin)].filter(Boolean).join(' · ')}</span>
                <span>{[getPlaceName(flight?.destination), flight?.destination?.code].filter(Boolean).join(' · ')}</span>
            </div>
        </div>
    );

    if (!lazy) {
        return (
            <>
                <div className={`${green ? styles.ticketItemWrapper : ''} ${styles.ticketDesktop}`}>
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
                                            <img src={item?.to?.airline?.logo?.src} alt={item?.to?.airline?.name} loading="lazy" decoding="async" />
                                        </div>
                                        <div className={styles.ticketItemDate}>
                                            <p>{formatRussianDateTime(item?.to?.departure)} - {formatRussianDateTime(item?.to?.arrival)}</p>
                                            <p>{formatRussianDate(item?.to?.departure)}</p>
                                        </div>
                                    </div>
                                    <div className={styles.ticketItemLineItem}>
                                        <div className={styles.ticketItemDate}>
                                            <p>{transferLabel(item?.to)}</p>
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
                                            <img src={item?.back?.airline?.logo?.src} alt={item?.back?.airline?.name} loading="lazy" decoding="async" />
                                        </div>
                                        <div className={styles.ticketItemDate}>
                                            <p>{formatRussianDateTime(item?.back?.departure)} - {formatRussianDateTime(item?.back?.arrival)}</p>
                                            <p>{formatRussianDate(item?.back?.departure)}</p>
                                        </div>
                                    </div>
                                    <div className={styles.ticketItemLineItem}>
                                        <div className={styles.ticketItemDate}>
                                            <p>{transferLabel(item?.back)}</p>
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
                            <ul>{luggageTags}</ul>
                        </div>

                        <div className={styles.ticketItemPriceInfo}>
                            <div className={styles.ticketItemPrice}>
                                <p>{formatMoneyRub(totalPrice)}</p>
                                <p>Доплаты и сборы: +{formatMoneyRub(fuelCharge)}</p>
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
                            <Icon name="bestPrice" size={20} color="var(--bgPrimary)" accent={false} />
                            <p>Самый выгодный рейс к туру</p>
                        </div>
                    )}
                </div>

                <div className={styles.mob}>
                    {green && (
                        <div className={styles.mobBadge}>
                            <Icon name="bestPrice" size={16} color="#0b3b2e" accent={false} />
                            <span>Самый выгодный рейс к туру</span>
                        </div>
                    )}
                    <div className={styles.mobBody}>
                        {renderMobileSegment(item?.to, 'Туда')}
                        {renderMobileSegment(item?.back, 'Обратно')}
                        <ul className={styles.mobTags}>{luggageTags}</ul>
                    </div>
                    <div className={styles.mobStub}>
                        <div className={styles.mobFoot}>
                            <div className={styles.mobPrice}>
                                <b>{formatMoneyRub(totalPrice)}</b>
                                <span>Доплаты и сборы +{formatMoneyRub(fuelCharge)} · за тур с перелётом</span>
                            </div>
                            <div className={styles.mobChoose}>
                                <Button
                                    onClick={() => handleClick(item?.flight_pair_id)}
                                    title="Выбрать"
                                    height="44px"
                                    width="100%"
                                    br={22}
                                />
                            </div>
                        </div>
                        <button type="button" onClick={() => setOpen(true)} className={styles.mobDetails}>
                            <Icon name="info" size={16} />
                            <span>Детали перелёта</span>
                        </button>
                    </div>
                </div>

                {/* Окно деталей монтируется только при открытии — не по экземпляру react-modal на каждый рейс */}
                {open && <TicketModal open={open} setOpen={setOpen} item={item} />}
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

        // Телефон и планшет: заглушка той же формы, что и карточка варианта B (список не прыгает)
        const mobileSkeleton = (
            <div className={styles.mob} aria-hidden="true">
                <div className={styles.mobBody}>
                    {[0, 1].map((i) => (
                        <div key={i} className={styles.mobSeg}>
                            <div className={styles.animationTextlazy} style={{ width: '70%', height: '18px', marginTop: 0 }}></div>
                            <div className={styles.animationTextlazy} style={{ width: '100%', height: '24px', marginTop: 0 }}></div>
                            <div className={styles.animationTextlazy} style={{ width: '85%', height: '16px', marginTop: 0 }}></div>
                        </div>
                    ))}
                    <div className={styles.mobTags}>
                        <div className={styles.animationTextlazy} style={{ width: '64px', height: '24px', marginTop: 0 }}></div>
                        <div className={styles.animationTextlazy} style={{ width: '140px', height: '24px', marginTop: 0 }}></div>
                    </div>
                </div>
                <div className={styles.mobStub}>
                    <div className={styles.mobFoot}>
                        <div className={styles.mobPrice}>
                            <div className={styles.animationTextlazy} style={{ width: '120px', height: '24px', marginTop: 0 }}></div>
                            <div className={styles.animationTextlazy} style={{ width: '180px', height: '16px', marginTop: 4 }}></div>
                        </div>
                        <div className={styles.leazyButton} style={{ width: '132px', height: '44px', borderRadius: '22px', marginTop: 0 }}></div>
                    </div>
                </div>
            </div>
        );

        return (
            <>
                {green ? (
                    <div className={`${styles.ticketItemWrapper} ${styles.ticketDesktop}`}>
                        {skeletonContent}
                    </div>
                ) : (
                    <div className={styles.ticketDesktop}>{skeletonContent}</div>
                )}
                {mobileSkeleton}
            </>
        );
    }

};

export default TicketItem;




