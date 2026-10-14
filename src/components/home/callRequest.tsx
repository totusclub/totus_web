import React, { useState } from 'react';
import styles from "./home.module.css";
import PhoneInputField from "@/components/UI/phoneInputField";
import { submitCallbackRequest } from "@/api/callbackRequestApi";
import { useNearViewport } from "@/hooks/useNearViewport";
import ConsentCheckbox, { ConsentHint, ConsentPdText } from "@/components/UI/consentCheckbox";


export default function CallRequest(): JSX.Element {
    const [phone, setPhone] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    // Согласие на обработку персональных данных — отдельный чекбокс, не отмечен по умолчанию (152-ФЗ, ст. 9).
    const [pdConsent, setPdConsent] = useState(false);
    // Фоновая картинка girl.png (~190 КБ) — только когда блок рядом с экраном; градиент слоя — CSS
    const [blockRef, blockVisible] = useNearViewport<HTMLDivElement>();

    const phoneValid = /^7\d{10}$/.test(phone);
    const isValid = phoneValid && pdConsent;

    const handleSubmit = async () => {
        if (!isValid || submitting) return;

        try {
            setSubmitting(true);
            await submitCallbackRequest(phone, { pd: true });
            setSubmitted(true);
            setPhone('');
            setPdConsent(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Не удалось отправить запрос';
            alert(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={'content'}>
            <div className={styles.callRequest} ref={blockRef}>
                <div className={styles.callRequestLeyer}>
                </div>
                <div className={styles.callRequestInfo}>
                    <div className={styles.formRequestCall}>
                        <div className={styles.formRequestCallHead}>
                            <p>Оставьте свой номер телефона</p>
                            <p>и наши специалисты свяжутся с вами в</p>
                            <p>ближайшее время</p>
                        </div>
                        <div className={styles.formRequestCallInput}>
                            <PhoneInputField
                                value={phone}
                                onChange={setPhone}
                                placeholder="+7 (___) ___-__-__"
                            />
                        </div>
                        {submitted && (
                            <p className={styles.formRequestCallSuccess}>
                                Спасибо! Мы свяжемся с вами в ближайшее время.
                            </p>
                        )}
                        <div className={styles.formRequestCallText}>
                            <ConsentCheckbox id="callback-consent-pd" checked={pdConsent} onChange={setPdConsent} variant="onAccent" required>
                                <ConsentPdText />
                            </ConsentCheckbox>
                        </div>
                        <div
                            className={isValid && !submitting ? styles.formRequestCallBtn : styles.formRequestCallBtnDisable}
                            onClick={handleSubmit}
                            role="button"
                            tabIndex={0}
                            aria-disabled={!isValid || submitting}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                        >
                            <p>{submitting ? 'Отправка...' : 'Перезвоните мне'}</p>
                        </div>
                        {phoneValid && !pdConsent ? (
                            <ConsentHint variant="onAccent">Отметьте согласие, чтобы отправить номер</ConsentHint>
                        ) : null}
                    </div>
                    <div className={`${styles.callRequestGirl} ${blockVisible ? styles.callRequestGirlLoaded : ''}`}></div>
                </div>
            </div>
        </div>
    );
};
