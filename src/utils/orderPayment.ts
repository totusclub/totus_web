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

export function getOrderIdForPay(order: any): string | number | null {
  if (!order) return null;
  return order.order_id ?? order.id ?? order.package?.id ?? null;
}

export function getOrderPayAmount(order: any): number {
  const lt = getLtOrderPackage(order);
  const value =
    lt?.full_price ??
    lt?.remaining_amount ??
    lt?.price ??
    order?.package?.full_price ??
    order?.package?.price ??
    0;
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function canPayWithSbp(order: any): boolean {
  const lt = getLtOrderPackage(order);
  const methods = lt?.payment_methods;
  if (!Array.isArray(methods)) return true;
  const sbp = methods.find((m: { type?: string }) => m?.type === 'sbp');
  return sbp ? sbp.enable !== false : true;
}

export function isOrderAwaitingPayment(order: any): boolean {
  if (!order) return false;

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
