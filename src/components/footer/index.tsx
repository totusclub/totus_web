import styles from './footer.module.css';
import Icon from "@/components/icons/Icon";
import Select from "@/components/UI/select";
import {useState} from "react";

const Footer = () => {
    const [selected, setSelected] = useState(null);
    const options = [{value:'RUB',name:'Российский рубль (₽)'},{value:'USD',name:'Доллар США ($)'}];
    return (
        <footer className={styles.footer}>
            <div className={'content'}>
                <div className={styles.footerRow}>
                    <div className={styles.footerColumn}>
                        <p className={styles.footerColumnTitle}>Компания</p>
                        <ul>
                            <li>О Нас</li>
                            <li>Карьера</li>
                            <li>Приложения</li>
                            <li>Блог</li>
                            <li>Как мы работаем</li>
                        </ul>
                    </div>
                    <div className={styles.footerColumn}>
                        <p className={styles.footerColumnTitle}>Контакт</p>
                        <ul>
                            <li>Помощь/Часто задаваемые вопросы</li>
                            <li>Пресса</li>
                            <li>Филиалы</li>
                            <li>Владельцы отелей</li>
                            <li>Партнеры</li>
                            <li>Рекламируйтесь у нас</li>
                        </ul>

                    </div>
                    <div className={styles.footerColumn}>
                        <p className={styles.footerColumnTitle}>Еще</p>
                        <ul>
                            <li>Авиакомпанийные сборы</li>
                            <li>Авиакомпании</li>
                            <li>Советы по низким тарифам</li>
                            <li>Значки и сертификаты</li>
                            <li>Безопасность</li>
                        </ul>
                    </div>
                    <div className={styles.footerColumn}>
                        <p className={styles.footerColumnTitle}>Скачать приложение</p>
                        <div className={styles.appStore}>
                            <Icon name={"appStore"} size={'100%'} />
                        </div>
                        <div className={styles.googlePlay}>
                            <Icon name={"googlePlay"} size={'100%'} />
                        </div>
                        <div className={styles.social}>
                            <p className={styles.socialTitle}>Мы в соц. сетях</p>
                            <ul>
                                <li><Icon name={"fb"} size={24} /></li>
                                <li><Icon name={"instagram"} size={24} /></li>
                                <li><Icon name={"x"} size={24} /></li>
                                <li><Icon name={"youtube"} size={24} /></li>
                            </ul>
                        </div>


                    </div>
                </div>
                <div className={styles.footerBottom}>
                    <ul>
                        <li>©2025 Арлекинотур</li>
                        <li>Настройки куки-файлов</li>
                        <li>Конфиденциальность</li>
                        <li>Условия и положения</li>
                        <li>Выбор рекламы</li>
                        <li>
                            <Select
                                options={options}
                                value={selected}
                                onChange={setSelected}
                                label={'Валюта'}
                                placeholder="Российский рубль (₽)"/>
                        </li>
                    </ul>
                </div>

            </div>
        </footer>
    );
};

export default Footer;
