
import { SVGProps } from 'react';

export default function DownArrowIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path d="M18.6 9L12.6 15.0001L6.60004 9" stroke={props?.color?props.color:'#1F1F1F'} strokeWidth="1.5" strokeLinecap="round"
                  strokeLinejoin="round"/>
        </svg>


    );
}
