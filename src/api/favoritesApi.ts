/**
 * Favorites API — same contract as totusapp (`src/modules/api/favorites.ts`),
 * backed by voip server `/api/favorites` routes.
 */

import { coerceHotelDataPayload } from "@/utils/favoriteHotelDisplay";

const FAVORITES_API_BASE =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_FAVORITES_API_URL
        ? process.env.NEXT_PUBLIC_FAVORITES_API_URL
        : "https://voip.totus.club";

export interface Favorite {
    id: number;
    hotelId: number;
    hotelData: Record<string, unknown>;
    createdAt: string;
}

function normalizeFavoriteRow(raw: Record<string, unknown>): Favorite {
    const id = Number(raw.id ?? 0);
    const hotelId = Number(raw.hotelId ?? raw.hotel_id ?? 0);
    const hotelData = coerceHotelDataPayload(raw.hotelData ?? raw.hotel_data);
    const createdAt = String(raw.createdAt ?? raw.created_at ?? "");
    return { id, hotelId, hotelData, createdAt };
}

export async function addFavorite(
    userId: number,
    hotelId: number,
    hotelData: Record<string, unknown>
): Promise<{ id: number; alreadyExists?: boolean }> {
    const response = await fetch(`${FAVORITES_API_BASE}/api/favorites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, hotelId, hotelData }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { error?: string }).error || `Failed to add favorite: ${response.status}`);
    }

    const data = await response.json();
    return data.favorite ?? { id: 0 };
}

export async function removeFavorite(userId: number, hotelId: number): Promise<boolean> {
    const response = await fetch(`${FAVORITES_API_BASE}/api/favorites`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, hotelId }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { error?: string }).error || `Failed to remove favorite: ${response.status}`);
    }

    const data = await response.json();
    return Boolean(data.deleted);
}

export async function getUserFavorites(userId: number): Promise<Favorite[]> {
    const response = await fetch(`${FAVORITES_API_BASE}/api/favorites/${userId}`);
    if (!response.ok) {
        if (response.status === 404) return [];
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
            (errorData as { error?: string }).error || `Failed to fetch favorites: ${response.status}`
        );
    }
    const data = await response.json();
    const list = (data.favorites || []) as Record<string, unknown>[];
    return list.map((row) => normalizeFavoriteRow(row));
}

export async function isFavorite(userId: number, hotelId: number): Promise<boolean> {
    const response = await fetch(`${FAVORITES_API_BASE}/api/favorites/${userId}/${hotelId}`);
    if (!response.ok) {
        if (response.status === 404) return false;
        throw new Error(`Failed to check favorite: ${response.status}`);
    }
    const data = await response.json();
    return Boolean(data.isFavorite);
}
