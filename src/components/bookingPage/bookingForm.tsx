import React from 'react';
import styles from './booking.module.css';
import Input from "@/components/UI/input";
import Select from "@/components/UI/select";
import DateInput from "@/components/UI/dateInput";
import PhoneInputField from "@/components/UI/phoneInputField";
import SwitchToggle from "@/components/UI/switch";
import { getChildAgeRange } from "@/utils/dateTimeUtils";
import {
    documentTypeMap,
    documentTypeReverseMap,
    nationalityMap,
    nationalityReverseMap,
    citizenshipOptions,
    documentTypeOptions,
    getNamePlaceholder,
    getPassportPlaceholder,
    getPassportMaxLength,
} from "@/utils/documentMappings";

type SelectOption = {
    value: string;
    name: string;
};

import type { Tourist, BookingValidationErrors } from "@/utils/bookingValidation";

type ValidationErrors = BookingValidationErrors;

type Params = {
    email: string;
    phone: string;
    tourist: Tourist[];
};


type BookingOrderFormProps = {
    params: Params;
    handleChangeTourist: (value: string | boolean | number, key: keyof Tourist, index: number) => void;
    handleChange: (value: string | number, key: keyof Params) => void;
    errors?: ValidationErrors;
    dataLoading?: boolean;
};

// Gender options for Select dropdown
const genderSelectOptions: SelectOption[] = [
    { value: 'M', name: 'Мужской' },
    { value: 'F', name: 'Женский' },
];

