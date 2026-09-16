import styles from './booking.module.css';
import BookingOrderForm from "@/components/bookingPage/bookingForm";
import BookingOrderCard from "@/components/bookingPage/orderCard";
import { useEffect, useState, useMemo } from "react";
import { createOrder, PackagesActualize, PackagesActualizeFlight, Packagesflights, prebookPackage, prebuildOrder, validateTourist } from "@/api/levelTravelApi";
import { useRouter } from "next/router";
import useAuth from "@/hooks/useAuth";
import { validateBookingForm, flattenBookingErrors, mapLevelTravelTouristValidateErrors, type Tourist, type TouristErrors, type BookingValidationErrors } from "@/utils/bookingValidation";
import { getSearchTypeFromQuery, isHotelOnlySearch } from "@/utils/bookingFlowUtils";
import { toMoney } from "@/utils/packagePrice";

type Params = {
    email: string;
    phone: string;
    tourist: Tourist[];
};

type ValidationErrors = BookingValidationErrors;

/** Enrich LT package with fuel_charge from selected flight when actualize omits it. */
async function resolvePackageWithFlightFees(pkg: any, flightPairId?: string | string[]) {
    if (!pkg) return null;

    const pairId = Array.isArray(flightPairId) ? flightPairId[0] : flightPairId;
    const packageFuel = toMoney(pkg.fuel_charge);

    // No flight selected — hotel / package without concrete pair
    if (!pairId) {
        return {
            ...pkg,
            fuel_charge: packageFuel || toMoney(pkg.predicted_surcharge),
        };
    }

    // Actualize already returned fuel_charge for this flight
    if (packageFuel > 0) {
        return { ...pkg, fuel_charge: packageFuel };
    }

    // Look up surcharge from LT packages/flights for the selected pair
    try {
        const flightsRes = await Packagesflights({
            package_id: pkg.id || pkg.package_id,
        });
        const flights = flightsRes?.flights || [];
        const selected = flights.find(
            (f: any) => String(f?.flight_pair_id) === String(pairId),
        );
        return {
            ...pkg,
            fuel_charge: toMoney(selected?.fuel_charge),
        };
    } catch {
        return {
            ...pkg,
            fuel_charge: toMoney(pkg.predicted_surcharge),
        };
    }
}

const extractOrderIdFromResponse = (payload: any): string | null => {
    const direct =
        payload?.order?.id ||
        payload?.order_id ||
        payload?.id ||
        payload?.package?.order_id ||
        payload?.package?.id;

    if (direct !== undefined && direct !== null && String(direct).trim() !== '') {
        return String(direct);
    }

    return null;
};

const OFFER_UNAVAILABLE_MESSAGE =
    'Это предложение больше недоступно у туроператора. Вернитесь к выбору номера и выберите другой вариант.';

const ORDER_CREATE_FAILED_MESSAGE =
    'Не удалось создать заказ у туроператора. Пожалуйста, выберите предложение заново или попробуйте позже.';

const PREBOOK_FAILED_MESSAGE =
    'Не удалось закрепить бронь этого номера у поставщика. Пожалуйста, выберите другой вариант или попробуйте позже.';

/**
 * Level.Travel возвращает объект `package` и в теле отказа (`success: false`, `rotten: true`,
 * `package.available: false`, `exception`), поэтому наличие пакета ещё не значит, что предложение
 * можно забронировать. Возвращает текст ошибки или null, если предложение живое.
 */
const getOfferBlockReason = (payload: any): string | null => {
    if (!payload) return OFFER_UNAVAILABLE_MESSAGE;
    if (
        payload.success === false ||
        payload.rotten === true ||
        payload.package?.available === false
    ) {
        return OFFER_UNAVAILABLE_MESSAGE;
    }
    return null;
};

/** Достаёт текст ошибки из разных форм ответа (строка, { message }, { error }, { errors: [] }). */
const pickErrorText = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value.trim();
    if (Array.isArray(value)) return value.filter(Boolean).map(String).join('; ');
    if (typeof value === 'object') {
        return (
            pickErrorText(value.message) ||
            pickErrorText(value.error) ||
            pickErrorText(value.errors)
        );
    }
    return '';
};

