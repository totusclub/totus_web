import { useCallback, useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { addFavorite, isFavorite as checkFavorite, removeFavorite } from "@/api/favoritesApi";
import HeartIcon from "@/components/icons/heart";
import { buildSlimFavoriteHotelPayload } from "@/utils/favoriteHotelDisplay";

/** Small body for voip `/api/favorites` — full `references/hotels` JSON hits 413 Payload Too Large. */
function buildHotelPayload(hotelIdNum: number, hotelData: Record<string, unknown> | null | undefined) {
    if (!hotelData || typeof hotelData !== "object") {
        return { id: hotelIdNum, name: "Отель" } as Record<string, unknown>;
    }
    return buildSlimFavoriteHotelPayload(hotelData, hotelIdNum);
}

type HotelFavoriteButtonProps = {
    hotelId: string | number | undefined | null;
    hotelData: Record<string, unknown> | null | undefined;
    onNeedAuth?: () => void;
    className?: string;
    iconSize?: number;
    /** Muted icon when not logged in (header on non–hotel pages) */
    inactive?: boolean;
};

export default function HotelFavoriteButton({
    hotelId,
    hotelData,
    onNeedAuth,
    className,
    iconSize = 24,
    inactive = false,
}: HotelFavoriteButtonProps) {
    const { user, token } = useAuth();
    const userId = user?.id != null ? Number(user.id) : NaN;
    const hotelIdNum = hotelId != null && hotelId !== "" ? parseInt(String(hotelId), 10) : NaN;

    const [favorited, setFavorited] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checked, setChecked] = useState(false);

    const canUse = Number.isFinite(userId) && userId > 0 && Number.isFinite(hotelIdNum) && hotelIdNum > 0 && Boolean(token);

    useEffect(() => {
        if (!canUse) {
            setFavorited(false);
            setChecked(true);
            return;
        }
        let cancelled = false;
        setChecked(false);
        (async () => {
            try {
                const ok = await checkFavorite(userId, hotelIdNum);
                if (!cancelled) setFavorited(ok);
            } catch {
                if (!cancelled) setFavorited(false);
            } finally {
                if (!cancelled) setChecked(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [canUse, userId, hotelIdNum]);

    const toggle = useCallback(async () => {
        if (inactive) return;
        if (!canUse) {
            onNeedAuth?.();
            return;
        }
        if (loading || !checked) return;
        setLoading(true);
        try {
            if (favorited) {
                await removeFavorite(userId, hotelIdNum);
                setFavorited(false);
            } else {
                const payload = buildHotelPayload(hotelIdNum, hotelData);
                await addFavorite(userId, hotelIdNum, payload);
                setFavorited(true);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [inactive, canUse, onNeedAuth, loading, checked, favorited, userId, hotelIdNum, hotelData]);

    const activeColor = favorited ? "#FF3B30" : "var(--textPrimary)";
    const color = inactive ? "var(--textTertiary)" : activeColor;

    return (
        <button
            type="button"
            className={className}
            aria-pressed={favorited}
            aria-label={favorited ? "Удалить из избранного" : "Добавить в избранное"}
            disabled={loading}
            onClick={toggle}
            style={{
                cursor: inactive ? "default" : loading ? "wait" : "pointer",
                border: "none",
                background: "transparent",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: loading ? 0.6 : 1,
            }}
        >
            <HeartIcon width={iconSize} height={iconSize} color={color} filled={favorited && !inactive} />
        </button>
    );
}
