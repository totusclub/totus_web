import styles from '../searchPage.module.css';
import Icon from '@/components/icons/Icon';
import { useRouter } from 'next/router';
import {
    type BookingFlowStepId,
    type SearchTypeValue,
    getActiveStepIndex,
    getFlowSteps,
    getSearchTypeFromQuery,
} from '@/utils/bookingFlowUtils';

interface StepsProps {
    /** Current step in the funnel. */
    activeStep: BookingFlowStepId;
    /** Override flow type; otherwise read from `search_type` in the URL. */
    searchType?: SearchTypeValue;
}

const Steps = ({ activeStep, searchType: searchTypeProp }: StepsProps) => {
    const router = useRouter();
    const searchType = searchTypeProp ?? getSearchTypeFromQuery(router.query);
    const steps = getFlowSteps(searchType);
    const activeIndex = getActiveStepIndex(steps, activeStep);

    return (
        <div className={styles.stepsWrapper}>
            <div className={'content'}>
                <div className={styles.steps}>
                    {steps.map((step, index) => {
                        const stepNumber = index + 1;
                        const isReached = index <= activeIndex;
                        const isLast = index === steps.length - 1;

                        return (
                            <div key={step.id} className={styles.step}>
                                <div
                                    className={styles.stepNumber}
                                    style={{
                                        backgroundColor: isReached
                                            ? 'var(--core_Orange)'
                                            : 'var(--bgPrimary)',
                                    }}
                                >
                                    <span
                                        style={{
                                            color: isReached
                                                ? 'var(--textPrimaryB)'
                                                : 'var(--textTertiary)',
                                        }}
                                    >
                                        {stepNumber}
                                    </span>
                                </div>
                                <p className={styles.stepName} style={isLast ? { marginRight: 0 } : undefined}>
                                    {step.label}
                                </p>
                                {!isLast && <Icon name={'line'} size={53} />}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Steps;
