import React, { useState } from "react";
import styles from "./home.module.css";
import Collapse from "@/components/UI/collapse";



export default function Faq() {


    return (
        <div className={styles.faqBg}>
            <div className={'content'}>
                <div className={styles.faqContainer}>
                  <p>Как можно купить тур в Tok.club?</p>
                    <div className={styles.faqRow}>
                        <div className={styles.faqCal}>
                            <Collapse title={'Удобная и безопасная оплата'} open={false}>
                                <p>Удобная и безопасная оплата</p>
                            </Collapse>
                            <Collapse title={'Часто задаваемые вопросы о покупке туров'} open={false}>
                                <p>Часто задаваемые вопросы о покупке туров</p>
                            </Collapse>
                            <Collapse title={'Вопросы и ответы по процессу бронирования'} open={false}>
                                <p>Вопросы и ответы по процессу бронирования</p>
                            </Collapse>
                            <Collapse title={'Часто задаваемые вопросы о турах и их покупке'} open={false}>
                                <p>Часто задаваемые вопросы о турах и их покупке</p>
                            </Collapse>
                            <Collapse title={'Ваши вопросы — наши ответы о покупке туров'} open={false}>
                                <p>Ваши вопросы — наши ответы о покупке туров</p>
                            </Collapse>
                        </div>
                        <div className={styles.faqCal}>
                            <Collapse title={'Часто задаваемые вопросы о ценах на туры'} open={false}>
                                <p>Часто задаваемые вопросы о ценах на туры</p>
                            </Collapse>
                            <Collapse title={'Вопросы, которые нам задают чаще всего о покупке'} open={false}>
                                <p>Вопросы, которые нам задают чаще всего о покупке</p>
                            </Collapse>
                            <Collapse title={'Ответы на ваши вопросы о покупке туров'} open={false}>
                                <p>Ответы на ваши вопросы о покупке туров</p>
                            </Collapse>
                            <Collapse title={'Часто задаваемые вопросы о сервисе бронирования'} open={false}>
                                <p>Часто задаваемые вопросы о сервисе бронирования</p>
                            </Collapse>
                            <Collapse title={'Ответы на часто задаваемые вопросы о покупке'} open={false}>
                                <p>Ответы на часто задаваемые вопросы о покупке</p>
                            </Collapse>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
