import React, { useState } from 'react';
import styles from "./home.module.css";
import PhoneInputField from "@/components/UI/phoneInputField";
import { submitCallbackRequest } from "@/api/callbackRequestApi";
import { useNearViewport } from "@/hooks/useNearViewport";


export default function CallRequest(): JSX.Element {
    const [phone, setPhone] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    // Фоновые картинки блока (layer.png, girl.png ~190 КБ каждая) — только когда блок рядом с экраном
    const [blockRef, blockVisible] = useNearViewport<HTMLDivElement>();

    const isValid = /^7\d{10}$/.test(phone);

    const handleSubmit = async () => {
        if (!isValid || submitting) return;

        try {
            setSubmitting(true);
            await submitCallbackRequest(phone);
            setSubmitted(true);
            setPhone('');
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
                <div className={`${styles.callRequestLeyer} ${blockVisible ? styles.callRequestLeyerLoaded : ''}`}>
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
                        <div
                            className={isValid && !submitting ? styles.formRequestCallBtn : styles.formRequestCallBtnDisable}
                            onClick={handleSubmit}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                        >
                            <p>{submitting ? 'Отправка...' : 'Перезвоните мне'}</p>
                        </div>
                        <div className={styles.formRequestCallText}>
                            <p>Нажимая кнопку, я соглашаюсь на обработку своих персональных данных согласно</p>
                            <p>политике защиты и обработки персональных данных и с условиями оферты</p>
                        </div>
                    </div>
                    <div className={`${styles.callRequestGirl} ${blockVisible ? styles.callRequestGirlLoaded : ''}`}></div>
                </div>
            </div>
        </div>
    );
};
