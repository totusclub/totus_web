import styles from './itemSwitch.module.css';
import Switch from "@/components/UI/switch";

interface ItemSwitchProps {
    isOn: boolean;
    setIsOn: (value: boolean) => void;
    title:string;
    isFull?: boolean;

}

const ItemSwitch = ({isOn,setIsOn,title,isFull}: ItemSwitchProps) => {
    return (
        <div className={styles.itemSwitch} style={{flex:isFull?1:'none'}}>
            <p className={styles.itemSwitchTitle}>{title}</p>
            <Switch isOn={isOn} setIsOn={setIsOn}/>
        </div>
    );
};

export default ItemSwitch;
