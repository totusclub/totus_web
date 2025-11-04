import styles from './booking.module.css';
import BookingOrderForm from "@/components/bookingPage/bookingForm";
import BookingOrderCard from "@/components/bookingPage/orderCard";
import {useEffect, useState} from "react";
import {createOrder, PackagesActualizeFlight, validateTourist} from "@/api/levelTravelApi";
import {useRouter} from "next/router";
import useAuth from "@/hooks/useAuth";

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


const BookingCard = () => {
    const router = useRouter();
    const [packageData, setPackageData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const {user,token} = useAuth()
    const [params, setParams] = useState<Params>({
        email: "",
        phone: "",
        tourist: []
    });

    useEffect(() => {
        if(router?.query?.package && router?.query?.flight_pair_id){
            PackagesActualizeFlight(router?.query?.package,router?.query?.flight_pair_id).then(e=>{
                setPackageData(e.package)
            })
        }

    }, [router]);


    useEffect(() => {
        if(packageData){
            let allTourist = [];
            for(let i=0; i<packageData?.adults_count; i++){
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
            for(let i=0; i<packageData?.kids_count; i++){
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
            setParams({
                ...params,
                tourist: allTourist,
            });

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
    };


    const handleChange = (value: string | number, key: keyof Params) => {
        setParams({ ...params, [key]: value });
    };


    const handleSubmit = async () => {
        setLoading(true)

       let data = {
            package_id:router?.query?.package,
           tourists:params?.tourist
        }
        const res = await validateTourist(data)
        if(!res?.valid){
            alert('Пожалуйста, введите корректные данные туриста')
        }

        let dataOtrderCreat = {...data,flight_pair_id:router?.query?.flight_pair_id,user_id:user?.id}
        if(res.valid){
             const c_order = await createOrder(dataOtrderCreat)
            setLoading(false)
            alert('Запрос отправлен успешно')
            router.push('/')
            // router.push(`checkout?order_id=${c_order?.order?.id}`)
        }else{
            setLoading(false)
        }

    }


    return (
        <div className={'content'}>
            <div className={styles.bookingScreen}>
                <BookingOrderForm handleChange={handleChange} handleChangeTourist={handleChangeTourist} params={params}/>
                <BookingOrderCard loading={loading} handleSubmit={handleSubmit} packageData={packageData}/>
            </div>
        </div>
    );
};

export default BookingCard;
