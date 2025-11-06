import styles from './booking.module.css';
import BookingOrderForm from "@/components/bookingPage/bookingForm";
import BookingOrderCard from "@/components/bookingPage/orderCard";
import { useEffect, useState, useMemo } from "react";
import { createOrder, PackagesActualizeFlight, validateTourist } from "@/api/levelTravelApi";
import { useRouter } from "next/router";
import useAuth from "@/hooks/useAuth";

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


const BookingCard = () => {
    const router = useRouter();
    const [packageData, setPackageData] = useState<{ adults_count?: number; kids_count?: number } | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const { user } = useAuth()
    const [params, setParams] = useState<Params>({
        email: "",
        phone: "",
        tourist: []
    });
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        if (router?.query?.package && router?.query?.flight_pair_id) {
            setDataLoading(true);
            PackagesActualizeFlight(router?.query?.package, router?.query?.flight_pair_id).then(e => {
                setPackageData(e.package)
                setDataLoading(false);
            }).catch(() => {
                setDataLoading(false);
            })
        } else {
            setDataLoading(false);
        }

    }, [router]);


    useEffect(() => {
        if (packageData) {
            const allTourist: Tourist[] = [];
            const adultsCount = packageData.adults_count || 0;
            const kidsCount = packageData.kids_count || 0;

            for (let i = 0; i < adultsCount; i++) {
                allTourist.push({
                    gender: "F",
                    name: "",
                    surname: "",
                    patronymic: "",
                    birthday: "",
                    passport_number: "",
                    passport_expires_on: "",
                    nationality_id: 225,
                    child: false,
                    doc_type: "international_passport"
                })
            }
            for (let i = 0; i < kidsCount; i++) {
                allTourist.push({
                    gender: "F",
                    name: "",
                    surname: "",
                    patronymic: "",
                    birthday: "",
                    passport_number: "",
                    passport_expires_on: "",
                    nationality_id: 225,
                    child: true,
                    doc_type: "international_passport"
                })
            }
            setParams(prev => ({
                ...prev,
                tourist: allTourist,
            }));

        }

    }, [packageData]);

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

        // Clear error for this field when user changes it
        const errorKey = key as 'surname' | 'name' | 'patronymic' | 'birthday' | 'gender' | 'nationality_id' | 'doc_type' | 'passport_number' | 'passport_expires_on';
        if (errors.tourists?.[index]?.[errorKey]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                if (newErrors.tourists?.[index]) {
                    const touristErrors = { ...newErrors.tourists[index] };
                    delete touristErrors[errorKey];
                    if (Object.keys(touristErrors).length === 0) {
                        const tourists = { ...newErrors.tourists };
                        delete tourists[index];
                        if (Object.keys(tourists).length === 0) {
                            delete newErrors.tourists;
                        } else {
                            newErrors.tourists = tourists;
                        }
                    } else {
                        newErrors.tourists = { ...newErrors.tourists, [index]: touristErrors };
                    }
                }
                return newErrors;
            });
        }
    };


    const handleChange = (value: string | number, key: keyof Params) => {
        setParams({ ...params, [key]: value });

        // Clear error for this field when user changes it
        if (errors[key as keyof ValidationErrors]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[key as keyof ValidationErrors];
                return newErrors;
            });
        }
    };

    // Check if form is valid (all required fields filled) - recalculates when params change
    const isFormValid = useMemo(() => {
        // Check email
        if (!params.email || typeof params.email !== 'string' || params.email.trim() === '') {
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(params.email.trim())) {
            return false;
        }

        // Check phone
        if (!params.phone || params.phone.toString().trim() === '') {
            return false;
        }

        // Check tourists array
        if (!params.tourist || params.tourist.length === 0) {
            return false;
        }

        // Check all tourist fields
        for (let i = 0; i < params.tourist.length; i++) {
            const tourist = params.tourist[i];
            if (!tourist.surname || typeof tourist.surname !== 'string' || tourist.surname.trim() === '') return false;
            if (!tourist.name || typeof tourist.name !== 'string' || tourist.name.trim() === '') return false;
            if (!tourist.patronymic || typeof tourist.patronymic !== 'string' || tourist.patronymic.trim() === '') return false;
            if (!tourist.birthday || typeof tourist.birthday !== 'string' || tourist.birthday.trim() === '') return false;
            if (!tourist.gender || tourist.gender === null || tourist.gender === '') return false;
            if (!tourist.nationality_id || tourist.nationality_id === null || tourist.nationality_id === undefined) return false;
            if (!tourist.doc_type || typeof tourist.doc_type !== 'string' || tourist.doc_type.trim() === '') return false;
            if (!tourist.passport_number || tourist.passport_number.toString().trim() === '') return false;
            if (!tourist.passport_expires_on || typeof tourist.passport_expires_on !== 'string' || tourist.passport_expires_on.trim() === '') return false;
        }

        return true;
    }, [params]);


    const validateForm = (): ValidationErrors => {
        const validationErrors: ValidationErrors = {};

        // Validate email
        if (!params.email || typeof params.email !== 'string' || params.email.trim() === '') {
            validationErrors.email = 'Пожалуйста, заполните электронную почту';
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(params.email.trim())) {
                validationErrors.email = 'Пожалуйста, введите корректный email адрес';
            }
        }

        // Validate phone
        if (!params.phone || params.phone.toString().trim() === '') {
            validationErrors.phone = 'Пожалуйста, заполните телефон';
        } else {
            const phoneCleaned = params.phone.toString().replace(/\D/g, '');
            if (phoneCleaned.length !== 11 || !phoneCleaned.startsWith('7')) {
                validationErrors.phone = 'Пожалуйста, введите корректный номер телефона (11 цифр, начинается с 7)';
            }
        }

        // Validate tourists array
        if (!params.tourist || params.tourist.length === 0) {
            validationErrors.general = 'Пожалуйста, добавьте данные туристов';
        } else {
            const touristErrors: NonNullable<ValidationErrors['tourists']> = {};
            const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;

            for (let i = 0; i < params.tourist.length; i++) {
                const tourist = params.tourist[i];
                const errors: NonNullable<ValidationErrors['tourists']>[number] = {};

                if (!tourist.surname || typeof tourist.surname !== 'string' || tourist.surname.trim() === '') {
                    errors.surname = 'Пожалуйста, заполните фамилию';
                }
                if (!tourist.name || typeof tourist.name !== 'string' || tourist.name.trim() === '') {
                    errors.name = 'Пожалуйста, заполните имя';
                }
                if (!tourist.patronymic || typeof tourist.patronymic !== 'string' || tourist.patronymic.trim() === '') {
                    errors.patronymic = 'Пожалуйста, заполните отчество';
                }
                if (!tourist.birthday || typeof tourist.birthday !== 'string' || tourist.birthday.trim() === '') {
                    errors.birthday = 'Пожалуйста, заполните дату рождения';
                } else if (!dateRegex.test(tourist.birthday.trim())) {
                    errors.birthday = 'Введите дату в формате MM.DD.YYYY (например, 01.20.2025)';
                }
                if (!tourist.gender || tourist.gender === null || tourist.gender === '') {
                    errors.gender = 'Пожалуйста, выберите пол';
                }
                if (!tourist.nationality_id || tourist.nationality_id === null || tourist.nationality_id === undefined) {
                    errors.nationality_id = 'Пожалуйста, выберите гражданство';
                }
                if (!tourist.doc_type || typeof tourist.doc_type !== 'string' || tourist.doc_type.trim() === '') {
                    errors.doc_type = 'Пожалуйста, выберите тип документа';
                }
                if (!tourist.passport_number || tourist.passport_number.toString().trim() === '') {
                    errors.passport_number = 'Пожалуйста, заполните серию и номер документа';
                } else {
                    const passportNumberStr = tourist.passport_number.toString().replace(/\D/g, '');
                    if (passportNumberStr.length !== 9) {
                        errors.passport_number = 'Серия и номер документа должна содержать 9 цифр';
                    }
                }
                if (!tourist.passport_expires_on || typeof tourist.passport_expires_on !== 'string' || tourist.passport_expires_on.trim() === '') {
                    errors.passport_expires_on = 'Пожалуйста, заполните срок действия документа';
                } else if (!dateRegex.test(tourist.passport_expires_on.trim())) {
                    errors.passport_expires_on = 'Введите дату в формате MM.DD.YYYY (например, 01.20.2025)';
                }

                if (Object.keys(errors).length > 0) {
                    touristErrors[i] = errors;
                }
            }

            if (Object.keys(touristErrors).length > 0) {
                validationErrors.tourists = touristErrors;
            }
        }

        return validationErrors;
    };

    const handleSubmit = async () => {
        // Prevent submission if loading
        if (loading) {
            return;
        }

        // Validate form
        const validationErrors = validateForm();

        if (Object.keys(validationErrors).length > 0 || validationErrors.tourists) {
            setErrors(validationErrors);

            // Scroll to first error
            setTimeout(() => {
                const firstErrorElement = document.querySelector('[aria-invalid="true"]');
                if (firstErrorElement) {
                    firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);

            return;
        }

        // Clear errors before submission
        setErrors({});

        // All validations passed, proceed with submission
        setLoading(true);

        try {
            const data = {
                package_id: router?.query?.package,
                tourists: params?.tourist
            };

            const res = await validateTourist(data);

            if (!res?.valid) {
                setErrors({ general: 'Пожалуйста, введите корректные данные туриста' });
                setLoading(false);
                return;
            }

            const dataOtrderCreat = { ...data, flight_pair_id: router?.query?.flight_pair_id, user_id: user?.id };

            if (res.valid) {
                await createOrder(dataOtrderCreat);
                setLoading(false);
                // Success - redirect to home
                router.push('/');
                // router.push(`checkout?order_id=${c_order?.order?.id}`)
            } else {
                setLoading(false);
            }
        } catch {
            setErrors({ general: 'Произошла ошибка при отправке заказа. Пожалуйста, попробуйте еще раз.' });
            setLoading(false);
        }
    }


    return (
        <div className={'content'}>
            <div className={styles.bookingScreen}>
                {errors.general && (
                    <div className={styles.errorBanner}>
                        <p>{errors.general}</p>
                    </div>
                )}
                <div style={{ display: 'flex', gap: '20px', width: '100%', flexWrap: 'wrap' }}>
                    <BookingOrderForm
                        handleChange={handleChange}
                        handleChangeTourist={handleChangeTourist}
                        params={params}
                        dataLoading={dataLoading}
                        errors={errors}
                    />
                    <BookingOrderCard loading={loading} handleSubmit={handleSubmit} packageData={packageData} dataLoading={dataLoading} isFormValid={isFormValid} />
                </div>
            </div>
        </div>
    );
};

export default BookingCard;
