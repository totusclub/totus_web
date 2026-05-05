import { Map, Placemark, YMaps } from "react-yandex-maps";

type HotelLocationMapProps = {
    lat: number;
    lng: number;
    balloonContent?: string;
    };

const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;

/**
 * Yandex Map centered on the hotel. Uses optional NEXT_PUBLIC_YANDEX_MAPS_API_KEY for API quotas.
 */
export default function HotelLocationMap({ lat, lng, balloonContent }: HotelLocationMapProps) {
    return (
        <YMaps
            query={{
                lang: "ru_RU",
                ...(apiKey ? { apikey: apiKey } : {}),
            }}
        >
            <Map
                defaultState={{
                    center: [lat, lng],
                    zoom: 15,
                    controls: ["zoomControl"],
                }}
                width="100%"
                height="100%"
                modules={["control.ZoomControl"]}
            >
                <Placemark
                    geometry={[lat, lng]}
                    properties={{
                        balloonContent: balloonContent ?? "",
                        hintContent: balloonContent ?? "",
                    }}
                    modules={["geoObject.addon.balloon", "geoObject.addon.hint"]}
                />
            </Map>
        </YMaps>
    );
}
