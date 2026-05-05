import type { Favorite } from "@/api/favoritesApi";

const LEVEL_CDN = "https://img.cdn.level.travel";

/** Turn Level.Travel relative paths into absolute URLs (same as VerticalSlider / hotel card). */
export function resolveCdnImageUrl(s: string): string {
    const t = (s || "").trim();
    if (!t) return t;
    if (t.startsWith("http://") || t.startsWith("https://")) return t;
    if (t.startsWith("//")) return `https:${t}`;
    return `${LEVEL_CDN}/${t.replace(/^\//, "")}`;
}

/** API / DB may return JSON as string or snake_case keys */
export function coerceHotelDataPayload(raw: unknown): Record<string, unknown> {
    if (raw == null) return {};
    if (typeof raw === "string") {
        try {
            const parsed = JSON.parse(raw) as unknown;
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                return parsed as Record<string, unknown>;
            }
            return {};
        } catch {
            return {};
        }
    }
    if (typeof raw === "object" && !Array.isArray(raw)) {
        return raw as Record<string, unknown>;
    }
    return {};
}

function mergeNestedHotelPayload(data: Record<string, unknown>): Record<string, unknown> {
    const nested = data.hotel;
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
        return { ...data, ...(nested as Record<string, unknown>) };
    }
    return { ...data };
}

function normalizeFavoriteImageSlot(entry: unknown): unknown {
    if (typeof entry === "string") return resolveCdnImageUrl(entry);
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return entry;
    const o = { ...(entry as Record<string, unknown>) };
    for (const k of Object.keys(o)) {
        const v = o[k];
        if (typeof v === "string" && v.length > 0) {
            o[k] = resolveCdnImageUrl(v);
        }
    }
    return o;
}

/**
 * Canonical shape for favorites DB (aligned with totusapp flat `city_name`, full image URLs).
 * Fixes web `references/hotels` payloads: nested `city`/`country`, relative image paths, `...spread` re-nesting.
 */
export function normalizeHotelFavoritePayload(raw: Record<string, unknown>): Record<string, unknown> {
    const out = mergeNestedHotelPayload({ ...raw });

    if (out.city_name == null || String(out.city_name).trim() === "") {
        const city = out.city;
        if (city && typeof city === "object" && !Array.isArray(city)) {
            const c = city as Record<string, unknown>;
            const line = [c.name_ru, c.name, c.name_en].find(
                (x) => typeof x === "string" && String(x).trim().length > 0
            );
            if (typeof line === "string") out.city_name = line;
        } else if (typeof city === "string" && city.trim()) {
            out.city_name = city;
        }
    }

    if (out.country_name == null || String(out.country_name).trim() === "") {
        const country = out.country;
        if (country && typeof country === "object" && !Array.isArray(country)) {
            const ct = country as Record<string, unknown>;
            const line = [ct.name_ru, ct.name, ct.name_en].find(
                (x) => typeof x === "string" && String(x).trim().length > 0
            );
            if (typeof line === "string") {
                out.country_name = line;
            } else if (typeof ct.iso2 === "string" && ct.iso2.trim()) {
                out.country_name = ct.iso2.trim();
            }
        } else if (typeof country === "string" && country.trim()) {
            out.country_name = country;
        }
    }

    if (out.id == null && out.hotel_id != null) {
        out.id = out.hotel_id;
    }

    let imageList: unknown[] | null = null;
    for (const key of ["images", "photos", "gallery", "pictures", "media"] as const) {
        const v = out[key];
        if (Array.isArray(v) && v.length > 0) {
            imageList = v;
            break;
        }
    }

    if (imageList) {
        out.images = imageList.map((slot) => normalizeFavoriteImageSlot(slot));
    }

    const direct = out.image ?? out.cover ?? out.thumbnail ?? out.preview_image;
    if ((!Array.isArray(out.images) || out.images.length === 0) && typeof direct === "string" && direct.length > 4) {
        out.images = [normalizeFavoriteImageSlot({ x500: direct, webp_x620: direct })];
    }

    return out;
}