const BookingOrderForm: React.FC<BookingOrderFormProps> = ({ params, handleChangeTourist, handleChange, errors = {} }) => {
    // Nationality options
    const nationalityOptions: SelectOption[] = citizenshipOptions.map(name => ({
        value: String(nationalityMap[name]),
        name: name
    }));

    // Document type options
    const documentTypeOptionsList: SelectOption[] = documentTypeOptions.map(name => ({
        value: documentTypeMap[name],
        name: name
    }));

    // Add icon property to options for Select component compatibility
    const genderOptionsWithIcon = genderSelectOptions.map(opt => ({ ...opt, icon: '' }));
    const nationalityOptionsWithIcon = nationalityOptions.map(opt => ({ ...opt, icon: '' }));
    const docTypeOptionsWithIcon = documentTypeOptionsList.map(opt => ({ ...opt, icon: '' }));

    // const [params, setParams] = useState<Params>({
    //     email: "",
    //     phone: "",
    //     tourist: []
    // });


    // useEffect(() => {
    //     if(packageData){
    //         let allTourist = [];
    //         for(let i=0; i<packageData?.adults_count; i++){
    //             allTourist.push({
    //                 name: "MIKHAIL",
    //                 surname: "LEVELOV",
    //                 patronymic: "TRAVELOVICH",
    //                 gender: "M",
    //                 birthday: "06.01.1991",
    //                 document_number: "124567890",
    //                 document_expires_on: "01.07.2030",
    //                 nationality_id: 225,
    //                 child: false,
    //                 doc_type: "international_passport"
    //             })
    //         }
    //         setParams({
    //             ...params,
    //             tourist: allTourist,
    //         });
    //
    //     }
    //
    // }, [packageData]);

    // const handleChangeTourist = (value: string | boolean | number, key: keyof Tourist, index: number) => {
    //     const updatedTourists = [...params.tourist];
    //     updatedTourists[index] = {
    //         ...updatedTourists[index],
    //         [key]: value,
    //     };
    //     setParams({
    //         ...params,
    //         tourist: updatedTourists,
    //     });
    // };
    //
    // const handleChange = (value: string | number, key: keyof Params) => {
    //     setParams({ ...params, [key]: value });
    // };
    return (
        <div className={styles.bookingForm}>
            <div className={styles.bookingFormCard}>
                <p className={styles.bookingFormCardTitle}>Контакты покупателя</p>
                <p className={styles.bookingFormCardSubTitle}>Для получения документов к туру</p>
                {params && params?.tourist.length > 0 ? (
                    <div className={styles.bookingFormInputs}>
                        <Input
                            placeholder={'Электронная почта'}
                            value={params.email}
                            onChange={(e: string | number) => handleChange(e, 'email')}
                            required={true}
                            error={errors.email}
                        />
                        <PhoneInputField
                            placeholder={'+7 (___) ___-__-__'}
                            value={params.phone}
                            onChange={(value: string) => handleChange(value, 'phone')}
                            required={true}
                            error={errors.phone}
                        />
                    </div>
                ) : (
                    <div className={styles.bookingFormInputs}>
                        <div className={styles.fildeLazy}></div>
                        <div className={styles.fildeLazy}></div>
                    </div>
                )}
            </div>

            <div className={styles.bookingFormCard}>
                <p className={styles.bookingFormCardTitle}>Туристы</p>
                <p className={styles.bookingFormCardSubTitle}>
                    Заполните данные в точности так, как в документе, по которому полетите
                </p>
                <div className={styles.bookingLineForm} />
                {params && params?.tourist.length > 0 ? (
                    <>
                        {params.tourist.map((_tourist: Tourist, index: number) => (
                            <div key={index} className={styles.bookingFormInputsList}>
                                <div className={styles.bookingFormTourist}>
                                    <div className={styles.bookingFormTouristInfo}>
                                        <p>{_tourist.child ? 'Ребенок' : 'Взрослый'}</p>
                                        <p>{_tourist.child ? getChildAgeRange(_tourist.child_age) : 'старше 17 лет'}</p>
                                    </div>
                                </div>

                                <div className={styles.bookingFormInputs}>

                                    <Input
                                        placeholder={getNamePlaceholder('name', params.tourist[index].doc_type)}
                                        value={params.tourist[index].name}
                                        onChange={(e: string | number) => handleChangeTourist(e, 'name', index)}
                                        required={true}
                                        error={errors.tourists?.[index]?.name}
                                    />
                                    <Input
                                        placeholder={getNamePlaceholder('surname', params.tourist[index].doc_type)}
                                        value={params.tourist[index].surname}
                                        onChange={(e: string | number) => handleChangeTourist(e, 'surname', index)}
                                        required={true}
                                        error={errors.tourists?.[index]?.surname}
                                    />
                                    <Input
                                        placeholder={getNamePlaceholder('patronymic', params.tourist[index].doc_type)}
                                        value={params.tourist[index].patronymic}
                                        onChange={(e: string | number) => {
                                            const value = String(e);
                                            handleChangeTourist(value, 'patronymic', index);
                                            // If user types something, disable the "no patronymic" toggle
                                            if (value && value.trim() !== '' && params.tourist[index].noPatronymic) {
                                                handleChangeTourist(false, 'noPatronymic', index);
                                            }
                                        }}
                                        required={!params.tourist[index].noPatronymic}
                                        error={errors.tourists?.[index]?.patronymic}
                                        disabled={params.tourist[index].noPatronymic}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '-8px', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '16px', fontWeight: 400 }}>Нет отчества</span>
                                        <SwitchToggle
                                            isOn={params.tourist[index].noPatronymic || false}
                                            setIsOn={(value: boolean) => {
                                                handleChangeTourist(value, 'noPatronymic', index);
                                                if (value) {
                                                    // Clear patronymic when toggle is enabled
                                                    handleChangeTourist('', 'patronymic', index);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className={styles.bookingFormInputs}>
                                    <DateInput
                                        label={'Дата рождения'}
                                        placeholder={'DD.MM.YYYY'}
                                        value={params.tourist[index].birthday || ''}
                                        onChange={(value: string) => handleChangeTourist(value, 'birthday', index)}
                                        required={true}
                                        allowPastDates={true}
                                        error={errors.tourists?.[index]?.birthday}
                                    />
                                    <div className={styles.selectWrapper}>
                                        {(() => {
                                            const selectedGenderOption = genderSelectOptions.find(opt => opt.value === params.tourist[index].gender);
                                            const SelectProps = {
                                                isFull: true as const,
                                                options: genderOptionsWithIcon,
                                                value: selectedGenderOption?.name || '',
                                                onChange: (option: string | SelectOption) => {
                                                    const selectedOption = typeof option === 'string'
                                                        ? genderSelectOptions.find(opt => opt.value === option || opt.name === option)
                                                        : option;
                                                    if (selectedOption) {
                                                        handleChangeTourist(selectedOption.value, 'gender', index);
                                                    }
                                                },
                                                label: 'Пол',
                                                placeholder: "Выберите пол"
                                            };
                                            return <Select {...(SelectProps as unknown as React.ComponentProps<typeof Select>)} />;
                                        })()}
                                        {errors.tourists?.[index]?.gender && (
                                            <span className={styles.selectError}>
                                                {errors.tourists[index].gender}
                                            </span>
                                        )}
                                    </div>

                                </div>

                                <div className={styles.bookingFormInputs}>
                                    <div className={styles.selectWrapper}>
                                        {(() => {
                                            const selectedNationalityOption = nationalityOptions.find(opt => opt.value === params.tourist[index].nationality_id?.toString());
                                            const SelectProps = {
                                                isFull: true as const,
                                                options: nationalityOptionsWithIcon,
                                                value: selectedNationalityOption?.name || nationalityReverseMap[params.tourist[index].nationality_id || 225] || 'Россия',
                                                onChange: (option: string | SelectOption) => {
                                                    const selectedOption = typeof option === 'string'
                                                        ? nationalityOptions.find(opt => opt.value === option || opt.name === option)
                                                        : option;
                                                    if (selectedOption) {
                                                        handleChangeTourist(parseInt(selectedOption.value), 'nationality_id', index);
                                                    }
                                                },
                                                label: "Гражданство",
                                                placeholder: "Россия"
                                            };
                                            return <Select {...(SelectProps as unknown as React.ComponentProps<typeof Select>)} />;
                                        })()}
                                        {errors.tourists?.[index]?.nationality_id && (
                                            <span className={styles.selectError}>
                                                {errors.tourists[index].nationality_id}
                                            </span>
                                        )}
                                    </div>
                                    <div className={styles.selectWrapper}>
                                        {(() => {
                                            const selectedDocTypeOption = documentTypeOptionsList.find(opt => opt.value === params.tourist[index].doc_type);
                                            const SelectProps = {
                                                isFull: true as const,
                                                options: docTypeOptionsWithIcon,
                                                value: selectedDocTypeOption?.name || documentTypeReverseMap[params.tourist[index].doc_type] || 'Заграничный паспорт РФ',
                                                onChange: (option: string | SelectOption) => {
                                                    const selectedOption = typeof option === 'string'
                                                        ? documentTypeOptionsList.find(opt => opt.value === option || opt.name === option)
                                                        : option;
                                                    if (selectedOption) {
                                                        handleChangeTourist(selectedOption.value, 'doc_type', index);
                                                    }
                                                },
                                                label: 'Документ',
                                                placeholder: "Заграничный паспорт РФ"
                                            };
                                            return <Select {...(SelectProps as unknown as React.ComponentProps<typeof Select>)} />;
                                        })()}
                                        {errors.tourists?.[index]?.doc_type && (
                                            <span className={styles.selectError}>
                                                {errors.tourists[index].doc_type}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.bookingFormInputs}>
                                    <Input
                                        placeholder={getPassportPlaceholder(params.tourist[index].doc_type)}
                                        value={params.tourist[index].passport_number}
                                        type={'number'}
                                        onChange={(e: string | number) => {
                                            // Remove all non-digit characters
                                            const digitsOnly = String(e).replace(/\D/g, '');
                                            // Get max length based on document type
                                            const maxLength = getPassportMaxLength(params.tourist[index].doc_type);
                                            // Limit to max length
                                            const limitedValue = digitsOnly.slice(0, maxLength);
                                            handleChangeTourist(limitedValue, 'passport_number', index);
                                        }}
                                        required={true}
                                        maxLength={getPassportMaxLength(params.tourist[index].doc_type)}
                                        error={errors.tourists?.[index]?.passport_number}
                                    />
                                    <DateInput
                                        label={'Срок действия документа'}
                                        placeholder={'DD.MM.YYYY'}
                                        value={params.tourist[index].passport_expires_on || ''}
                                        onChange={(value: string) => handleChangeTourist(value, 'passport_expires_on', index)}
                                        required={true}
                                        allowPastDates={false}
                                        error={errors.tourists?.[index]?.passport_expires_on}
                                    />
                                </div>
                            </div>
                        ))}
                    </>

                ) : (
                    <div className={styles.bookingFormInputsList}>
                        <div className={styles.bookingFormTouristLazy}>
                            <div style={{ width: '100%' }}>
                                <div className={styles.animationTextLazy} style={{ width: '20%' }}></div>
                                <div className={styles.animationTextLazy} style={{ width: '30%' }}> </div>
                            </div>
                            <div className={styles.bookingFormInputs} style={{ width: '100%' }}>
                                <div className={styles.fildeLazy}></div>
                                <div className={styles.fildeLazy}></div>
                                <div className={styles.fildeLazy}></div>
                                <div className={styles.fildeLazy}></div>
                                <div className={styles.fildeLazy}></div>
                                <div className={styles.fildeLazy}></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingOrderForm;
