import Link from 'next/link';
import { StaticInfoPage } from '@/components/staticInfoPage';
import RightIcon from '@/components/icons/right';
import {
    LEGAL_COMPANY,
    LEGAL_DOCS,
    LEGAL_REQUISITES,
} from '@/config/legalDocs';
import styles from '@/components/legalPage/legalPage.module.css';

export default function LegalPage() {
    return (
        <StaticInfoPage title="Правовая информация" section="legal" currentLabel="Правовая информация">
            <p className={styles.subtitle}>
                Документы, на условиях которых работает сервис Totus Club, и реквизиты компании.
            </p>

            <div className={styles.layout}>
                <section className={styles.usersGroup} aria-labelledby="legal-users">
                    <h2 id="legal-users" className={styles.groupTitle}>Пользователям</h2>
                    <ul className={styles.list}>
                        {LEGAL_DOCS.map((doc) => (
                            <li key={doc.slug} className={styles.item}>
                                <Link href={doc.href} className={styles.row}>
                                    <span className={styles.rowText}>
                                        <span className={styles.rowTitle}>{doc.title}</span>
                                        <span className={styles.rowDesc}>{doc.description}</span>
                                    </span>
                                    <span className={styles.chevron} aria-hidden="true">
                                        <RightIcon />
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>

                <aside className={styles.company} aria-label="Реквизиты компании">
                    <h2 className={styles.companyName}>{LEGAL_COMPANY.name}</h2>
                    <dl className={styles.companyList}>
                        <div>
                            <dt>ИНН / КПП</dt>
                            <dd>{LEGAL_COMPANY.inn} / {LEGAL_COMPANY.kpp}</dd>
                        </div>
                        <div>
                            <dt>ОГРН</dt>
                            <dd>{LEGAL_COMPANY.ogrn}</dd>
                        </div>
                        <div>
                            <dt>Адрес</dt>
                            <dd>{LEGAL_COMPANY.address}</dd>
                        </div>
                        <div>
                            <dt>Реестр турагентов</dt>
                            <dd>{LEGAL_COMPANY.touragentRegistry}</dd>
                        </div>
                    </dl>
                    <Link href={LEGAL_REQUISITES.href} className={styles.companyLink}>
                        Все реквизиты и контакты →
                    </Link>
                </aside>
            </div>
        </StaticInfoPage>
    );
}