/** One image entry with only a few URL fields — avoids 413 from huge `references/hotels` payloads. */
function slimImageSlotForFavorite(img: unknown): Record<string, string> {
    if (typeof img === "string") {
        const u = resolveCdnImageUrl(img);
        return { webp_x620: u, x500: u };
    }
    if (!img || typeof img !== "object" || Array.isArray(img)) return {};
    const o = img as Record<string, unknown>;
    const slim: Record<string, string> = {};
    for (const k of ["webp_x620", "webp_x900", "x500", "x900", "x620"] as const) {
        const v = o[k];
        if (typeof v === "string" && v.length > 4) {
            slim[k] = resolveCdnImageUrl(v);
        }
    }
    if (Object.keys(slim).length === 0) {
        const fallback = firstImageUrlFromObject(o);
        if (fallback) slim.x500 = resolveCdnImageUrl(fallback);
    }
    return slim;
}

function slimTagsForFavorite(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    const out: string[] = [];
    for (const t of raw.slice(0, 16)) {
        if (typeof t === "string" && t.trim()) {
            out.push(t.trim().slice(0, 120));
        } else if (t && typeof t === "object" && !Array.isArray(t)) {
            const name = (t as Record<string, unknown>).name;
            if (typeof name === "string" && name.trim()) out.push(name.trim().slice(0, 120));
        }
        if (out.length >= 12) break;
    }
    return out;
}

/**
 * Small JSON body for POST /api/favorites (mobile app hotel objects are tiny; web API is not).
 * Keeps fields the favorites list needs; max 1 image, trimmed tags, short address.
 */
export function buildSlimFavoriteHotelPayload(
    raw: Record<string, unknown>,
    hotelIdNum: number
): Record<string, unknown> {
    const n = normalizeHotelFavoritePayload(raw);
    const id = Number(n.id) > 0 ? Number(n.id) : hotelIdNum;

    const imagesArr = Array.isArray(n.images) ? n.images : [];
    const slim0 = imagesArr.length > 0 ? slimImageSlotForFavorite(imagesArr[0]) : {};
    const images = Object.keys(slim0).length > 0 ? [slim0] : [];

    const name =
        (typeof n.name === "string" && n.name.trim()) ||
        (typeof n.name_ru === "string" && n.name_ru.trim()) ||
        (typeof n.name_en === "string" && n.name_en.trim()) ||
        "Отель";

    const addr = typeof n.address === "string" ? n.address.trim().slice(0, 400) : undefined;

    const payload: Record<string, unknown> = {
        id,
        name,
        name_en: typeof n.name_en === "string" ? n.name_en.trim().slice(0, 200) : undefined,
        name_ru: typeof n.name_ru === "string" ? n.name_ru.trim().slice(0, 200) : undefined,
        city_name: typeof n.city_name === "string" ? n.city_name.trim().slice(0, 120) : undefined,
        country_name: typeof n.country_name === "string" ? n.country_name.trim().slice(0, 120) : undefined,
        stars: n.stars,
        rating: n.rating,
        reviews: n.reviews_count ?? n.reviews,
        reviews_count: n.reviews_count ?? n.reviews,
        address: addr,
        tags: slimTagsForFavorite(n.tags),
        images,
    };

    Object.keys(payload).forEach((k) => {
        const v = payload[k];
        if (v === undefined || v === null) delete payload[k];
        if (Array.isArray(v) && v.length === 0 && k !== "images") delete payload[k];
    });
    if (Array.isArray(payload.images) && payload.images.length === 0) delete payload.images;

    return payload;
}

function firstImageUrlFromObject(o: Record<string, unknown>): string | null {
    const preferred = [
        "webp_x620",
        "webp_x900",
        "x500",
        "x900",
        "x620",
        "x260x150",
        "url",
        "src",
    ] as const;
    for (const k of preferred) {
        const v = o[k];
        if (typeof v === "string" && v.length > 4) return v;
    }
    const http = Object.values(o).find((v) => typeof v === "string" && (v as string).startsWith("http"));
    return typeof http === "string" ? http : null;
}

function collectImageSlots(hotelData: Record<string, unknown>): unknown[] {
    for (const key of ["images", "photos", "gallery", "pictures", "media"]) {
        const v = hotelData[key];
        if (Array.isArray(v) && v.length > 0) return v;
    }
    return [];
}

