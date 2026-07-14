/**
 * Level Travel package / flight price helpers.
 * Source of truth: LT fields only — package.price, package.net_price,
 * package.fuel_charge, package.predicted_surcharge, flight.fuel_charge.
 * No URL/query overrides.
 */

export function toMoney(value: unknown): number {
    const n = typeof value === 'number' ? value : Number(String(value ?? '').replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
}

export function formatMoneyRub(value: unknown): string {
    return `${Math.round(toMoney(value))
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')} ₽`;
}

/** Tour base from LT package (actualize / search). */
export function getPackageBasePrice(pkg: any): number {
    return toMoney(pkg?.price ?? pkg?.net_price);
}

/**
 * Surcharge from LT: prefer package.fuel_charge after flight actualize,
 * else selected flight fuel_charge, else predicted_surcharge.
 */
export function getPackageFees(pkg: any, selectedFlight?: any): number {
    return (
        toMoney(pkg?.fuel_charge) ||
        toMoney(selectedFlight?.fuel_charge) ||
        toMoney(pkg?.predicted_surcharge)
    );
}

/** Tickets list: package.price + this flight's fuel_charge. */
export function getFlightOfferTotal(basePrice: unknown, flight: any): number {
    return toMoney(basePrice) + toMoney(flight?.fuel_charge);
}

/** Cheapest flight total for "от …" on tickets. */
export function getMinFlightOfferTotal(
    basePrice: unknown,
    flights: any[] | null | undefined,
    fallbackSurcharge?: unknown,
): number {
    const base = toMoney(basePrice);
    if (!Array.isArray(flights) || flights.length === 0) {
        return base + toMoney(fallbackSurcharge);
    }
    let min = Infinity;
    for (const flight of flights) {
        const total = getFlightOfferTotal(base, flight);
        if (total < min) min = total;
    }
    return Number.isFinite(min) ? min : base;
}

/**
 * Booking order card breakdown from Level Travel package fields.
 *
 * LT may return either:
 * - price = tour base, fuel_charge = surcharge  → Итого = price + fuel
 * - price already = base + fuel, net_price = base → Итого = price
 */
export function getBookingPriceBreakdown(pkg: any, selectedFlight?: any): {
    basePrice: number;
    fees: number;
    totalPrice: number;
} {
    if (!pkg) {
        return { basePrice: 0, fees: 0, totalPrice: 0 };
    }

    const price = toMoney(pkg.price);
    const net = toMoney(pkg.net_price);
    const fees = getPackageFees(pkg, selectedFlight);

    // price already includes surcharge (matches net + fees)
    if (net > 0 && fees > 0 && Math.abs(net + fees - price) <= 1) {
        return {
            basePrice: net,
            fees,
            totalPrice: price,
        };
    }

    // price is tour base; add fuel / predicted surcharge
    if (fees > 0) {
        return {
            basePrice: price || net,
            fees,
            totalPrice: (price || net) + fees,
        };
    }

    return {
        basePrice: price || net,
        fees: 0,
        totalPrice: price || net,
    };
}
