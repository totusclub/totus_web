import styles from './itemSwitch.module.css';
import Switch from "@/components/UI/switch";

interface ItemSwitchProps {
    isOn: boolean;
    setIsOn: (name:string,value: boolean) => void;
    title:string;
    isFull?: boolean;
    name: string;

}

const ItemSwitch = ({isOn,setIsOn,title,isFull,name}: ItemSwitchProps) => {
    const handleToggle = (type:boolean) => {
        setIsOn(name,type);
    }

    return (
        <div className={styles.itemSwitch} style={{flex:isFull?1:'none'}}>
            <p className={styles.itemSwitchTitle}>{title}</p>
            <Switch isOn={isOn} setIsOn={handleToggle}/>
        </div>
    );
};

export default ItemSwitch;
