
import { SVGProps } from 'react';

export default function CloseLineIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path d="M6.34301 6.34375L17.6567 17.6575M17.6565 6.34375L6.34277 17.6575" stroke={props?.color || "#1F1F1F"}
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

    );
}
