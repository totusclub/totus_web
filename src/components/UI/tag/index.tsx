import styles from './tag.module.css';
import Icon from "@/components/icons/Icon";

interface TagProps {
    title?: string;
    icon?: string;
    active?: boolean;
    onClick: (active: boolean) => void;
}

const Tag = ({ title, active = false, onClick ,icon}: TagProps) => {
    return (
        <div
            style={{ background: `var(${active?'--core_Orange':'--bgSecondary'})`}}
            className={styles.tagItem}
            onClick={() => onClick(!active)}
        >
            {active && (
                <Icon name={'close'} size={20} />
            )}
            <p className={styles.tagItemName} style={{color:`var(${active?'--textPrimaryB':'--textPrimary'})`}}>{title}</p>
            {icon && (
                <Icon name={icon} size={16} />
            )}
        </div>
    );
};

export default Tag;