/** Match `hotelCard` / Level.Travel image shapes (web + app). */
export function pickHotelImageUrl(hotelData: Record<string, unknown>): string | null {
    const slots = collectImageSlots(hotelData);
    const first = slots[0];
    let raw: string | null = null;
    if (typeof first === "string" && first.length > 4) {
        raw = first;
    } else if (first && typeof first === "object" && !Array.isArray(first)) {
        raw = firstImageUrlFromObject(first as Record<string, unknown>);
    }
    if (!raw) {
        const direct = hotelData.image ?? hotelData.cover ?? hotelData.thumbnail ?? hotelData.preview_image;
        if (typeof direct === "string" && direct.length > 4) raw = direct;
    }
    if (!raw) return null;
    return resolveCdnImageUrl(raw);
}

export function pickHotelTitle(hotelData: Record<string, unknown>): string {
    const n =
        (hotelData.name as string) ||
        (hotelData.name_ru as string) ||
        (hotelData.name_en as string) ||
        (hotelData.title as string);
    if (n && String(n).trim()) return String(n).trim();
    const id = hotelData.id;
    if (id != null && id !== "") return `Отель #${id}`;
    return "Отель";
}

export function pickHotelLocationLine(hotelData: Record<string, unknown>): string {
    let city = (hotelData.city_name as string) || "";
    if (!String(city).trim()) {
        const c = hotelData.city;
        if (c && typeof c === "object" && !Array.isArray(c)) {
            const o = c as Record<string, unknown>;
            const line = [o.name_ru, o.name, o.name_en].find(
                (x) => typeof x === "string" && String(x).trim().length > 0
            );
            if (typeof line === "string") city = line;
        } else if (typeof c === "string") {
            city = c;
        }
    }

    let country = (hotelData.country_name as string) || "";
    if (!String(country).trim()) {
        const c = hotelData.country;
        if (c && typeof c === "object" && !Array.isArray(c)) {
            const o = c as Record<string, unknown>;
            const line = [o.name_ru, o.name, o.name_en].find(
                (x) => typeof x === "string" && String(x).trim().length > 0
            );
            if (typeof line === "string") {
                country = line;
            } else if (typeof o.iso2 === "string" && o.iso2.trim()) {
                country = o.iso2.trim();
            }
        } else if (typeof c === "string") {
            country = c;
        }
    }

    return [city, country].map((s) => String(s).trim()).filter(Boolean).join(", ");
}

export function pickHotelSubtitle(hotelData: Record<string, unknown>): string {
    const loc = pickHotelLocationLine(hotelData);
    const stars = hotelData.stars != null ? Number(hotelData.stars) : NaN;
    const rating = hotelData.rating != null ? Number(hotelData.rating) : NaN;
    const reviewsRaw = hotelData.reviews_count ?? hotelData.reviews;
    const reviews = reviewsRaw != null ? Number(reviewsRaw) : NaN;

    const parts: string[] = [];
    if (loc) parts.push(loc);
    if (Number.isFinite(stars) && stars > 0) parts.push(`${stars}★`);
    if (Number.isFinite(rating) && rating > 0) {
        parts.push(Number.isFinite(reviews) && reviews > 0 ? `${rating} · ${reviews} отзывов` : `${rating}`);
    }
    return parts.join(" · ");
}

export function resolveFavoriteHotelId(fav: Favorite, hotelData: Record<string, unknown>): number {
    const fromFav = Number(fav.hotelId);
    if (Number.isFinite(fromFav) && fromFav > 0) return fromFav;
    const fromData = Number(hotelData.id ?? hotelData.hotel_id);
    if (Number.isFinite(fromData) && fromData > 0) return fromData;
    return 0;
}

export type FavoriteDisplay = {
    key: string;
    hotelId: number;
    title: string;
    subtitle: string;
    imageUrl: string | null;
    hotelData: Record<string, unknown>;
};

export function favoriteToDisplay(fav: Favorite): FavoriteDisplay {
    const hotelData = normalizeHotelFavoritePayload(coerceHotelDataPayload(fav.hotelData));
    const hotelId = resolveFavoriteHotelId(fav, hotelData);
    const idPart = Number.isFinite(fav.id) && fav.id > 0 ? String(fav.id) : "x";
    return {
        key: `${hotelId}-${idPart}`,
        hotelId,
        title: pickHotelTitle(hotelData),
        subtitle: pickHotelSubtitle(hotelData),
        imageUrl: pickHotelImageUrl(hotelData),
        hotelData,
    };
}
