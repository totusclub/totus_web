import { useEffect, useState } from 'react';
import { isDesktopViewport, SBP_DESKTOP_MIN_WIDTH } from '@/utils/sbpPayment';

export function useIsDesktop(minWidth = SBP_DESKTOP_MIN_WIDTH) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsDesktop(window.innerWidth >= minWidth);
    };

    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [minWidth]);

  return isDesktop;
}
