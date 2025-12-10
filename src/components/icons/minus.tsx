
import { SVGProps } from 'react';

export default function MinusIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path d="M4.16663 10H15.8333" stroke={props?.color || "#1F1F1F"} strokeWidth="1.5" strokeLinecap="round"
                  strokeLinejoin="round"/>
        </svg>
    );
}
