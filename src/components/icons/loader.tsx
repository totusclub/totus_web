
import { SVGProps } from 'react';

export default function LoaderIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <g clipPath="url(#clip0_172_31168)">
                <path
                    d="M10.0001 5.00033V1.66699M10.0001 15.0003V18.3337M5.00008 10.0003H1.66675M15.0001 10.0003H18.3334M13.3334 13.3337L15.8334 15.8337M6.66675 13.3337L4.16675 15.8337M6.66675 6.66699L4.16675 4.16699M13.3334 6.66699L15.8334 4.16699"
                    stroke={props?.color || "#1F1F1F"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </g>
            <defs>
                <clipPath id="clip0_172_31168">
                    <rect width="20" height="20" rx="4" fill="white"/>
                </clipPath>
            </defs>
        </svg>

    );
}
