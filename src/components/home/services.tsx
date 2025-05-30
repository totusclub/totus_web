import React from "react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import styles from './home.module.css'

const MOCK_DATA= [
    {
        id:1,
        name:'Один поиск для всех рейсов',
        text:'Мы находим лучшие предложения авиабилетов и туристические хаки, чтобы вы могли выбрать подходящее бронирование.',
        btnText:'Поиск авиабилетов',
        active:null,
    },
    {
        id:2,
        name:'Не тревожьтесь о проблемах с поездкой',
        text:'В рамках Гарантии Kayak Guarantee мы поддержим вас в любой ситуации.',
        btnText:'Поиск отелей',
        active:null,
    },
    {
        id:3,
        name:'Нам доверяют миллионы',
        text:'Присоединяйтесь к более чем 10 миллионам путешественников в год, которые бронируют поездки без каких-либо проблем.',
        btnText:'О платформе',
        active:null,
    },


]


export default function Services() {
    return (
        <div className={'content'}>
            <div className={styles.serviceList}>
                {MOCK_DATA.map((item, index) => (
                    <div className={styles.serviceItem} key={index}>
                        <div className={styles.serviceItemInfo}>
                            <div className={styles.serviceItemIcon}></div>
                            <p className={styles.serviceItemTitle}>{item.name}</p>
                            <p className={styles.serviceItemText}>{item.text}</p>
                        </div>
                        <div className={styles.serviceItemFooter}>
                            <p>{item.btnText}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
