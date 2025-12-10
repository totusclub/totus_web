
import { SVGProps } from 'react';

export default function CheapIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path d="M6.74999 0.75L6.74999 16.7501M6.74999 16.7501L12.75 10.75M6.74999 16.7501L0.75 10.75"
                  stroke={props?.color || "#1F1F1F"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>


    );
}
