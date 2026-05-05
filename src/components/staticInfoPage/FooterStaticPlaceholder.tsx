import { FOOTER_STATIC_BY_SLUG, type FooterStaticSlug } from "@/config/footerStaticPages";
import { StaticInfoPage } from "./index";
import styles from "./staticInfoPage.module.css";

type Props = { slug: FooterStaticSlug };

export function FooterStaticPlaceholder({ slug }: Props) {
    const def = FOOTER_STATIC_BY_SLUG[slug];
    return (
        <StaticInfoPage title={def.title} section={def.section} currentLabel={def.currentLabel}>
            <div className={styles.body}>
                {def.paragraphs.map((text, i) => (
                    <p key={i}>{text}</p>
                ))}
            </div>
        </StaticInfoPage>
    );
}