const extractCreateErrorMessage = (payload: any): string => {
    const text =
        pickErrorText(payload?.error) ||
        pickErrorText(payload?.response?.data) ||
        pickErrorText(payload?.message);
    // Level.Travel: "Prebooking failed: unsuccessful prebook" — бронь у поставщика не закрепилась.
    if (/prebook/i.test(text)) return PREBOOK_FAILED_MESSAGE;
    return text ? `Не удалось создать заказ у туроператора: ${text}` : ORDER_CREATE_FAILED_MESSAGE;
};


const BookingCard = () => {
    const router = useRouter();
    const [packageData, setPackageData] = useState<{
        adults_count?: number;
        kids_count?: number;
        kids_ages?: number[];
        price?: number;
        display_price?: number;
        fuel_charge?: number;
        [key: string]: any;
    } | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const { user } = useAuth()
    const [params, setParams] = useState<Params>({
        email: "",
        phone: "",
        tourist: []
    });
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [showErrors, setShowErrors] = useState(false);

    useEffect(() => {
        const packageId = router?.query?.package;
        if (!router.isReady) return;
        if (!packageId) {
            setDataLoading(false);
            return;
        }

        const searchType = getSearchTypeFromQuery(router.query);
        const flightPairId = router?.query?.flight_pair_id;

        setDataLoading(true);

        const loadPackage = flightPairId
            ? PackagesActualizeFlight(packageId as any, flightPairId as any)
            : isHotelOnlySearch(searchType)
              ? PackagesActualize(packageId as any, { search_type: 'hotel' })
              : PackagesActualize(packageId as any, { search_type: 'package' });

        loadPackage
            .then(async (e) => {
                const blockReason = getOfferBlockReason(e);
                const pkg = e?.package || null;
                if (blockReason || !pkg) {
                    // Форму не показываем: бронировать протухшее предложение нельзя.
                    setPackageData(null);
                    setParams((prev) => ({ ...prev, tourist: [] }));
                    setErrors({ general: blockReason || OFFER_UNAVAILABLE_MESSAGE });
                    setDataLoading(false);
                    return;
                }

                setErrors((prev) => {
                    const next = { ...prev };
                    delete next.general;
                    return next;
                });

                // Price only from Level Travel: actualize + selected flight fuel_charge
                const resolved = await resolvePackageWithFlightFees(pkg, flightPairId);
                setPackageData(resolved);
                setDataLoading(false);
            })
            .catch(() => {
                setDataLoading(false);
            });
    }, [
        router.isReady,
        router?.query?.package,
        router?.query?.flight_pair_id,
        router?.query?.search_type,
    ]);

    useEffect(() => {
        if (!packageData) return;

        const adultsCount = packageData.adults_count || 0;
        const kidsCount = packageData.kids_count || 0;
        const expectedCount = adultsCount + kidsCount;
        if (expectedCount <= 0) return;

        setParams((prev) => {
            // Do not wipe filled tourist data on package re-actualize / price updates
            if (prev.tourist.length === expectedCount) {
                return prev;
            }

            const allTourist: Tourist[] = [];
            for (let i = 0; i < adultsCount; i++) {
                allTourist.push({
                    gender: 'F',
                    name: '',
                    surname: '',
                    patronymic: '',
                    birthday: '',
                    passport_number: '',
                    passport_expires_on: '',
                    nationality_id: 225,
                    child: false,
                    doc_type: 'international_passport',
                    noPatronymic: false,
                });
            }

            const kidsAges = packageData.kids_ages || [];
            for (let i = 0; i < kidsCount; i++) {
                allTourist.push({
                    gender: 'F',
                    name: '',
                    surname: '',
                    patronymic: '',
                    birthday: '',
                    passport_number: '',
                    passport_expires_on: '',
                    nationality_id: 225,
                    child: true,
                    child_age: kidsAges[i] || undefined,
                    doc_type: 'international_passport',
                    noPatronymic: false,
                });
            }

            return {
                ...prev,
                tourist: allTourist,
            };
        });
    }, [
        packageData?.adults_count,
        packageData?.kids_count,
        packageData?.kids_ages,
        packageData?.id,
    ]);

    const handleChangeTourist = (value: string | boolean | number, key: keyof Tourist, index: number) => {
        setShowErrors(true);
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

        // Clear API / field error for the edited field only — keep the rest of the form
        setErrors(prev => {
            const next = { ...prev };
            if (next.general) delete next.general;

            if (next.tourists?.[index]?.[key as keyof TouristErrors]) {
                const tourists = { ...next.tourists };
                const touristErrors = { ...tourists[index] };
                delete touristErrors[key as keyof TouristErrors];
                if (Object.keys(touristErrors).length === 0) {
                    delete tourists[index];
                } else {
                    tourists[index] = touristErrors;
                }
                if (Object.keys(tourists).length === 0) {
                    delete next.tourists;
                } else {
                    next.tourists = tourists;
                }
            }

            return next;
        });
    };


    const handleChange = (value: string | number, key: keyof Params) => {
        setShowErrors(true);
        setParams({ ...params, [key]: value });

        setErrors(prev => {
            const next = { ...prev };
            if (next.general) delete next.general;
            if (key === 'email' || key === 'phone') {
                delete next[key];
            }
            return next;
        });
    };

    // Check if form is valid using comprehensive validation utility
    const liveValidationErrors = useMemo(() => {
        return validateBookingForm({
            email: params.email,
            phone: params.phone,
            tourists: params.tourist
        });
    }, [params]);

    const isFormValid = useMemo(() => {
        return Object.keys(liveValidationErrors).length === 0 && params.tourist.length > 0;
    }, [liveValidationErrors, params.tourist.length]);

    const bottomErrorMessages = useMemo(() => {
        const messages: string[] = [];

        // Level Travel / submit API comments (general + field)
        if (errors.general || errors.tourists) {
            messages.push(
                ...flattenBookingErrors({
                    general: errors.general,
                    tourists: errors.tourists,
                }),
            );
        }

        if (showErrors) {
            messages.push(
                ...flattenBookingErrors({
                    ...liveValidationErrors,
                    general: undefined,
                }),
            );
        }

        return Array.from(new Set(messages.filter(Boolean)));
    }, [errors.general, errors.tourists, liveValidationErrors, showErrors]);

    /** Field errors shown under inputs — live validation + kept API messages. */
    const displayedFieldErrors = useMemo((): ValidationErrors => {
        if (!showErrors) return {};

        const next: ValidationErrors = { ...liveValidationErrors };
        if (errors.general) next.general = errors.general;
        if (errors.email && !next.email) next.email = errors.email;
        if (errors.phone && !next.phone) next.phone = errors.phone;

        if (errors.tourists) {
            const merged: NonNullable<ValidationErrors['tourists']> = {
                ...(next.tourists || {}),
            };

            Object.entries(errors.tourists).forEach(([indexKey, fields]) => {
                const index = Number(indexKey);
                const liveFields = merged[index] || {};
                const kept: TouristErrors = { ...liveFields };

                Object.entries(fields).forEach(([field, message]) => {
                    const key = field as keyof TouristErrors;
                    if (!liveFields[key] && message) {
                        kept[key] = message;
                    }
                });

                if (Object.keys(kept).length > 0) {
                    merged[index] = kept;
                }
            });

            if (Object.keys(merged).length > 0) {
                next.tourists = merged;
            }
        }

        return next;
    }, [showErrors, liveValidationErrors, errors]);

    // Keep errors state aligned with live validation for submit / API merge paths
    useEffect(() => {
        if (!showErrors) return;
        setErrors((prev) => {
            const next: ValidationErrors = { ...liveValidationErrors };
            if (prev.general) next.general = prev.general;

            if (prev.tourists) {
                const merged: NonNullable<ValidationErrors['tourists']> = {
                    ...(next.tourists || {}),
                };

                Object.entries(prev.tourists).forEach(([indexKey, fields]) => {
                    const index = Number(indexKey);
                    const liveFields = merged[index] || {};
                    const kept: TouristErrors = { ...liveFields };

                    Object.entries(fields).forEach(([field, message]) => {
                        const key = field as keyof TouristErrors;
                        if (!liveFields[key] && message) {
                            kept[key] = message;
                        }
                    });

                    if (Object.keys(kept).length > 0) {
                        merged[index] = kept;
                    }
                });

                if (Object.keys(merged).length > 0) {
                    next.tourists = merged;
                }
            }

            return next;
        });
    }, [liveValidationErrors, showErrors]);

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

        setShowErrors(true);

        // Validate form
        const validationErrors = validateForm();
        const hasFieldErrors =
            Boolean(validationErrors.email) ||
            Boolean(validationErrors.phone) ||
            Boolean(validationErrors.general) ||
            Boolean(validationErrors.tourists && Object.keys(validationErrors.tourists).length > 0);

        if (hasFieldErrors || !isFormValid) {
            setErrors(validationErrors);

            // Scroll to bottom error block near submit button
            setTimeout(() => {
                const errorBlock = document.querySelector(`.${styles.formErrorsBottom}`);
                if (errorBlock) {
                    errorBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                }
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
            const packageId = router?.query?.package;
            const flightPairId = router?.query?.flight_pair_id;
            const searchType = getSearchTypeFromQuery(router.query);
            // packageData из состояния не обновится внутри этого обработчика — держим свежий пакет локально
            let actualPackage: any = packageData;

            // 1) Fresh actualize before create (required by LT docs every 15–20 min)
            try {
                const actualizeResult = flightPairId
                    ? await PackagesActualizeFlight(packageId as never, flightPairId as never)
                    : await PackagesActualize(packageId as never, {
                        search_type: isHotelOnlySearch(searchType) ? 'hotel' : 'package',
                    });

                const blockReason = getOfferBlockReason(actualizeResult);
                if (blockReason) {
                    setErrors({ general: blockReason });
                    setLoading(false);
                    return;
                }

                if (actualizeResult?.package) {
                    const resolved = await resolvePackageWithFlightFees(
                        actualizeResult.package,
                        flightPairId as string | string[] | undefined,
                    );
                    actualPackage = resolved;
                    setPackageData(resolved);
                }
            } catch {
                setErrors({ general: 'Не удалось актуализировать предложение. Пожалуйста, попробуйте еще раз.' });
                setLoading(false);
                return;
            }

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

            const firstAdult = params.tourist.find((t) => !t.child) || params.tourist[0];
            const client = {
                name: (firstAdult?.name || '').trim(),
                surname: (firstAdult?.surname || '').trim(),
                email: params.email.trim(),
                phone: params.phone.toString().replace(/\D/g, ''),
                bonus_score: 0,
            };

            const data = {
                package_id: packageId,
                tourists: touristsData,
            };

            // 2) Validate tourists — keep filled form; only set error comments
            const res = await validateTourist(data);

            const ltErrorPayload =
                res?.response?.data ??
                (res?.success === false || res?.valid === false || res?.error ? res : null);

            const touristValidationFailed =
                res?.valid === false ||
                res?.is_valid === false ||
                res?.success === false ||
                res?.error?.valid === false ||
                res?.isAxiosError === true ||
                Boolean(ltErrorPayload?.error?.errors);

            if (touristValidationFailed) {
                const mapped = mapLevelTravelTouristValidateErrors(res);
                setShowErrors(true);
                setErrors(mapped);
                setLoading(false);
                setTimeout(() => {
                    const errorBlock = document.querySelector(`.${styles.formErrorsBottom}`);
                    if (errorBlock) {
                        errorBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        return;
                    }
                    const firstErrorElement = document.querySelector('[aria-invalid="true"]');
                    if (firstErrorElement) {
                        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
                return;
            }

            const orderPayload: Record<string, unknown> = {
                package_id: packageId,
                client,
                tourists: touristsData,
                payment_option: 'sbp',
                selected_extras: [],
                bonuses_granted: 0,
                comment: '',
            };
            if (flightPairId) {
                orderPayload.flight_pair_id = flightPairId;
            } else {
                orderPayload.flight_pair_id = null;
            }

            // 3) Prebuild order (final price / validity check)
            try {
                const prebuildResult = await prebuildOrder(orderPayload);
                if (
                    prebuildResult?.success === false ||
                    prebuildResult?.order_valid === false
                ) {
                    const prebuildError =
                        (typeof prebuildResult?.order_errors === 'object' &&
                            prebuildResult.order_errors &&
                            Object.values(prebuildResult.order_errors).flat().join('; ')) ||
                        prebuildResult?.error?.message ||
                        prebuildResult?.message ||
                        'Не удалось проверить заказ. Проверьте данные и попробуйте снова.';
                    setErrors({ general: String(prebuildError) });
                    setLoading(false);
                    return;
                }

                if (prebuildResult?.order) {
                    const prebuildPkg = prebuildResult.order.package || {};
                    setPackageData((prev) => ({
                        ...(prev || {}),
                        ...prebuildPkg,
                        // Keep LT base price; do not replace with full_price (loses fee breakdown)
                        price: toMoney(prebuildPkg.price) || toMoney(prev?.price),
                        fuel_charge:
                            toMoney(prebuildPkg.fuel_charge) ||
                            toMoney(prev?.fuel_charge) ||
                            toMoney(prebuildPkg.predicted_surcharge),
                        full_price:
                            toMoney(prebuildResult.order.full_price) ||
                            toMoney(prebuildResult.order.remaining_amount),
                    }));
                }
            } catch (prebuildError: any) {
                const message =
                    prebuildError?.response?.data?.error?.message ||
                    prebuildError?.response?.data?.message ||
                    prebuildError?.message ||
                    'Не удалось выполнить предпросмотр заказа.';
                setErrors({ general: String(message) });
                setLoading(false);
                return;
            }

            // 4) Prebook — бронь у поставщика. Нужен и турам с регулярными рейсами, и отельным
            // пакетам Level.Travel (оператор 78): без него orders/create отвечает
            // "Prebooking failed: unsuccessful prebook". prebook_data (book_hash) появляется
            // только в ответе actualize, поэтому берём его из actualPackage, а не из состояния.
            // Если у партнёрского токена нет доступа к версии API с prebook, шаг пропускается
            // (skippable) — как было раньше.
            try {
                const misc = (actualPackage as any)?.misc_data || {};
                const prebookResult = await prebookPackage({
                    package_id: packageId,
                    ...(flightPairId ? { flight_pair_id: flightPairId } : {}),
                    client,
                    tourists: touristsData,
                    prebook_data: {
                        ...(misc.book_hash ? { book_hash: misc.book_hash } : {}),
                        ...(misc.bundle_id ? { bundle_id: misc.bundle_id } : {}),
                        ...(misc.route_component_id
                            ? { route_component_id: misc.route_component_id }
                            : {}),
                        ...(misc.acm_component_id ? { acm_component_id: misc.acm_component_id } : {}),
                        ...(misc.operator_organization_id
                            ? { operator_organization_id: String(misc.operator_organization_id) }
                            : {}),
                        ...(misc.supplier_id != null ? { supplier_id: misc.supplier_id } : {}),
                    },
                });

                const prebookErrorText = String(
                    typeof prebookResult?.error === 'string'
                        ? prebookResult.error
                        : prebookResult?.error?.message ||
                              prebookResult?.message ||
                              '',
                );
                const canSkipPrebook =
                    prebookResult?.skippable === true ||
                    /incorrect api version|api version|not supported|недоступ/i.test(
                        prebookErrorText,
                    );

                if (prebookResult?.success === false || prebookResult?.isAxiosError) {
                    if (canSkipPrebook) {
                        console.warn(
                            'Prebook skipped (partner/API limitation):',
                            prebookErrorText || prebookResult,
                        );
                    } else {
                        const prebookMessage = flightPairId
                            ? prebookErrorText ||
                              'Не удалось забронировать перелёт у туроператора. Попробуйте другой рейс.'
                            : PREBOOK_FAILED_MESSAGE;
                        setErrors({ general: String(prebookMessage) });
                        setLoading(false);
                        return;
                    }
                }

                if (prebookResult?.booking_id) {
                    orderPayload.booking_id = prebookResult.booking_id;
                }
            } catch (prebookError: any) {
                const message =
                    prebookError?.response?.data?.error?.message ||
                    prebookError?.response?.data?.error ||
                    prebookError?.response?.data?.message ||
                    prebookError?.message ||
                    '';
                const canSkip =
                    prebookError?.response?.data?.skippable === true ||
                    /incorrect api version|api version|not supported|недоступ/i.test(
                        String(message),
                    );

                if (canSkip) {
                    console.warn('Prebook skipped after exception:', message);
                } else {
                    setErrors({
                        general: flightPairId
                            ? String(message || 'Не удалось выполнить пребук перелёта.')
                            : PREBOOK_FAILED_MESSAGE,
                    });
                    setLoading(false);
                    return;
                }
            }

            const dataOrderCreate: Record<string, unknown> = {
                ...data,
                client,
                email: client.email,
                phone: client.phone,
                user_id: user?.id,
                payment_option: 'sbp',
            };
            if (flightPairId) {
                dataOrderCreate.flight_pair_id = flightPairId;
            }
            if (orderPayload.booking_id) {
                dataOrderCreate.booking_id = orderPayload.booking_id;
            }

            // 5) Create order after successful validation / prebuild / (optional) prebook
            const orderResult = await createOrder(dataOrderCreate);

            // totus_API отдаёт отказ Level.Travel как 200 { error: ... } — это не успех.
            const createFailed =
                orderResult?.success === false ||
                orderResult?.isAxiosError === true ||
                Boolean(orderResult?.error);

            if (createFailed) {
                console.warn('Order create failed:', orderResult);
                setErrors({ general: extractCreateErrorMessage(orderResult) });
                setLoading(false);
                return;
            }

            // Номер заказа берём только из ответа на создание. Прежний fallback
            // «взять последний заказ пользователя» уводил на уже существующий чужой заказ,
            // когда Level.Travel отказывал в создании нового.
            const orderId = extractOrderIdFromResponse(orderResult);

            if (!orderId) {
                setErrors({ general: ORDER_CREATE_FAILED_MESSAGE });
                setLoading(false);
                return;
            }

            // Persist buyer contacts for checkout (what user typed on booking)
            try {
                sessionStorage.setItem(
                    `checkout_buyer_${orderId}`,
                    JSON.stringify({
                        email: client.email,
                        phone: client.phone,
                        name: [client.name, client.surname].filter(Boolean).join(' ').trim(),
                    }),
                );
            } catch {
                // ignore storage errors
            }

            const checkoutQuery: Record<string, string> = {
                order_id: String(orderId),
                email: client.email,
                phone: client.phone,
            };
            if (isHotelOnlySearch(searchType)) {
                checkoutQuery.search_type = 'hotel';
            }
            await router.push({
                pathname: '/checkout',
                query: checkoutQuery,
            });
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
                <div style={{ display: 'flex', gap: '20px', width: '100%', flexWrap: 'wrap' }}>
                    <BookingOrderForm
                        handleChange={handleChange}
                        handleChangeTourist={handleChangeTourist}
                        params={params}
                        dataLoading={dataLoading}
                        errors={displayedFieldErrors}
                    />
                    <BookingOrderCard
                        loading={loading}
                        handleSubmit={handleSubmit}
                        packageData={packageData}
                        dataLoading={dataLoading}
                        isFormValid={isFormValid}
                        errorMessages={bottomErrorMessages}
                    />
                </div>
            </div>
        </div>
    );
};

export default BookingCard;
