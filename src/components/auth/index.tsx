import React, {useMemo} from 'react';

import AppModal from "@/components/UI/modal";
import SignInForm from "@/components/auth/signin";
import Verification from "@/components/auth/verification";
import SignUpForm from "@/components/auth/signup";


const AuthModal: React.FC = ({open,setOpen}: { open:boolean,setOpen:any}) => {
    const [screen, setScreen] = React.useState('AUTH');
    const [email, setEmail] = React.useState('');


    const renderScreen = useMemo(()=>{
        switch (screen){
            case 'AUTH':
                return <SignInForm setScreen={setScreen} setEmail={setEmail}/>
            case 'VERIFICATION':
                return <Verification email={email} setOpen={setOpen}/>
            case 'SIGNUP':
                return <SignUpForm setScreen={setScreen} email={email} setEmail={setEmail}/>
        }
    },[screen])

    const headerContent=useMemo(()=>{
        switch (screen){
            case 'AUTH':
                return {
                    title:'Зарегистрируйтесь или войдите',
                    back:false
                }
            case 'VERIFICATION':
                return {
                    title:'Введите код',
                    subTitle:'код отправить по эл.почте',
                    back:true
                }
            case 'SIGNUP':
                return {
                    title:'Регистрация',
                    back:true
                }
        }
    },[screen])

    const handelBack =()=>{
        setScreen('AUTH');
    }

    return (
        <AppModal
            back={headerContent.back}
            auth={true}
            isOpen={open}
            onClose={() => setOpen(false)}
            title={headerContent.title}
            subTitle={headerContent?.subTitle}
            width="450px"
            onBack={handelBack}
            scroll={false}
        >
            {renderScreen}
        </AppModal>
    );
};

export default AuthModal;
