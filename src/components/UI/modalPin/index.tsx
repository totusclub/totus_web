import React, {useMemo, useState} from 'react';
import AppModal from "../modal";
import VerificationCodeInput from "@/components/UI/verificationCodeInput";
import {savePin} from "@/utils/auth";


const PIN = 2103

const ModalPin = ({open,setOpen}: { open:boolean,setOpen:any}) => {
    const [valid, setValid] = useState(false);

    const handleComplete =(code)=>{
        // console.log(code)
            if(+code === +PIN){
                savePin()
                setValid(false)
                setOpen(false);
            }else{
                setValid(true)
                console.log('not correct');
            }
    }

    return (
        <AppModal
            // back={headerContent.back}
            auth={true}
            isOpen={open}
            // onClose={() => setOpen(false)}
            title={''}
            width="450px"
            scroll={false}
        >
            <div style={{marginTop:40}}>
                <VerificationCodeInput valid={valid} onComplete={handleComplete}  />
            </div>
        </AppModal>
    );
};

export default ModalPin;
