import BurgerIcon from './burger'
import LogoIcon from './logo'
import HeartIcon from './heart'
import SearchIcon from './search'
import FromIcon from "./from";
import ToIcon from "./to";
import CalendarIcon from "./calendar";
import MoonIcon from "./moon";
import UserIcon from "./user";
import DownArrowIcon from "./downArrow";
import MinusIcon from "./minus";
import PlusIcon from "./plus";
import RightIcon from "./right";
import LeftIcon from "./left";
import LocationIcon from "./location";
import PlaneIcon from "./plane";
import HotelIcon from "./hotel";
import CircleIcon from "./circle";
import StarIcon from "./star";
import MessageIcon from "./message";
import CheckIcon from "@/components/icons/check";
import AppStoreIcon from "@/components/icons/appStore";
import GooglePlayIcon from "@/components/icons/googlePlay";
import FbIcon from "@/components/icons/fb";
import XIcon from "@/components/icons/x";
import InstagramIcon from "@/components/icons/instagram";
import YoutubeIcon from "@/components/icons/youtube";
import LineIcon from "@/components/icons/line";
import UpArrowIcon from "@/components/icons/upArrow";
import CheckBoxIcon from "@/components/icons/checkBox";
import CheckBoxActiveIcon from "@/components/icons/checkBoxActive";
import LoaderIcon from "@/components/icons/loader";
import CloseIcon from "@/components/icons/close";
import TrashIcon from "@/components/icons/trash";
import NotificationIcon from "@/components/icons/notification";
import TravelIcon from "@/components/icons/travel";
import LightIcon from "@/components/icons/light";
import VerifyIcon from "@/components/icons/verify";
import CheckLineIcon from "@/components/icons/checkLine";
import InfoIcon from "@/components/icons/info";
import EaysIcon from "@/components/icons/eays";
import CloseLineIcon from "@/components/icons/closeLine";
import AirIcon from "@/components/icons/air";


const icons = {
    burger: BurgerIcon,
    logo: LogoIcon,
    heart: HeartIcon,
    search: SearchIcon,
    from: FromIcon,
    to: ToIcon,
    calendar: CalendarIcon,
    moon: MoonIcon,
    user: UserIcon,
    downArrow: DownArrowIcon,
    minus: MinusIcon,
    plus: PlusIcon,
    rightArrow: RightIcon,
    leftArrow: LeftIcon,
    location: LocationIcon,
    plane: PlaneIcon,
    hotel: HotelIcon,
    circle: CircleIcon,
    star: StarIcon,
    message: MessageIcon,
    check: CheckIcon,
    appStore: AppStoreIcon,
    googlePlay: GooglePlayIcon,
    fb:FbIcon,
    x:XIcon,
    instagram: InstagramIcon,
    youtube: YoutubeIcon,
    line: LineIcon,
    upArrow: UpArrowIcon,
    checkBox: CheckBoxIcon,
    checkBoxActive: CheckBoxActiveIcon,
    loader: LoaderIcon,
    close: CloseIcon,
    trash: TrashIcon,
    notification: NotificationIcon,
    travel: TravelIcon,
    light: LightIcon,
    verify: VerifyIcon,
    checkLine: CheckLineIcon,
    info: InfoIcon,
    eays: EaysIcon,
    closeLine: CloseLineIcon,
    air: AirIcon,
}

type IconName = keyof typeof icons;

interface IconProps {
    name: IconName | string;
    size?: number | string;
    color?: string;
    onClick?: () => void;
}

export default function Icon({ name, size = 24, color = 'currentColor' ,onClick}: IconProps) {
    const Component = icons[name as IconName];
    return <Component width={size} height={size} color={color} onClick={onClick} />;
}
