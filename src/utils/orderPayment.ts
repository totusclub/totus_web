import { getBookingPriceBreakdown, toMoney } from '@/utils/packagePrice';

/** Level Travel package nested inside DB order row */
export function getLtOrderPackage(order: any) {
  if (!order) return null;
  const root = order.package ?? order;
  if (root?.package?.hotel || root?.package?.dates_info) {
    return root;
  }
  if (root?.hotel || root?.dates_info || root?.payment_methods) {
    return root;
  }
  return root;
}

export function getOrderPaymentPurpose(order: any): string | undefined {
  const lt = getLtOrderPackage(order);
  const value =
    lt?.description_for_client ??
    order?.description_for_client ??
    order?.package?.description_for_client;
  if (value == null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

export function getOrderIdForPay(order: any): string | number | null {
  if (!order) return null;
  return order.order_id ?? order.id ?? order.package?.id ?? null;
}

/**
 * Amount for SBP QR / checkout Итого.
 * Uses Level Travel fields: remaining_amount, full_price, then price + fuel_charge.
 */
export function getOrderPayAmount(order: any): number {
  if (!order) return 0;

  const lt = getLtOrderPackage(order);
  const nested = lt?.package && (lt.package.price != null || lt.package.hotel)
    ? lt.package
    : lt;

  const remaining = toMoney(lt?.remaining_amount ?? order?.remaining_amount);
  if (remaining > 0) return remaining;

  const full = toMoney(
    lt?.full_price ??
      order?.full_price ??
      order?.package?.full_price ??
      nested?.full_price,
  );

  const breakdown = getBookingPriceBreakdown({
    price: toMoney(nested?.price) || toMoney(lt?.price) || toMoney(order?.price),
    net_price: nested?.net_price ?? lt?.net_price,
    fuel_charge:
      toMoney(nested?.fuel_charge) ||
      toMoney(lt?.fuel_charge) ||
      toMoney(order?.fuel_charge),
    predicted_surcharge: nested?.predicted_surcharge ?? lt?.predicted_surcharge,
  });

  const withFees = breakdown.totalPrice;

  // If LT full_price omitted fuel, charge the full breakdown (same as booking Итого)
  if (full > 0 && withFees > 0) return Math.max(full, withFees);
  if (withFees > 0) return withFees;
  if (full > 0) return full;

  // Same fallback as formatOrderPrice — list cards often only have `price`
  return toMoney(
    lt?.price ??
      nested?.price ??
      order?.package?.price ??
      order?.price ??
      lt?._pay_amount ??
      order?.package?._pay_amount,
  );
}

export function canPayWithSbp(order: any): boolean {
  const lt = getLtOrderPackage(order);
  const methods = lt?.payment_methods;
  if (!Array.isArray(methods)) return true;
  const sbp = methods.find((m: { type?: string }) => m?.type === 'sbp');
  return sbp ? sbp.enable !== false : true;
}

export function isOrderCancelled(order: any): boolean {
  if (!order) return false;

  const lt = getLtOrderPackage(order);
  const state = String(
    lt?.state ?? order?.order_state ?? order?.state ?? '',
  ).toLowerCase();

  if (state.includes('cancel')) return true;

  const statusForClient = String(
    lt?.status_for_client ??
    order?.package?.status_for_client ??
    order?.status_for_client ??
    '',
  ).toLowerCase();

  return statusForClient.includes('отмен');
}

export function isOrderAwaitingPayment(order: any): boolean {
  if (!order) return false;
  if (isOrderCancelled(order)) return false;

  const payStatus = String(order.pay_status ?? '').toUpperCase();
  if (payStatus === 'RECONCILED') return false;

  const lt = getLtOrderPackage(order);
  if (lt?.is_paid === true) return false;

  const remaining = lt?.remaining_amount;
  if (typeof remaining === 'number' && remaining <= 0 && payStatus === 'RECONCILED') {
    return false;
  }

  if (lt?.is_paid === false) return true;
  if (payStatus === 'CREATED') return true;

  const status = String(lt?.status_for_client ?? '').toLowerCase();
  if (status.includes('ожидает оплат')) return true;

  return lt?.is_paid !== true && payStatus !== 'RECONCILED';
}

export function getPaymentMethodLabel(order: any): string {
  if (isOrderAwaitingPayment(order) && canPayWithSbp(order)) {
    return 'СБП';
  }
  return 'Банковская карта';
}

/** Flight details from stored order JSON (no /packages/flights — invalid for past orders). */
export function getOrderFlightData(order: any, pkg?: any): any | null {
  if (!order && !pkg) return null;

  const lt = getLtOrderPackage(order);
  const root = lt ?? order;
  const nested = root?.package ?? pkg;

  const flightPairId =
    root?.flight_pair_id ?? nested?.flight_pair_id ?? pkg?.flight_pair_id;

  const direct =
    root?.flight_pair ??
    root?.flight ??
    nested?.flight_pair ??
    nested?.flight ??
    order?.flight_pair ??
    order?.flight;

  if (direct) return direct;

  const flightLists = [root?.flights, nested?.flights, pkg?.flights].filter(
    Array.isArray,
  ) as any[][];

  for (const flights of flightLists) {
    if (flightPairId != null) {
      const match = flights.find(
        (f) => String(f?.flight_pair_id ?? f?.id) === String(flightPairId),
      );
      if (match) return match;
    }
    if (flights.length > 0) return flights[0];
  }

  return null;
}
