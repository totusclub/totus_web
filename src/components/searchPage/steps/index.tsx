import styles from '../searchPage.module.css';
import Icon from "@/components/icons/Icon";


interface stepsProps {
    active:number
}

const Steps = ({ active}: stepsProps) => {
    return (
        <div className={styles.stepsWrapper}>
            <div className={'content'}>
                <div className={styles.steps}>
                <div className={styles.step}>
                    <div className={styles.stepNumber} style={{backgroundColor:active>=1?'var(--core_Orange)':'var(--bgPrimary)'}}>
                        <span style={{color:active>=1?'var(--textPrimaryB)':'var(--textTertiary)'}}>1</span>
                    </div>
                    <p className={styles.stepName}>Выбор туров</p>
                    <Icon name={'line'} size={53}/>
                </div>
                <div className={styles.step}>
                    <div className={styles.stepNumber}
                         style={{backgroundColor: active>=2 ? 'var(--core_Orange)' : 'var(--bgPrimary)'}}>
                        <span style={{color: active>=2 ? 'var(--textPrimaryB)' : 'var(--textTertiary)'}}>2</span>
                    </div>
                    <p className={styles.stepName}>Выбор отеля и размещения</p>
                    <Icon name={'line'} size={53}/>
                </div>
                <div className={styles.step}>
                    <div className={styles.stepNumber}
                         style={{backgroundColor: active >= 3 ? 'var(--core_Orange)' : 'var(--bgPrimary)'}}>
                        <span style={{color: active >= 3 ? 'var(--textPrimaryB)' : 'var(--textTertiary)'}}>3</span>
                    </div>
                    <p className={styles.stepName}>Выбор перелёта</p>
                    <Icon name={'line'} size={53}/>
                </div>
                <div className={styles.step}>
                    <div className={styles.stepNumber}
                         style={{backgroundColor: active >= 4 ? 'var(--core_Orange)' : 'var(--bgPrimary)'}}>
                        <span style={{color: active >= 4 ? 'var(--textPrimaryB)' : 'var(--textTertiary)'}}>4</span>
                    </div>
                    <p className={styles.stepName}>Бронирование</p>
                    <Icon name={'line'} size={53}/>
                </div>
                <div className={styles.step}>
                    <div className={styles.stepNumber}
                         style={{backgroundColor: active >=5  ? 'var(--core_Orange)' : 'var(--bgPrimary)'}}>
                        <span style={{color: active >= 5 ? 'var(--textPrimaryB)' : 'var(--textTertiary)'}}>5</span>
                    </div>
                    <p className={styles.stepName} style={{marginRight:0}}>Подтверждение и оплата</p>
                </div>
            </div>
            </div>
        </div>
    );
};

export default Steps;
