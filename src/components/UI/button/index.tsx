import styles from './button.module.css';
import Icon from "@/components/icons/Icon";

interface ButtonProps {
    title: string;
    onClick?: () => void;
    icon?: string;
    br?: number;
    full?: boolean;
    width?: string;
    height?: string;
    loading?: boolean;
}

const Button = ({ title, icon, br, onClick, full, width, height, loading }: ButtonProps) => {
    return (
        <div
            className={styles.button}
            style={{
                borderRadius: br ?? 24,
                cursor: onClick && !loading ? 'pointer' : 'default',
                width: full ? '100%' : width ?? 'auto',
                height: height ?? 'auto',
                opacity: loading ? 0.6 : 1,
                pointerEvents: loading ? 'none' : 'auto',
            }}
            onClick={!loading ? onClick : undefined}
        >
            {loading ? (
                <div className={styles.loader} >Загрузка</div>
            ) : (
                <>
                    {title && <span className={styles.buttonTitle}>{title}</span>}
                    {icon && <Icon name={icon} size={20} color="#000" />}
                </>
            )}
        </div>
    );
};

export default Button;
