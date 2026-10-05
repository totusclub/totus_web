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

const COMPANY_LINKS = [
    { href: '/about-us', label: 'О нас' },
    { href: '/partners', label: 'Партнёры' },
    { href: '/advertise', label: 'Рекламируйтесь у нас' },
    { href: '/requisites', label: 'Реквизиты и контакты' },
];

const HELP_LINKS = [
    { href: '/help-faq', label: 'Помощь и FAQ' },
    { href: '/low-fare-tips', label: 'Советы по низким тарифам' },
    { href: '/airlines', label: 'Авиакомпании' },
    { href: '/security', label: 'Безопасность' },
];

function SocialLinks({ items }: { items: FooterSocialLink[] }) {
    if (!items.length) return null;

    return (
        <div className={styles.social}>
            <p className={styles.footerColumnTitle}>Будьте с нами</p>
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

function LinkColumn({ title, links, className }: { title: string; links: { href: string; label: string }[]; className: string }) {
    return (
        <nav className={`${styles.footerColumn} ${className}`} aria-label={title}>
            <p className={styles.footerColumnTitle}>{title}</p>
            <ul>
                {links.map((link) => (
                    <li key={link.href}>
                        <Link href={link.href} className={styles.footerLink}>
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
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
                    <div className={styles.colApp}>
                        <div className={styles.appBlock}>
                            <p className={styles.footerColumnTitle}>Приложение Totus Club</p>
                            <div className={styles.stores}>
                                <span className={styles.storeTile} title="App Store" aria-label="App Store">
                                    <Icon name={'appStore'} />
                                </span>
                                <span className={styles.storeTile} title="Google Play" aria-label="Google Play">
                                    <Icon name={'googlePlay'} />
                                </span>
                                <span className={styles.storeTile} title="RuStore" aria-label="RuStore">
                                    <Icon name={'ruStore'} />
                                </span>
                            </div>
                        </div>
                        <SocialLinks items={socialLinks} />
                    </div>

                    <LinkColumn title="Компания" links={COMPANY_LINKS} className={styles.colCompany} />
                    <LinkColumn title="Помощь" links={HELP_LINKS} className={styles.colHelp} />

                    <div className={styles.legalBlock}>
                        <p className={styles.legalText}>
                            <span>
                                Турагент: ООО «ТОТУСКЛАБ», ИНН 9729424935, ОГРН 1267700310382, 119361, г. Москва, вн.тер.г. муниципальный округ Очаково-Матвеевское, пер. 2-й Очаковский, д. 4, помещ. 1/2. Реестровый номер турагента: [РТА …]
                            </span>
                            <span>Приём платежей: Банк ВТБ (ПАО)</span>
                        </p>
                        <p className={styles.legalText}>
                            Информация на сайте носит справочный характер. Условия проживания в отелях, в том числе концепция питания, могут изменяться по решению администрации отелей. Сумма, отображаемая на сайте, включает стоимость туристского продукта. Копирование материалов без письменного согласия запрещено.
                        </p>
                        <div className={styles.footerPayList}>
                            <div><Icon name={'mir'} size={41}/></div>
                            <div><Icon name={'visa'} size={38}/></div>
                        </div>
                        <div className={styles.legalLinks}>
                            <Link href="/legal" className={styles.legalLinkMain}>Правовая информация</Link>
                            <Link href="/privacy-policy" className={styles.legalLink}>Политика обработки персональных данных</Link>
                        </div>
                    </div>
                </div>
                <div className={styles.footerBottom}>
                    <p className={styles.copyright}>
                        © 2026 ООО «ТОТУСКЛАБ». Все права защищены. Используя сайт, вы принимаете условия{' '}
                        <Link href="/terms">пользовательского соглашения</Link>. Информация на сайте не является публичной офертой.{' '}
                        <Link href="/privacy-policy">Политика обработки персональных данных</Link>.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
