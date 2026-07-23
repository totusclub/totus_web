'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './auth.module.css';

const SmartCaptcha = dynamic(
  () => import('@yandex/smart-captcha').then((mod) => mod.SmartCaptcha),
  { ssr: false },
);

const SITEKEY = process.env.NEXT_PUBLIC_YANDEX_SMARTCAPTCHA_SITEKEY || '';

type YandexSmartCaptchaProps = {
  onTokenChange: (token: string) => void;
};

const YandexSmartCaptcha: React.FC<YandexSmartCaptchaProps> = ({
  onTokenChange,
}) => {
  const [resetKey, setResetKey] = useState(0);

  if (!SITEKEY) {
    return (
      <p className={styles.captchaHint}>
        Добавьте NEXT_PUBLIC_YANDEX_SMARTCAPTCHA_SITEKEY в .env.local
      </p>
    );
  }

  return (
    <div className={styles.captchaWrap}>
      <SmartCaptcha
        key={resetKey}
        sitekey={SITEKEY}
        language="ru"
        onSuccess={(token) => onTokenChange(token)}
        onTokenExpired={() => {
          onTokenChange('');
          setResetKey((prev) => prev + 1);
        }}
        onNetworkError={() => onTokenChange('')}
      />
    </div>
  );
};

export default YandexSmartCaptcha;
export { SITEKEY as YANDEX_SMARTCAPTCHA_SITEKEY };
