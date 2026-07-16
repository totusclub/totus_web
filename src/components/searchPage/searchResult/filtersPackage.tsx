import styles from '../searchPage.module.css';
import ItemSwitch from "@/components/UI/itemSwitch";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Collapse from "@/components/UI/collapse";
import CheckboxGroup from "@/components/UI/checkboxGroup";
import Icon from "@/components/icons/Icon";
import Button from "@/components/UI/button";

/** Prefer API option labeled as fast confirm; fall back to confirmability id `2`. */
function getFastConfirmIds(allFilters: any): Array<string | number> {
    const fromConfirmability = allFilters?.confirmability;
    if (Array.isArray(fromConfirmability) && fromConfirmability.length > 0) {
        const match = fromConfirmability.find((item: any) => {
            const id = Number(item?.id);
            const name = String(item?.name ?? '').toLowerCase();
            return id === 2 || name.includes('быстр');
        });
        if (match?.id !== undefined && match?.id !== null) return [match.id];
    }

    const fromInstant = allFilters?.instant_confirm;
    if (Array.isArray(fromInstant) && fromInstant.length > 0) {
        const selectedOrFirst =
            fromInstant.find((item: any) => item?.selected) ?? fromInstant[0];
        if (selectedOrFirst?.id !== undefined && selectedOrFirst?.id !== null) {
            return [selectedOrFirst.id];
        }
    }

    return [2];
}

