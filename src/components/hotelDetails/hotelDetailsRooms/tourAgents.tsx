import styles from '../hotelDetails.module.css';
import {useEffect, useState} from "react";

interface TourAgentItem {
    name: string;
    id: number;
}

interface TourAgentsProps {
    agents: TourAgentItem[];
}
const TourAgents = ({ agents }: TourAgentsProps) => {
    const [selected, setSelected] = useState<number | null>(null);

    useEffect(() => {
        setSelected(agents[0]['id'])
    },[agents])

    const handleAgentChange = (id: number) => {
        setSelected(id);
    }
    return (
        <div className={styles.HotelDetailsTourAgents}>
            {agents.map((item, index) => (
                <div onClick={()=>handleAgentChange(item.id)} className={styles.HotelDetailsTourAgent} style={{backgroundColor:`var(${selected===item.id?'--core_Orange':'--bgSecondary'})`}} key={index}>
                    <p style={{color:`var(${selected===item.id?'--textPrimaryB':'--textTertiary'})`}}>{item.name}</p>
                </div>
            ))}

        </div>
    );
};

export default TourAgents;
