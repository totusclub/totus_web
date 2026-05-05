import Link from 'next/link';
import styles from './footer.module.css';
import Icon from "@/components/icons/Icon";
import Select from "@/components/UI/select";
import {useState} from "react";

const Footer = () => {
    const [selected, setSelected] = useState(null);
    const options = [{value:'RUB',name:'Российский рубль (₽)'},{value:'USD',name:'Доллар США ($)'}];
    return (
        <footer className={styles.footer}>
            <div className={'content'}>
                <div className={styles.footerRow}>
                    <div className={styles.footerColumnM}>
                        <p className={styles.footerColumnTitle}>Скачать приложение</p>
                        <div className={styles.appStore}>
                            <Icon name={"appStore"} size={'100%'}/>
                        </div>
                        <div className={styles.social}>
                            <p className={styles.socialTitle}>Мы в соц. сетях</p>
                            <ul>
                                <li><Icon name={"vk"} size={24} color="var(--textPrimary)"/></li>
                                <li><Icon name={"rutube"} size={24} color="var(--textPrimary)"/></li>
                                <li><Icon name={"aiStar"} size={24} color="var(--textPrimary)"/></li>
                                <li><Icon name={"vc"} size={24} color="var(--textPrimary)"/></li>
                            </ul>
                        </div>
                        <p className={styles.footerColumnTitle}>Можно платить</p>
                        <div className={styles.footerPayList}>
                            <div><Icon name={'mir'} size={41}/></div>
                            <div><Icon name={'visa'} size={38}/></div>
                            <div><Icon name={'master'} size={29}/></div>
                        </div>
                    </div>
                    <div className={styles.footerColumn}>
                        <p className={styles.footerColumnTitle}>Компания</p>
                        <ul>
                            <li>
                                <Link href="/about-us" className={styles.footerLink}>
                                    О Нас
                                </Link>
                            </li>
                            {/*<li>*/}
                            {/*    <Link href="/career" className={styles.footerLink}>Карьера</Link>*/}
                            {/*</li>*/}
                            {/*<li>*/}
                            {/*    <Link href="/apps" className={styles.footerLink}>Приложения</Link>*/}
                            {/*</li>*/}
                            {/*<li>*/}
                            {/*    <Link href="/blog" className={styles.footerLink}>Блог</Link>*/}
                            {/*</li>*/}
                            <li>
                                <Link href="/how-we-work" className={styles.footerLink}>Как мы работаем</Link>
                            </li>
                        </ul>
                    </div>
                    <div className={styles.footerColumn}>
                        <p className={styles.footerColumnTitle}>Контакт</p>
                        <ul>
                            <li>
                                <Link href="/help-faq" className={styles.footerLink}>
                                    Помощь/Часто задаваемые вопросы
                                </Link>
                            </li>
                            <li>
                                <Link href="/press" className={styles.footerLink}>Пресса</Link>
                            </li>
                            <li>
                                <Link href="/branches" className={styles.footerLink}>Филиалы</Link>
                            </li>
                            <li>
                                <Link href="/hotel-owners" className={styles.footerLink}>Владельцы отелей</Link>
                            </li>
                            <li>
                                <Link href="/partners" className={styles.footerLink}>Партнеры</Link>
                            </li>
                            <li>
                                <Link href="/advertise" className={styles.footerLink}>Рекламируйтесь у нас</Link>
                            </li>
                        </ul>

                    </div>
                    <div className={styles.footerColumn}>
                        <p className={styles.footerColumnTitle}>Еще</p>
                        <ul>
                            <li>
                                <Link href="/airline-fees" className={styles.footerLink}>Авиакомпанийные сборы</Link>
                            </li>
                            <li>
                                <Link href="/airlines" className={styles.footerLink}>Авиакомпании</Link>
                            </li>
                            <li>
                                <Link href="/low-fare-tips" className={styles.footerLink}>Советы по низким тарифам</Link>
                            </li>
                            <li>
                                <Link href="/badges-certificates" className={styles.footerLink}>Значки и сертификаты</Link>
                            </li>
                            <li>
                                <Link href="/security" className={styles.footerLink}>Безопасность</Link>
                            </li>
                        </ul>
                    </div>
                    <div className={`${styles.footerColumn} ${styles.noneMobile}`}>
                        <p className={styles.footerColumnTitle}>Можно платить</p>
                        <div className={styles.footerPayList}>
                            <div><Icon name={'mir'} size={41}/></div>
                            <div><Icon name={'visa'} size={38}/></div>
                            <div><Icon name={'master'} size={29}/></div>
                        </div>

                        <p className={styles.footerColumnTitle}>Скачать приложение</p>
                        <div className={styles.appStore}>
                            <Icon name={"appStore"} size={'100%'}/>
                        </div>
                        <div className={styles.social}>
                            <p className={styles.socialTitle}>Мы в соц. сетях</p>
                            <ul>
                                <li><Icon name={"vk"} size={24} color="var(--textPrimary)"/></li>
                                <li><Icon name={"rutube"} size={24} color="var(--textPrimary)"/></li>
                                <li><Icon name={"aiStar"} size={24} color="var(--textPrimary)"/></li>
                                <li><Icon name={"vc"} size={24} color="var(--textPrimary)"/></li>
                            </ul>
                        </div>


                    </div>
                </div>
                <div className={styles.footerBottom}>
                    <ul>
                        <li>©2026 Totus Club</li>
                        <li>
                            <Link href="/cookie-settings" className={styles.footerBottomLink}>
                                Настройки куки-файлов
                            </Link>
                        </li>
                        <li>
                            <Link href="/privacy-policy" className={styles.footerBottomLink}>
                                Конфиденциальность
                            </Link>
                        </li>
                        <li>
                            <Link href="/terms" className={styles.footerBottomLink}>
                                Условия и положения
                            </Link>
                        </li>
                        {/*<li>*/}
                        {/*    <Link href="/ad-choices" className={styles.footerBottomLink}>*/}
                        {/*        Выбор рекламы*/}
                        {/*    </Link>*/}
                        {/*</li>*/}
                    </ul>
                </div>

            </div>
        </footer>
    );
};

export default Footer;
