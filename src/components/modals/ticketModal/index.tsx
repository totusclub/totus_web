import React, { useMemo } from 'react';
import AppModal from "@/components/UI/modal";
import TicketModalContent from './ticketModalContent';
import { secondsToRussianTime } from "@/utils/dateTimeUtils";

interface TicketModalProps {
    open?: boolean;
    setOpen?: (open: boolean) => void;
    item?: any;
}

const TicketModal = ({ open, setOpen, item }: TicketModalProps) => {

    const totalTravelTime = useMemo(() => {
        if (!item?.to?.time || !item?.back?.time) return '';
        const totalSeconds = (item.to.time || 0) + (item.back.time || 0);
        return secondsToRussianTime(totalSeconds);
    }, [item]);

    return (
        <AppModal
            isOpen={open || false}
            onClose={() => setOpen && setOpen(false)}
            onBack={() => setOpen && setOpen(false)}
            title="Детали перелёта"
            subTitle={totalTravelTime ? `В пути ${totalTravelTime}` : ''}
            width="600px"
        >
            <TicketModalContent item={item} />
        </AppModal>
    );
};

export default TicketModal;
