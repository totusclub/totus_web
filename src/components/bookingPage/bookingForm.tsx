import React from 'react';
import styles from './booking.module.css';
import Input from "@/components/UI/input";
import Select from "@/components/UI/select";
import DateInput from "@/components/UI/dateInput";
import PhoneInputField from "@/components/UI/phoneInputField";

type SelectOption = {
    value: string;
    name: string;
};

type Tourist = {
    surname: string;
    name: string;
    patronymic: string;
    birthday: string;
    gender: string | null;
    nationality_id: number | null | undefined;
    doc_type: string;
    passport_number: string | number;
    passport_expires_on: string;
    child?: boolean;
};

type Params = {
    email: string;
    phone: string;
    tourist: Tourist[];
};

type ValidationErrors = {
    email?: string;
    phone?: string;
    general?: string;
    tourists?: {
        [index: number]: {
            surname?: string;
            name?: string;
            patronymic?: string;
            birthday?: string;
            gender?: string;
            nationality_id?: string;
            doc_type?: string;
            passport_number?: string;
            passport_expires_on?: string;
        };
    };
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
    const options: SelectOption[] = [{ value: '225', name: 'Россия' }];
    const options2: SelectOption[] = [{ value: 'international_passport', name: 'Заграничный паспорт РФ' }];

    // Add icon property to options for Select component compatibility
    const genderOptionsWithIcon = genderSelectOptions.map(opt => ({ ...opt, icon: '' }));
    const nationalityOptionsWithIcon = options.map(opt => ({ ...opt, icon: '' }));
    const docTypeOptionsWithIcon = options2.map(opt => ({ ...opt, icon: '' }));

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
                                        <p>Взрослый</p>
                                        <p>старше 17 лет</p>
                                    </div>
                                </div>

                                <div className={styles.bookingFormInputs}>
                                    <Input
                                        placeholder={'Фамилия латиницей'}
                                        value={params.tourist[index].surname}
                                        onChange={(e: string | number) => handleChangeTourist(e, 'surname', index)}
                                        required={true}
                                        error={errors.tourists?.[index]?.surname}
                                    />
                                    <Input
                                        placeholder={'Имя латиницей'}
                                        value={params.tourist[index].name}
                                        onChange={(e: string | number) => handleChangeTourist(e, 'name', index)}
                                        required={true}
                                        error={errors.tourists?.[index]?.name}
                                    />
                                    <Input
                                        placeholder={'Отчество латиницей'}
                                        value={params.tourist[index].patronymic}
                                        onChange={(e: string | number) => handleChangeTourist(e, 'patronymic', index)}
                                        required={true}
                                        error={errors.tourists?.[index]?.patronymic}
                                    />
                                </div>
                                <div className={styles.bookingFormInputs}>
                                    <DateInput
                                        label={'Дата рождения'}
                                        placeholder={'MM.DD.YYYY'}
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
                                            const selectedNationalityOption = options.find(opt => opt.value === params.tourist[index].nationality_id?.toString());
                                            const SelectProps = {
                                                isFull: true as const,
                                                options: nationalityOptionsWithIcon,
                                                value: selectedNationalityOption?.name || '',
                                                onChange: (option: string | SelectOption) => {
                                                    const selectedOption = typeof option === 'string'
                                                        ? options.find(opt => opt.value === option || opt.name === option)
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
                                            const selectedDocTypeOption = options2.find(opt => opt.value === params.tourist[index].doc_type);
                                            const SelectProps = {
                                                isFull: true as const,
                                                options: docTypeOptionsWithIcon,
                                                value: selectedDocTypeOption?.name || '',
                                                onChange: (option: string | SelectOption) => {
                                                    const selectedOption = typeof option === 'string'
                                                        ? options2.find(opt => opt.value === option || opt.name === option)
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
                                        placeholder={'Серия и номер документа'}
                                        value={params.tourist[index].passport_number}
                                        type={'number'}
                                        onChange={(e: string | number) => handleChangeTourist(e, 'passport_number', index)}
                                        required={true}
                                        max={999999999}
                                        maxLength={9}
                                        error={errors.tourists?.[index]?.passport_number}
                                    />
                                    <DateInput
                                        label={'Срок действия документа'}
                                        placeholder={'MM.DD.YYYY'}
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
