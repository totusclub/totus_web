
import { SVGProps } from 'react';

export default function CircleIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <g clipPath="url(#clip0_471_10798)">
                <path
                    d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                    stroke="#1F1F1F" strokeWidth="1.5"/>
            </g>
            <defs>
                <clipPath id="clip0_471_10798">
                    <rect width="24" height="24" rx="4" fill="white"/>
                </clipPath>
            </defs>
        </svg>
    );
}