const FiltersPackage = ({ allFilters, setFiltersRequest, netPrice }: any) => {
    const [mobileModal, setMobileModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [instantConfirm, setInstantConfirm] = useState(false);
    const [filters, setFilters] = useState({
        arrival_airports: [] as Array<string | number>,
        departure_airports: [] as Array<string | number>,
        forward_airlines: [] as Array<string | number>,
        backward_airlines: [] as Array<string | number>,
        flight_classes: [] as Array<string | number>,
        flight_types: [] as Array<string | number>,
        transitions_count: [] as Array<string | number>,
        transitions_time: [] as Array<string | number>,
        operators: [] as Array<string | number>,
        insurance: [] as Array<string | number>,
        transfer: [] as Array<string | number>,
        luggage_types: [] as Array<string | number>,
        forward_arrival_dates: [] as Array<string | number>,
        forward_departure_intervals: [] as Array<string | number>,
        backward_departure_intervals: [] as Array<string | number>,
        forward_departure_time: { from: '', to: '' },
        backward_departure_time: { from: '', to: '' },
        payment_benefits: [] as Array<string | number>,
        confirmability: [] as Array<string | number>,
        tour_ids: [] as Array<string | number>,
    });

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 1024);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!mobileModal || !isMobile) return;

        const scrollY = window.scrollY;
        const previousBodyPosition = document.body.style.position;
        const previousBodyTop = document.body.style.top;
        const previousBodyWidth = document.body.style.width;
        const previousHtmlOverflow = document.documentElement.style.overflow;

        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.documentElement.style.overflow = 'hidden';
        document.body.classList.add('filter-modal-open');

        return () => {
            document.body.style.position = previousBodyPosition;
            document.body.style.top = previousBodyTop;
            document.body.style.width = previousBodyWidth;
            document.documentElement.style.overflow = previousHtmlOverflow;
            document.body.classList.remove('filter-modal-open');
            window.scrollTo(0, scrollY);
        };
    }, [mobileModal, isMobile]);

    const onChangeFilters = (key: string, value: string | boolean | number) => {
        if (typeof value === 'boolean') {
            const confirmability = value ? getFastConfirmIds(allFilters) : [];
            const updatedFilters = { ...filters, confirmability };
            setInstantConfirm(value);
            setFilters(updatedFilters);
            setFiltersRequest(updatedFilters);
            return;
        }

        const raw = value == null ? '' : String(value);
        const intArray =
            raw.trim() === ''
                ? []
                : raw
                      .split(',')
                      .map((v) => v.trim())
                      .filter((v) => v !== '' && v !== '...')
                      .map((v) => (/^-?\d+$/.test(v) ? Number(v) : v));

        const updatedFilters = { ...filters, [key]: intArray };
        setFilters(updatedFilters);
        setFiltersRequest(updatedFilters);
    };

    return (
        <>
            <div className={styles.buttonFilterMob} onClick={() => setMobileModal(true)}>
                <Icon name={'filter'} />
            </div>
            {(() => {
                const filtersPanel = (
                    <div className={`${styles.filters} ${mobileModal && isMobile ? styles.activeModal : ''}`}>
                        <div className={styles.mobileFilterHeader}>
                            <p>Фильтры</p>
                            <p onClick={() => setMobileModal(false)}>Отменить</p>
                        </div>
                        <div className={styles.mobileFilterBody}>
                        <ItemSwitch
                            name={'confirmability'}
                            title={'Быстрое подтверждение'}
                            setIsOn={onChangeFilters}
                            isOn={instantConfirm}
                        />
                        {allFilters?.forward_airlines?.length > 0 && (
                            <Collapse title={'Авиакомпания туда'} open={true}>
                                <CheckboxGroup
                                    name={'forward_airlines'}
                                    options={[...allFilters?.forward_airlines] || []}
                                    selected={filters.forward_airlines}
                                    onChange={onChangeFilters}
                                    pk={true}
                                    netPrice={netPrice}
                                />
                            </Collapse>
                        )}
                        {allFilters?.backward_airlines?.length > 0 && (
                            <Collapse title={'Авиакомпания обратно'} open={true}>
                                <CheckboxGroup
                                    name={'backward_airlines'}
                                    options={[...allFilters?.backward_airlines] || []}
                                    selected={filters.backward_airlines}
                                    onChange={onChangeFilters}
                                    pk={true}
                                    netPrice={netPrice}
                                />
                            </Collapse>
                        )}
                        {allFilters?.departure_airports?.airports?.length > 0 && (
                            <Collapse title={'Аэропорт вылета'} open={true}>
                                <CheckboxGroup
                                    name={'departure_airports'}
                                    options={[...allFilters?.departure_airports?.airports] || []}
                                    selected={filters.departure_airports}
                                    onChange={onChangeFilters}
                                    pk={true}
                                    netPrice={netPrice}
                                />
                            </Collapse>
                        )}
                        {allFilters?.arrival_airports?.airports?.length > 0 && (
                            <Collapse title={'Аэропорт прибытия'} open={true}>
                                <CheckboxGroup
                                    name={'arrival_airports'}
                                    options={[...allFilters?.arrival_airports?.airports] || []}
                                    selected={filters.arrival_airports}
                                    onChange={onChangeFilters}
                                    pk={true}
                                    netPrice={netPrice}
                                />
                            </Collapse>
                        )}
                        {allFilters?.forward_departure_intervals?.length > 0 && (
                            <Collapse title={'Время вылета туда'} open={true}>
                                <CheckboxGroup
                                    name={'forward_departure_intervals'}
                                    options={[...allFilters?.forward_departure_intervals] || []}
                                    selected={filters.forward_departure_intervals}
                                    onChange={onChangeFilters}
                                    pk={true}
                                    netPrice={netPrice}
                                />
                            </Collapse>
                        )}
                        {allFilters?.backward_departure_intervals?.length > 0 && (
                            <Collapse title={'Время вылета обратно'} open={true}>
                                <CheckboxGroup
                                    name={'backward_departure_intervals'}
                                    options={[...allFilters?.backward_departure_intervals] || []}
                                    selected={filters.backward_departure_intervals}
                                    onChange={onChangeFilters}
                                    pk={true}
                                    netPrice={netPrice}
                                />
                            </Collapse>
                        )}
                        {allFilters?.operators?.length > 0 && (
                            <Collapse title={'Туроператор'} open={true}>
                                <CheckboxGroup
                                    name={'operators'}
                                    options={[...allFilters?.operators] || []}
                                    selected={filters.operators}
                                    onChange={onChangeFilters}
                                    pk={true}
                                    netPrice={netPrice}
                                />
                            </Collapse>
                        )}
                        {allFilters?.luggage_types?.length > 0 && (
                            <Collapse title={'Багаж'} open={true}>
                                <CheckboxGroup
                                    name={'luggage_types'}
                                    options={[...allFilters?.luggage_types] || []}
                                    selected={filters.luggage_types}
                                    onChange={onChangeFilters}
                                    pk={true}
                                    netPrice={netPrice}
                                />
                            </Collapse>
                        )}
                        {allFilters?.flight_classes?.length > 0 && (
                            <Collapse title={'Класс перелета'} open={true}>
                                <CheckboxGroup
                                    name={'flight_classes'}
                                    options={[...allFilters?.flight_classes] || []}
                                    selected={filters.flight_classes}
                                    onChange={onChangeFilters}
                                    pk={true}
                                    netPrice={netPrice}
                                />
                            </Collapse>
                        )}
                        {allFilters?.flight_types?.length > 0 && (
                            <Collapse title={'Тип рейса'} open={true}>
                                <CheckboxGroup
                                    name={'flight_types'}
                                    options={[...allFilters?.flight_types] || []}
                                    selected={filters.flight_types}
                                    onChange={onChangeFilters}
                                    pk={true}
                                    netPrice={netPrice}
                                />
                            </Collapse>
                        )}
                        {allFilters?.transitions_count?.length > 0 && (
                            <Collapse title={'Пересадки'} open={true}>
                                <CheckboxGroup
                                    name={'transitions_count'}
                                    options={[...allFilters?.transitions_count] || []}
                                    selected={filters.transitions_count}
                                    onChange={onChangeFilters}
                                    pk={true}
                                    netPrice={netPrice}
                                />
                            </Collapse>
                        )}
                        </div>
                        <div className={styles.mobileFilterFooter}>
                            <Button title={'Применять'} full={true} onClick={() => setMobileModal(false)} />
                        </div>
                    </div>
                );

                if (isMobile) {
                    return mobileModal && typeof document !== 'undefined'
                        ? createPortal(filtersPanel, document.body)
                        : null;
                }

                return filtersPanel;
            })()}
        </>
    );
};

export default FiltersPackage;
