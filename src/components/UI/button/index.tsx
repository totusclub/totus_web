import styles from './button.module.css';
import Icon from "@/components/icons/Icon";

interface ButtonProps {
    title: string;
    onClick?: () => void;
    icon?: string;
    br?:number,
    full?:boolean,
    width?:string,
    height?:string,
}

const Button = ({ title, icon,br, onClick,full,width ,height}: ButtonProps) => {
    return (
        <div
            className={styles.button}
            style={{borderRadius:br?br:24, cursor: onClick ? 'pointer' : 'default',width:full?'100%':width?width:'auto',height:height?height:'auto' }}
            onClick={onClick}
        >
            {title && (
                <span className={styles.buttonTitle}>{title}</span>
            )}
            {icon && (
                <Icon name={icon} size={20} color="#000"/>
            )}
        </div>
    );
};

export default Button;
