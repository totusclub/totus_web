import React, {useState} from 'react';
import styles from "./home.module.css";
import PhoneInput from "@/components/UI/phoneInput";


export default function CallRequest(): JSX.Element {
    const [error, setError] = useState(true);
    return (
        <div className={'content'}>
            <div className={styles.callRequest}>
                <div className={styles.callRequestLeyer}>
                </div>
                <div className={styles.callRequestInfo}>
                    <div className={styles.formRequestCall}>
                        <div className={styles.formRequestCallHead}>
                            <p>Оставьте свой номер телефона</p>
                            <p>и наши специалисты свяжутся с вами в</p>
                            <p>ближайшее время</p>
                        </div>
                        <PhoneInput setError={setError}/>
                        <div className={ error ? styles.formRequestCallBtnDisable:styles.formRequestCallBtn} onClick={()=>error ? alert('Запрос отправлен') : alert('Введите корректный российский номер (+7XXXXXXXXXX)')}>
                            <p>Перезвоните мне</p>
                        </div>
                        <div className={styles.formRequestCallText}>
                            <p>Нажимая кнопку, я соглашаюсь на обработку своих персональных данных согласно</p>
                            <p>политике защиты и обработки персональных данных и с условиями оферты</p>
                        </div>
                    </div>
                    <div className={styles.callRequestGirl}></div>
                </div>
            </div>
        </div>
    );
};
