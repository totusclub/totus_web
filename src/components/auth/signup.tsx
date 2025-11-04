import React, {useState,useEffect} from 'react';
import styles from './auth.module.css'
import Input from "@/components/UI/input";
import Button from "@/components/UI/button";
import {SignInRequest, SignUpRequest} from "@/api/AuthApi";


const SignUpForm: React.FC = ({setScreen,setEmail,email}:any) => {
    const [params, setParams] = useState({
        email: email,
        name: '',
        l_name:'',
        phone:''
    });

    const handelSignup = async ()=>{
        //setScreen('SIGNUP')//VERIFICATION
        const res =  await SignUpRequest(params)
        console.log('res',res.screen)
        setEmail(params.email)
        setScreen(res.screen)

    }

    useEffect(()=>{
        setParams({...params, email: email})
    },[email])

    const handleChange = (key,value)=>{
        setParams({...params, [key]: value})
    }




    return (
        <div className={styles.authCard}>
            <Input value={params.name} onChange={(e)=>handleChange('name',e)} placeholder={'Имя'} />
            <Input value={params.l_name} onChange={(e)=>handleChange('l_name',e)} placeholder={'Фамилия'} />
            <Input value={params.email} onChange={(e)=>handleChange('email',e)} placeholder={'Электронная почта'} />
            <Input value={params.phone} onChange={(e)=>handleChange('phone',e)} placeholder={'Номер телефона'} />
            <div className={styles.authCardText}>
                <p>Мы позвоним или отправим сообщение, чтобы подтвердить ваш номер. Применяются стандартные тарифы на сообщения и данные.</p>
            </div>
            <Button onClick={()=>handelSignup()} title={'Зарегистрироваться'}/>
        </div>
    );
};

export default SignUpForm;
