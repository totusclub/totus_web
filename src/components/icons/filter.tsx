
import { SVGProps } from 'react';

export default function FilterIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M22 5.75H10.75M14.5 18.25H3.25M14.5 18.25C14.5 20.3211 16.1789 22 18.25 22C20.3211 22 22 20.3211 22 18.25C22 16.1789 20.3211 14.5 18.25 14.5C16.1789 14.5 14.5 16.1789 14.5 18.25ZM9.5 5.75C9.5 7.82107 7.82107 9.5 5.75 9.5C3.67893 9.5 2 7.82107 2 5.75C2 3.67893 3.67893 2 5.75 2C7.82107 2 9.5 3.67893 9.5 5.75Z"
                stroke="#1F1F1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>


    );
}
