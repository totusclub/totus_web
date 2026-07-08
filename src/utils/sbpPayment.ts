export type SbpPayData = {
  payload: string | null;
  qrcId: string | null;
  image: string | null;
};

export function parseSbpPayResponse(payInfo: any): SbpPayData {
  const data = payInfo?.data ?? payInfo;

  const payload =
    data?.payload ||
    payInfo?.payload ||
    payInfo?.payUrl ||
    payInfo?.object?.payUrl ||
    null;

  const qrcId = data?.qrcId || payInfo?.qrcId || null;

  const image =
    data?.image ||
    data?.qrImage ||
    data?.qrCode ||
    payInfo?.image ||
    null;

  return {
    payload: payload ? String(payload) : null,
    qrcId: qrcId ? String(qrcId) : null,
    image: image ? String(image) : null,
  };
}

export function getSbpQrImageSrc(payload: string | null, image: string | null): string | null {
  if (image) {
    if (image.startsWith('data:') || image.startsWith('http')) {
      return image;
    }
    return `data:image/png;base64,${image}`;
  }

  if (!payload) return null;

  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=${encodeURIComponent(payload)}`;
}

export function isSbpPaymentPaid(response: any): boolean {
  return (
    response?.paid === true ||
    response?.status === 'RECONCILED' ||
    response?.status === 'PAID'
  );
}

export function storeSbpQrcId(orderId: string | number, qrcId: string | null) {
  if (!qrcId || typeof window === 'undefined') return;
  sessionStorage.setItem(`sbp_qrc_${orderId}`, qrcId);
}

export const SBP_DESKTOP_MIN_WIDTH = 1025;

export function isDesktopViewport(width = typeof window !== 'undefined' ? window.innerWidth : 0): boolean {
  return width >= SBP_DESKTOP_MIN_WIDTH;
}
