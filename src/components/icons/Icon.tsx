import dynamic from 'next/dynamic';
import TotusIcon from './totus/TotusIcon';
import type { TotusIconDef } from './totus/icons.generated';
import * as T from './totus/icons.generated';
import LogoIcon from './logo'
import CircleIcon from "./circle";
import AppStoreIcon from "@/components/icons/appStore";
import GooglePlayIcon from "@/components/icons/googlePlay";
import FbIcon from "@/components/icons/fb";
import XIcon from "@/components/icons/x";
import InstagramIcon from "@/components/icons/instagram";
import YoutubeIcon from "@/components/icons/youtube";
import LineIcon from "@/components/icons/line";
import TravelIcon from "@/components/icons/travel";
import VerifyIcon from "@/components/icons/verify";
import Prev from "@/components/icons/prev";
import MasterIcon from "@/components/icons/master";
import VisaIcon from "@/components/icons/visa";
import MirIcon from "@/components/icons/mir";
import VkIcon from "@/components/icons/vk";
import VcIcon from "@/components/icons/vc";
import AiStarIcon from "@/components/icons/aiStar";
import RutubeIcon from "@/components/icons/rutube";
import SupportIcon from '@/components/icons/support';
import RecomendIcon from '@/components/icons/recomend';
import DearIcon from '@/components/icons/dear';
import CheapIcon from '@/components/icons/cheap';
import ReatingIcon from '@/components/icons/reating';
import BirdIcon from '@/components/icons/bird';
import RuStoreIcon from "@/components/icons/ruStore";

// Логотипы туроператоров (onexTour ~51 КБ, biblioGlobus ~19 КБ…) — отдельными чанками:
// на главной партнёры приходят картинками из API, в общий бандл каждой страницы эти SVG не нужны.
const tezTour = dynamic(() => import("@/components/icons/partner/tezTour"));
const onexTour = dynamic(() => import("@/components/icons/partner/onexTour"));
const funAndSun = dynamic(() => import("@/components/icons/partner/funAndSun"));
const biblioGlobus = dynamic(() => import("@/components/icons/partner/biblioGlobus"));
const pegasTour = dynamic(() => import("@/components/icons/partner/pegasTour"));
const coralTravel = dynamic(() => import("@/components/icons/partner/coralTravel"));


/**
 * Пиктограммы — из набора Totus (стиль C, components/icons/totus). Старое имя → иконка набора.
 * Где у одного старого имени разный смысл, добавлены отдельные имена (reviews, download, nights…).
 * Звёзды отеля залиты, как раньше (решение владельца 15.10.2026).
 */
const TOTUS: Record<string, TotusIconDef> = {
    back: T.iconBack,
    next: T.iconChevronRight,
    rightArrow: T.iconChevronRight,
    leftArrow: T.iconChevronLeft,
    downArrow: T.iconChevronDown,
    upArrow: T.iconChevronUp,
    close: T.iconClose,
    closeLine: T.iconClose,
    burger: T.iconMenu,
    search: T.iconSearch,
    filter: T.iconFilter,
    share: T.iconShare,
    download: T.iconDownload,
    heart: T.iconFavorite,
    favorite: T.iconFavorite,
    trash: T.iconTrash,
    plus: T.iconPlus,
    minus: T.iconMinus,
    check: T.iconSuccess,
    checkLine: T.iconCheck,
    optionCheck: T.iconCheck,
    checkBox: T.iconCheckbox,
    checkBoxActive: T.iconCheckboxChecked,
    calendar: T.iconCalendar,
    dates: T.iconDates,
    time: T.iconTime,
    info: T.iconInfo,
    help: T.iconHelp,
    loader: T.iconLoader,
    user: T.iconUser,
    profile: T.iconUser,
    tourist: T.iconTourists,
    tourists: T.iconTourists,
    notification: T.iconBell,
    message: T.iconChat,
    reviews: T.iconReviews,
    phone: T.iconPhone,
    logout: T.iconLogout,
    light: T.iconThemeLight,
    themeDark: T.iconThemeDark,
    moon: T.iconNights,
    location: T.iconPin,
    plane: T.iconSearchTour,
    hotel: T.iconSearchHotel,
    typeHotel: T.iconTypeHotel,
    orderRoom: T.iconOrderRoom,
    from: T.iconFrom,
    to: T.iconTo,
    air: T.iconDeparture,
    order: T.iconTabOrders,
    card: T.iconDocVoucher,
    faq: T.iconPolicy,
    eays: T.iconOperator,
    bestPrice: T.iconBestPrice,
    bestOffer: T.iconBestOffer,
    star: T.iconStars,
};

const icons = {
    logo: LogoIcon,
    circle: CircleIcon,
    appStore: AppStoreIcon,
    googlePlay: GooglePlayIcon,
    ruStore: RuStoreIcon,
    fb:FbIcon,
    x:XIcon,
    instagram: InstagramIcon,
    youtube: YoutubeIcon,
    line: LineIcon,
    travel: TravelIcon,
    verify: VerifyIcon,
    prev: Prev,
    tezTour: tezTour,
    onexTour: onexTour,
    funAndSun: funAndSun,
    biblioGlobus: biblioGlobus,
    pegasTour: pegasTour,
    coralTravel: coralTravel,
    master: MasterIcon,
    visa: VisaIcon,
    mir: MirIcon,
    vk: VkIcon,
    vc: VcIcon,
    aiStar: AiStarIcon,
    rutube: RutubeIcon,
    support: SupportIcon,
    recomand: RecomendIcon,
    dear: DearIcon,
    cheap: CheapIcon,
    reating: ReatingIcon,
    bird: BirdIcon,
}

type IconName = keyof typeof icons;

interface IconProps {
    name: IconName | string;
    size?: number | string;
    color?: string;
    onClick?: () => void;
    /** false — без оранжевой детали: иконка на оранжевом или цветном фоне. */
    accent?: boolean;
}

export default function Icon({ name, size = 24, color = 'currentColor', onClick, accent = true }: IconProps) {
    const totus = TOTUS[name];
    if (totus) {
        // звезда: целиком цветом из пропса и залита — как было
        if (name === 'star') return <TotusIcon icon={totus} size={size} color={color} accent={false} filled onClick={onClick} />;
        return <TotusIcon icon={totus} size={size} color={color} accent={accent} onClick={onClick} />;
    }
    const Component = icons[name as IconName];
    return <Component width={size} height={size} color={color} onClick={onClick} />;
}
