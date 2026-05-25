import styles from '../hotelDetails.module.css';
import DatesPrice from "@/components/hotelDetails/hotelDetailsRooms/datesPrice";
import HotelDetailsRoomItem from "@/components/hotelDetails/hotelDetailsRooms/roomItem";
import RoomsSkeleton from "@/components/hotelDetails/hotelDetailsRooms/roomsSkeleton";
import Icon from "@/components/icons/Icon";
import Button from "@/components/UI/button";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useMemo, useState } from "react";
import { createPackage } from "@/api/levelTravelApi";
import { useRouter } from "next/router";
import { findCheapestOfferForStartDate } from "@/utils/hotelDetailsUtils";
import {
    getOfferPriceTitle,
    getSearchTypeFromQuery,
    navigateAfterPackageCreate,
} from "@/utils/bookingFlowUtils";

const HotelLocationMap = dynamic(() => import("./HotelLocationMap"), {
    ssr: false,
    loading: () => <div className={styles.image_placeholder} style={{ width: "100%", height: "100%", minHeight: 160 }} />,
});

export type HotelDetailsMapInfo = {
    lat?: number | null;
    long?: number | null;
    lng?: number | null;
    address?: string;
    name?: string;
    fallbackImage?: string;
};

function resolveHotelCoords(info?: HotelDetailsMapInfo): { lat: number; lng: number } | null {
    if (!info) return null;
    const lat = Number(info.lat);
    const lng = Number(info.long ?? info.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    if (lat === 0 && lng === 0) return null;
    return { lat, lng };
}

interface HotelDetailsRoomsProps {
    rooms: any[];
    loading?: boolean;
    hotelMap?: HotelDetailsMapInfo;
    selectedDate: string;
    onSelectedDateChange: (date: string) => void;
}

const HotelDetailsRooms = ({
    rooms,
    loading = false,
    hotelMap,
    selectedDate,
    onSelectedDateChange,
}: HotelDetailsRoomsProps) => {
    const router = useRouter();
    const searchType = getSearchTypeFromQuery(router.query);
    const [isBooking, setIsBooking] = useState(false);
    const pricesList = useMemo((): Record<string, number> | undefined => {
        if (!rooms?.length) return undefined;

        const grouped: Record<string, number> = {};

        rooms.forEach((room) => {
            const offers = room?.offers || {};
            Object.values(offers).forEach((offerList) => {
                if (!Array.isArray(offerList)) return;
                offerList.forEach((item: { start_date?: string; analytics_price?: number }) => {
                    const { start_date, analytics_price } = item;
                    if (!start_date || analytics_price == null) return;
                    if (
                        grouped[start_date] === undefined ||
                        analytics_price < grouped[start_date]
                    ) {
                        grouped[start_date] = analytics_price;
                    }
                });
            });
        });

        return Object.entries(grouped)
            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
            .reduce<Record<string, number>>((acc, [date, price]) => {
                acc[date] = price;
                return acc;
            }, {});
    }, [rooms]);

    const highlightOffer = useMemo(
        () => findCheapestOfferForStartDate(rooms, selectedDate),
        [rooms, selectedDate]
    );

    const roomTypeName = {
        BB: 'Завтрак',
        RO: 'Без питания',
        AI: 'Всё включено',
        UAI: 'Ультра всё включено',
        HB: 'Завтрак и ужин',
        FB: 'Завтрак, обед, ужин',
        HBD: 'Завтрак и ужин',
        AI24: 'Всё включено 24 часа',
        DNR: 'Ужин',
        AIL: 'Всё включено с ограничениями',
        'FB+': 'Завтрак, обед, ужин +',
        'HB+': 'Завтрак и ужин +',
        HBL: 'Завтрак и обед'
    }



    const handleBook = async (id: any) => {
        setIsBooking(true)
        const res = await createPackage({ request_id: router.query.request_id, tour_id: id })
        // console.log('handleBook', res.package.id)
        setIsBooking(false)
        navigateAfterPackageCreate(router, res.package.id, searchType);
    };

    const formatDate = useMemo(() => {
        if (!highlightOffer?.start_date) return "";
        const date = new Date(highlightOffer.start_date);
        const formatter = new Intl.DateTimeFormat("ru-RU", {
            day: "numeric",
            month: "long",
        });
        return `с ${formatter.format(date)}`;
    }, [highlightOffer?.start_date]);

    const priceFormatted =
        highlightOffer?.price != null
            ? String(highlightOffer.price).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F")
            : "—";

    const hotelCoords = resolveHotelCoords(hotelMap);
    const mapBalloon = [hotelMap?.name, hotelMap?.address].filter(Boolean).join(" — ");

    if (loading) {
        return <RoomsSkeleton />;
    }

    if (!rooms || rooms.length === 0) {
        return (
            <div className={'content'}>
                <div className={styles.HotelDetailsRoomsRow}>
                    <div className={styles.HotelDetailsRooms}>
                        <div className={styles.HotelDetailsRoomsHead}>
                            <p>Номера не найдены</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={'content'}>
            <div className={styles.HotelDetailsRoomsRow}>
                <div className={styles.HotelDetailsRooms}>
                    <div className={styles.HotelDetailsRoomsHead}>
                        <p>Выберите номер</p>
                    </div>
                    <DatesPrice
                        dates={pricesList ?? {}}
                        selectedDate={selectedDate}
                        setSelectedDate={onSelectedDateChange}
                    />
                    {rooms.map((r, i) => (
                        <HotelDetailsRoomItem key={i} item={r} selectedDate={selectedDate} />
                    ))}

                </div>
                <div className={styles.HotelDetailsMap}>
                    <div className={styles.HotelDetailsMapBox}>
                        <div className={styles.HotelDetailsMapBoxTitle}>
                            <Icon name={"location"} size={16} />
                            <p>{hotelMap?.address || "Адрес отеля"}</p>
                        </div>
                        <div className={styles.map}>
                            {hotelCoords ? (
                                <HotelLocationMap
                                    lat={hotelCoords.lat}
                                    lng={hotelCoords.lng}
                                    balloonContent={mapBalloon}
                                />
                            ) : hotelMap?.fallbackImage ? (
                                <Image
                                    className={styles.mapFallbackImg}
                                    src={hotelMap.fallbackImage}
                                    alt={
                                        hotelMap?.name
                                            ? `Схема расположения: ${hotelMap.name}`
                                            : "Расположение отеля"
                                    }
                                    fill
                                    sizes="(max-width: 1200px) 100vw, 420px"
                                />
                            ) : (
                                <p className={styles.mapFallback}>
                                    {hotelMap?.address
                                        ? "Координаты отеля недоступны для карты."
                                        : "Адрес и координаты отеля не указаны."}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={styles.HotelDetailsInfoPrice}>
                        <p className={styles.HotelDetailsInfoPriceText}>от {priceFormatted}₽</p>
                        <div className={styles.HotelDetailsInfoDate}>
                            <p className={styles.HotelDetailsInfoDateTitle}>{getOfferPriceTitle(searchType)}</p>
                            <p className={styles.HotelDetailsInfoDateText}>
                                {formatDate}
                                {highlightOffer?.nights_count != null ? `, ${highlightOffer.nights_count} ночей` : ""}
                            </p>
                        </div>
                        <Button
                            loading={isBooking}
                            disabled={highlightOffer?.id == null}
                            onClick={() => highlightOffer?.id != null && handleBook(highlightOffer.id)}
                            title={"Выбрать номер"}
                            full={true}
                        />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default HotelDetailsRooms;
