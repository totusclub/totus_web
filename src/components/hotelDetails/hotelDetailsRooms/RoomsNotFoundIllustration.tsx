import styles from '../hotelDetails.module.css';

const RoomsNotFoundIllustration = () => (
    <div className={styles.HotelDetailsRoomsNotFoundIllustration} aria-hidden>
        <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="roomsEmptyBg" x1="40" y1="32" x2="200" y2="168" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FFE8DC" />
                    <stop offset="1" stopColor="#FFF6F1" />
                </linearGradient>
                <linearGradient id="roomsEmptyAccent" x1="120" y1="40" x2="120" y2="168" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FE8A4D" />
                    <stop offset="1" stopColor="#FE732E" />
                </linearGradient>
                <linearGradient id="roomsEmptyWindow" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#FFF4EC" />
                    <stop offset="1" stopColor="#FFE2D0" />
                </linearGradient>
            </defs>

            <ellipse cx="120" cy="108" rx="92" ry="74" fill="url(#roomsEmptyBg)" />

            <circle cx="46" cy="58" r="5" fill="#FE732E" fillOpacity="0.22" />
            <circle cx="194" cy="70" r="7" fill="#FE732E" fillOpacity="0.14" />
            <circle cx="178" cy="168" r="4" fill="#FE732E" fillOpacity="0.18" />

            <path
                d="M58 74L120 46L182 74"
                stroke="url(#roomsEmptyAccent)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            <rect x="66" y="74" width="108" height="90" rx="14" fill="#FFFFFF" stroke="#ECECEC" strokeWidth="2" />

            <rect x="80" y="92" width="22" height="18" rx="4" fill="url(#roomsEmptyWindow)" stroke="#FFD7C2" strokeWidth="1.5" />
            <rect x="138" y="92" width="22" height="18" rx="4" fill="url(#roomsEmptyWindow)" stroke="#FFD7C2" strokeWidth="1.5" />

            <rect x="104" y="116" width="32" height="48" rx="5" fill="#F7F7F7" stroke="#E4E4E4" strokeWidth="1.5" />
            <circle cx="130" cy="140" r="2.5" fill="#D0D0D0" />

            <rect x="78" y="132" width="56" height="10" rx="5" fill="#FFF0E8" stroke="#FFD4BE" strokeWidth="1.5" />
            <rect x="82" y="126" width="18" height="12" rx="6" fill="#FFFFFF" stroke="#FFD4BE" strokeWidth="1.5" />

            <circle cx="166" cy="126" r="24" fill="#FFFFFF" stroke="url(#roomsEmptyAccent)" strokeWidth="3" />
            <path d="M184 144L198 158" stroke="url(#roomsEmptyAccent)" strokeWidth="3" strokeLinecap="round" />
            <path d="M156 118L176 138" stroke="#FFB899" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M176 118L156 138" stroke="#FFB899" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    </div>
);

export default RoomsNotFoundIllustration;
