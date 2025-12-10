
import { SVGProps } from 'react';

export default function CheckLineIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M20 9L10.1314 18.8686C9.73535 19.2646 9.53735 19.4627 9.30902 19.5368C9.10817 19.6021 8.89183 19.6021 8.69098 19.5368C8.46265 19.4627 8.26465 19.2646 7.86863 18.8686L4 15"
                stroke={props?.color || "#1F1F1F"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

    );
}
