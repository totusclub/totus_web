
import { SVGProps } from 'react';

export default function SearchIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M21.5 21.5L16 16M18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10Z"
                stroke={props.color ?props.color:"white"} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>

    );
}




