import styles from './button.module.css';
import Icon from "@/components/icons/Icon";
import type { MouseEvent } from "react";

interface ButtonProps {
    title: string;
    onClick?: (e?: MouseEvent) => void;
    icon?: string;
    br?: number;
    full?: boolean;
    width?: string;
    height?: string;
    loading?: boolean;
    disabled?: boolean; // ✅ new
}

const Button = ({
                    title,
                    icon,
                    br,
                    onClick,
                    full,
                    width,
                    height,
                    loading,
                    disabled
                }: ButtonProps) => {
    const isInactive = loading || disabled;

    return (
        <div
            className={styles.button}
            style={{
                borderRadius: br ?? 24,
                cursor: !isInactive && onClick ? 'pointer' : 'default',
                width: full ? '100%' : width ?? 'auto',
                height: height ?? 'auto',
                opacity: isInactive ? 0.6 : 1,
                pointerEvents: isInactive ? 'none' : 'auto',
            }}
            onClick={!isInactive ? onClick : undefined}
        >
            {loading ? (
                <div className={styles.loader}>Загрузка</div>
            ) : (
                <>
                    {title && <span className={styles.buttonTitle}>{title}</span>}
                    {icon && <Icon name={icon} size={20} color="#fff" accent={false} />}
                </>
            )}
        </div>
    );
};

export default Button;
