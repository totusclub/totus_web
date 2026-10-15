import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useAuth from "@/hooks/useAuth";
import { getUserFavorites, removeFavorite, type Favorite } from "@/api/favoritesApi";
import TotusIcon from "@/components/icons/totus/TotusIcon";
import { iconFavoriteFilled } from "@/components/icons/totus/icons.generated";
import { favoriteToDisplay } from "@/utils/favoriteHotelDisplay";
import { buildHotelDetailsDeepLinkQuery } from "@/utils/hotelDetailsUtils";
import styles from "./favorites.module.css";

export default function FavoritesList() {
    const { user } = useAuth();
    const userId = user?.id != null ? Number(user.id) : NaN;

    const [items, setItems] = useState<Favorite[]>([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState<number | null>(null);

    const load = useCallback(async () => {
        if (!Number.isFinite(userId) || userId <= 0) {
            setItems([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const list = await getUserFavorites(userId);
            setItems(list);
        } catch (e) {
            console.error(e);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        load();
    }, [load]);

    const handleRemove = async (e: React.MouseEvent, hotelId: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (!Number.isFinite(userId) || userId <= 0) return;
        if (!window.confirm("Удалить отель из избранного?")) return;
        setRemovingId(hotelId);
        try {
            await removeFavorite(userId, hotelId);
            await load();
        } catch (err) {
            console.error(err);
        } finally {
            setRemovingId(null);
        }
    };

    if (loading) {
        return (
            <div className={styles.wrap}>
                <div className={styles.loading}>Загрузка избранного…</div>
            </div>
        );
    }

    if (!items.length) {
        return (
            <div className={styles.wrap}>
                <div className={styles.head}>
                    <h1>Избранное</h1>
                    <p>Здесь появятся отели, которые вы сохраните на странице отеля.</p>
                </div>
                <div className={styles.empty}>Пока пусто</div>
            </div>
        );
    }

    return (
        <div className={styles.wrap}>
            <div className={styles.head}>
                <h1>Избранное</h1>
                <p>{items.length} отелей</p>
            </div>
            <div className={styles.grid}>
                {items.map((fav) => {
                    const d = favoriteToDisplay(fav);
                    const hotelHref =
                        d.hotelId > 0
                            ? { pathname: "/hotel-details" as const, query: buildHotelDetailsDeepLinkQuery(d.hotelId) }
                            : "#";

                    return (
                        <div key={d.key} className={styles.cardWrap}>
                            <Link href={hotelHref} className={styles.card}>
                                <div className={styles.thumb}>
                                    {d.imageUrl ? (
                                        <Image
                                            src={d.imageUrl}
                                            alt={d.title}
                                            fill
                                            sizes="120px"
                                            unoptimized
                                        />
                                    ) : null}
                                </div>
                                <div className={styles.body}>
                                    <p className={styles.title}>{d.title}</p>
                                    {d.subtitle ? <p className={styles.meta}>{d.subtitle}</p> : null}
                                </div>
                            </Link>
                            <button
                                type="button"
                                className={styles.remove}
                                aria-label="Удалить из избранного"
                                disabled={removingId === d.hotelId || d.hotelId <= 0}
                                onClick={(e) => d.hotelId > 0 && handleRemove(e, d.hotelId)}
                            >
                                <TotusIcon icon={iconFavoriteFilled} size={20} color="#FF3B30" accentColor="#FF3B30" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
