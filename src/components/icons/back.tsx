
import { SVGProps } from 'react';

export default function BackIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path d="M20.0001 12L4 12M4 12L10.0001 18M4 12L10.0001 6" stroke={props?.color || "#1F1F1F"} strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

    );
}
