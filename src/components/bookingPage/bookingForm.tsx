import styles from './booking.module.css';
import Input from "@/components/UI/input";
import { useState } from "react";
import ItemSwitch from "@/components/UI/itemSwitch";
import Options from "@/components/UI/options";
import Select from "@/components/UI/select";

type GenderOption = {
    id: string;
    name: string;
};

type Tourist = {
    name: string;
    lastName: string;
    surNameSwitch: boolean;
    surName: string;
    birthDate: string;
    gender: string | null;
    passport: string;
    passportDate: string;
};

type Params = {
    email: string;
    phone: string;
    tourist: Tourist[];
};

const genderOptions: GenderOption[] = [
    { id: 'male', name: 'Мужской' },
    { id: 'female', name: 'Женский' },
];

const BookingOrderForm = () => {
    const [selected, setSelected] = useState<string>('');

    const options = [{ value: 'RUB', name: 'Россия' }];

    const [params, setParams] = useState<Params>({
        email: "",
        phone: "",
        tourist: [
            {
                name: "",
                lastName: "",
                surNameSwitch: false,
                surName: '',
                birthDate: '',
                gender: null,
                passport: '',
                passportDate: ''
            },
            {
                name: "",
                lastName: "",
                surNameSwitch: false,
                surName: '',
                birthDate: '',
                gender: null,
                passport: '',
                passportDate: ''
            },
        ]
    });

    const handleChangeTourist = (value: string | boolean | number, key: keyof Tourist, index: number) => {
        const updatedTourists = [...params.tourist];
        updatedTourists[index] = {
            ...updatedTourists[index],
            [key]: value,
        };
        setParams({
            ...params,
            tourist: updatedTourists,
        });
    };

    const handleChange = (value: string | number, key: keyof Params) => {
        setParams({ ...params, [key]: value });
    };

    return (
        <div className={styles.bookingForm}>
            <div className={styles.bookingFormCard}>
                <p className={styles.bookingFormCardTitle}>Контакты покупателя</p>
                <p className={styles.bookingFormCardSubTitle}>Для получения документов к туру</p>
                <div className={styles.bookingFormInputs}>
                    <Input
                        placeholder={'Электронная почта'}
                        value={params.email}
                        onChange={(e: string | number) => handleChange(e, 'email')}
                    />
                    <Input
                        placeholder={'Телефон'}
                        value={params.phone}
                        onChange={(e: string | number) => handleChange(e, 'phone')}
                    />
                </div>
            </div>

            <div className={styles.bookingFormCard}>
                <p className={styles.bookingFormCardTitle}>Туристы</p>
                <p className={styles.bookingFormCardSubTitle}>
                    Заполните данные в точности так, как в документе, по которому полетите
                </p>
                <div className={styles.bookingLineForm} />

                {params.tourist.map((_, index) => (
                    <div key={index} className={styles.bookingFormInputsList}>
                        <div className={styles.bookingFormTourist}>
                            <div className={styles.bookingFormTouristInfo}>
                                <p>Взрослый</p>
                                <p>старше 17 лет</p>
                            </div>
                            <div className={styles.outlineButton}>
                                <p>Выбрать туриста</p>
                            </div>
                        </div>

                        <div className={styles.bookingFormInputs}>
                            <Input
                                placeholder={'Фамилия латиницей'}
                                value={params.tourist[index].lastName}
                                onChange={(e: string | number) => handleChangeTourist(e, 'lastName', index)}
                            />
                            <Input
                                placeholder={'Имя латиницей'}
                                value={params.tourist[index].name}
                                onChange={(e: string | number) => handleChangeTourist(e, 'name', index)}
                            />
                        </div>

                        <div className={styles.bookingFormInputs}>
                            <Input
                                placeholder={'Отчество латиницей'}
                                value={params.tourist[index].surName}
                                onChange={(e: string | number) => handleChangeTourist(e, 'surName', index)}
                            />
                            <ItemSwitch
                                isFull={true}
                                title={'Нет отчества'}
                                isOn={params.tourist[index].surNameSwitch}
                                setIsOn={(e: boolean) => handleChangeTourist(e, 'surNameSwitch', index)}
                            />
                        </div>

                        <div className={styles.bookingFormInputs}>
                            <Input
                                placeholder={'Дата рождения'}
                                value={params.tourist[index].birthDate}
                                onChange={(e: string | number) => handleChangeTourist(e, 'birthDate', index)}
                            />
                            <Options
                                title={'Пол:'}
                                options={genderOptions}
                                onSelect={(option) => handleChangeTourist(option.id, 'gender', index)}
                            />

                        </div>

                        <div className={styles.bookingFormInputs}>
                            <Select
                                isFull
                                options={options}
                                value={selected}
                                onChange={setSelected}
                                label="Гражданство"
                                placeholder="Россия"
                            />
                            <Select
                                isFull={true}
                                options={options}
                                value={selected}
                                onChange={setSelected}
                                label={'Документ'}
                                placeholder="Заграничный паспорт РФ"
                            />
                        </div>

                        <div className={styles.bookingFormInputs}>
                            <Input
                                placeholder={'Серия и номер документа'}
                                value={params.tourist[index].passport}
                                onChange={(e: string | number) => handleChangeTourist(e, 'passport', index)}
                            />
                            <Input
                                placeholder={'Срок действия'}
                                value={params.tourist[index].passportDate}
                                onChange={(e: string | number) => handleChangeTourist(e, 'passportDate', index)}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BookingOrderForm;
