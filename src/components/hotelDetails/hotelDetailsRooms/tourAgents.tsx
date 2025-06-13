import styles from '../hotelDetails.module.css';
import {useEffect, useState} from "react";

interface TourAgentItem {
    name: string;
    id: number;
    selectedOperator: string;
    setSelectedOperator:any
}

interface TourAgentsProps {
    agents: TourAgentItem[];
    selectedOperator,
    setSelectedOperator
}
const TourAgents = ({ agents,selectedOperator,setSelectedOperator }: TourAgentsProps) => {
    const handleAgentChange = (id: number) => {
        setSelectedOperator(id);
    }
    return (
        <div className={styles.HotelDetailsTourAgents}>
            {agents?.map((item, index) => (
                <div onClick={()=>handleAgentChange(item.id)} className={styles.HotelDetailsTourAgent} style={{backgroundColor:`var(${selectedOperator===item.id?'--core_Orange':'--bgSecondary'})`}} key={index}>
                    <p style={{color:`var(${selectedOperator===item.id?'--textPrimaryB':'--textTertiary'})`}}>{item.name}</p>
                </div>
            ))}

        </div>
    );
};

export default TourAgents;
