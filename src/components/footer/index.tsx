import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './footer.module.css';
import Icon from '@/components/icons/Icon';
import { getFooterSocialLinks, type FooterSocialLink } from '@/api/footerSocialApi';

const FALLBACK_SOCIAL: FooterSocialLink[] = [
    { id: 1, title: 'VK', icon: 'vk', url: '', sort_order: 1, is_active: true },
    { id: 2, title: 'Rutube', icon: 'rutube', url: '', sort_order: 2, is_active: true },
    { id: 3, title: 'AI Star', icon: 'aiStar', url: '', sort_order: 3, is_active: true },
    { id: 4, title: 'VC', icon: 'vc', url: '', sort_order: 4, is_active: true },
];

function SocialLinks({ items }: { items: FooterSocialLink[] }) {
    if (!items.length) return null;

    return (
        <div className={styles.social}>
            <p className={styles.socialTitle}></p>
            <ul>
                {items.map((item) => {
                    const content = <Icon name={item.icon} size={24} color="var(--textPrimary)" />;
                    if (item.url) {
                        return (
                            <li key={item.id}>
                                <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label={item.title || item.icon}>
                                    {content}
                                </a>
                            </li>
                        );
                    }
                    return <li key={item.id}>{content}</li>;
                })}
            </ul>
        </div>
    );
}

const Footer = () => {
    const [socialLinks, setSocialLinks] = useState<FooterSocialLink[]>(FALLBACK_SOCIAL);

    useEffect(() => {
        getFooterSocialLinks().then((data) => {
            if (data.length > 0) setSocialLinks(data);
        });
    }, []);

    return (
        <footer className={styles.footer}>
            <div className={'content'}>
                <div className={styles.footerRow}>
                    <div className={styles.footerColumnM}>
                        <p className={styles.footerColumnTitle}></p>
                        <div className={styles.appStore}>
                            <Icon name={"appStore"} size={'100%'}/>
                        </div>
                        <SocialLinks items={socialLinks} />
                        <p className={styles.footerColumnTitle}></p>
                        <div className={styles.footerPayList}>
                            <div><Icon name={'mir'} size={41}/></div>
                            <div><Icon name={'visa'} size={38}/></div>
                            <div><Icon name={'master'} size={29}/></div>
                        </div>
                    </div>
                    <div className={styles.footerColumn}>
                        <p className={styles.footerColumnTitle}></p>
                        <ul>
                            <li className={styles.footerColumn}>
                                ООО «Арлекинотур»,ИНН 9729298840, <br/> ОГРН 1207700285033, 119361, город Москва, Малая Очаковская ул., д. 4, офис 7
                            </li>
                            <div className={styles.appStore}>
                                <Icon name={"appStore"} size={'100%'}/>
                                <Icon name={"googlePlay"} size={'100%'}/>
                                <Icon name={"ruStore"} size={'48px'}/>
                            </div>
                        </ul>
                    </div>
                    <div className={styles.footerColumn}>
                        <p className={styles.footerColumnTitle}></p>
                        <ul>
                            <li>
                                <Link href="/about-us" className={styles.footerLink}>
                                    О Нас
                                </Link>
                            </li>
                            <li>
                                <Link href="/help-faq" className={styles.footerLink}>
                                    Помощь/Часто задаваемые вопросы
                                </Link>
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
                        <p className={styles.footerColumnTitle}></p>
                        <ul>
                            <li>
                                <Link href="/airlines" className={styles.footerLink}>Авиакомпании</Link>
                            </li>
                            <li>
                                <Link href="/low-fare-tips" className={styles.footerLink}>Советы по низким тарифам</Link>
                            </li>
                            <li>
                                <Link href="/badges-certificates" className={styles.footerLink}>Документы</Link>
                            </li>
                            <li>
                                <Link href="/security" className={styles.footerLink}>Безопасность</Link>
                            </li>
                        </ul>
                    </div>
                    <div className={`${styles.footerColumn} ${styles.noneMobile}`}>
                        <p className={styles.footerColumnTitle}></p>
                        <div className={styles.footerPayList}>
                            <div><Icon name={'mir'} size={41}/></div>
                            <div><Icon name={'visa'} size={38}/></div>
                        </div>
                        <SocialLinks items={socialLinks} />
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
                    </ul>
                </div>

            </div>
        </footer>
    );
};

export default Footer;
