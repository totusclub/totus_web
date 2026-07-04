import { useCallback, useEffect, useRef, useState } from "react";
import { Map, Placemark, YMaps } from "react-yandex-maps";
import styles from "./hotelLocationMap.module.css";

type HotelLocationMapProps = {
    lat: number;
    lng: number;
    balloonContent?: string;
};

const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;

function ExpandIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M8 3H3V8M16 3H21V8M16 21H21V16M8 21H3V16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function CollapseIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M9 9L3 3M15 9L21 3M15 15L21 21M9 15L3 21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default function HotelLocationMap({ lat, lng, balloonContent }: HotelLocationMapProps) {
    const mapRef = useRef<any>(null);
    const [expanded, setExpanded] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    const fitMap = useCallback(() => {
        const map = mapRef.current;
        if (!map?.container?.fitToViewport) return;

        try {
            map.container.fitToViewport();
        } catch {
            // Yandex map may not be ready yet.
        }
    }, []);

    const handleMapRef = useCallback(
        (instance: any) => {
            mapRef.current = instance;
            if (instance) {
                setMapReady(true);
            }
        },
        [],
    );

    useEffect(() => {
        if (!mapReady || !mapRef.current) return;
        mapRef.current.setCenter([lat, lng], 15);
    }, [lat, lng, mapReady]);

    useEffect(() => {
        if (!mapReady) return;

        const timers = [0, 150, 400].map((delay) =>
            window.setTimeout(fitMap, delay),
        );

        return () => {
            timers.forEach((timer) => window.clearTimeout(timer));
        };
    }, [expanded, mapReady, fitMap, lat, lng]);

    useEffect(() => {
        if (!expanded) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setExpanded(false);
            }
        };

        window.addEventListener("keydown", onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [expanded]);

    return (
        <div className={`${styles.mapRoot} ${expanded ? styles.mapRootExpanded : ""}`}>
            <button
                type="button"
                className={styles.fullscreenButton}
                aria-label={expanded ? "Закрыть карту на весь экран" : "Открыть карту на весь экран"}
                aria-pressed={expanded}
                onClick={() => setExpanded((prev) => !prev)}
            >
                {expanded ? <CollapseIcon /> : <ExpandIcon />}
            </button>

            <div className={styles.mapSurface}>
                <YMaps
                    query={{
                        lang: "ru_RU",
                        ...(apiKey ? { apikey: apiKey } : {}),
                    }}
                >
                    <Map
                        instanceRef={handleMapRef}
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
            </div>
        </div>
    );
}
