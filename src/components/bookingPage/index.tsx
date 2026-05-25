import styles from './booking.module.css';
import BookingOrderForm from "@/components/bookingPage/bookingForm";
import BookingOrderCard from "@/components/bookingPage/orderCard";
import { useEffect, useState, useMemo } from "react";
import { createOrder, PackagesActualize, PackagesActualizeFlight, validateTourist } from "@/api/levelTravelApi";
import { useRouter } from "next/router";
import useAuth from "@/hooks/useAuth";
import { validateBookingForm, isBookingFormValid, type Tourist, type BookingValidationErrors } from "@/utils/bookingValidation";
import { getSearchTypeFromQuery, isHotelOnlySearch } from "@/utils/bookingFlowUtils";

type Params = {
    email: string;
    phone: string;
    tourist: Tourist[];
};

type ValidationErrors = BookingValidationErrors;


const BookingCard = () => {
    const router = useRouter();
    const [packageData, setPackageData] = useState<{ adults_count?: number; kids_count?: number; kids_ages?: number[] } | null>(null);
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
        const packageId = router?.query?.package;
        if (!packageId) {
            setDataLoading(false);
            return;
        }

        const searchType = getSearchTypeFromQuery(router.query);
        const flightPairId = router?.query?.flight_pair_id;

        setDataLoading(true);

        const loadPackage = flightPairId
            ? PackagesActualizeFlight(packageId, flightPairId)
            : isHotelOnlySearch(searchType)
              ? PackagesActualize(packageId, { search_type: 'hotel' })
              : null;

        if (!loadPackage) {
            setDataLoading(false);
            return;
        }

        loadPackage
            .then((e) => {
                setPackageData(e.package);
                setDataLoading(false);
            })
            .catch(() => {
                setDataLoading(false);
            });
    }, [router?.query?.package, router?.query?.flight_pair_id, router?.query?.search_type]);

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
                    doc_type: "international_passport",
                    noPatronymic: false
                })
            }
            const kidsAges = packageData.kids_ages || [];
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
                    child_age: kidsAges[i] || undefined, // Store age from kids_ages array
                    doc_type: "international_passport",
                    noPatronymic: false
                })
            }
            setParams(prev => ({
                ...prev,
                tourist: allTourist,
            }));

        }

    }, [packageData]);

    const handleChangeTourist = (value: string | boolean | number, key: keyof Tourist, index: number) => {
        setParams(prevParams => {
            const updatedTourists = [...prevParams.tourist];
            updatedTourists[index] = {
                ...updatedTourists[index],
                [key]: value,
            };
            return {
                ...prevParams,
                tourist: updatedTourists,
            };
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

    // Check if form is valid using comprehensive validation utility
    const isFormValid = useMemo(() => {
        return isBookingFormValid({
            email: params.email,
            phone: params.phone,
            tourists: params.tourist
        });
    }, [params]);


    const validateForm = (): ValidationErrors => {
        return validateBookingForm({
            email: params.email,
            phone: params.phone,
            tourists: params.tourist
        });
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
            // Prepare tourists data - map to API format
            const touristsData = params.tourist.map((tourist) => {
                const passportNumber = tourist.passport_number.toString().replace(/\D/g, '');

                return {
                    surname: tourist.surname.trim(),
                    name: tourist.name.trim(),
                    patronymic: tourist.noPatronymic ? '' : tourist.patronymic.trim(),
                    birthday: tourist.birthday.trim(), // Format: DD.MM.YYYY
                    gender: tourist.gender,
                    nationality_id: tourist.nationality_id,
                    doc_type: tourist.doc_type,
                    document_number: passportNumber, // API expects document_number
                    document_expires_on: tourist.passport_expires_on.trim(), // Format: DD.MM.YYYY
                    passport_number: passportNumber, // API also expects passport_number
                    passport_expires_on: tourist.passport_expires_on.trim(), // Format: DD.MM.YYYY
                    child: tourist.child || false,
                    child_age: tourist.child_age,
                };
            });

            const data = {
                package_id: router?.query?.package,
                tourists: touristsData
            };

            const res = await validateTourist(data);

            if (!res?.valid) {
                setErrors({ general: 'Пожалуйста, введите корректные данные туриста' });
                setLoading(false);
                return;
            }

            const dataOrderCreate: Record<string, unknown> = {
                ...data,
                user_id: user?.id,
            };
            if (router?.query?.flight_pair_id) {
                dataOrderCreate.flight_pair_id = router.query.flight_pair_id;
            }

            if (res.valid) {
                // Create order
                const orderResult = await createOrder(dataOrderCreate);

                // Extract order_id from response
                // Response structure: { order: { id: ... } } or { id: ... } or { package: { id: ... } }
                const orderId = orderResult?.order?.id || orderResult?.id || orderResult?.package?.id;

                if (orderId) {
                    const checkoutQuery: Record<string, string> = { order_id: String(orderId) };
                    const searchType = getSearchTypeFromQuery(router.query);
                    if (isHotelOnlySearch(searchType)) {
                        checkoutQuery.search_type = 'hotel';
                    }
                    router.push({
                        pathname: '/checkout',
                        query: checkoutQuery,
                    });
                } else {
                    // If order_id is not found in response, show error
                    setErrors({ general: 'Заказ создан, но не удалось получить номер заказа. Пожалуйста, проверьте заказы в профиле.' });
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        } catch (error: any) {
            // Handle errors
            const errorMessage = error?.response?.data?.message || error?.message || 'Произошла ошибка при отправке заказа. Пожалуйста, попробуйте еще раз.';
            setErrors({ general: errorMessage });
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
