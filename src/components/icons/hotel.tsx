
import { SVGProps } from 'react';

export default function HotelIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M11.1398 2.60221L2.63981 8.55221C2.23882 8.8329 2 9.29158 2 9.78105V20.5001C2 21.3285 2.67157 22.0001 3.5 22.0001H7.07895C7.86377 22.0001 8.5 21.3638 8.5 20.579V16.5001C8.5 14.5671 10.067 13.0001 12 13.0001C13.933 13.0001 15.5 14.5671 15.5 16.5001V20.579C15.5 21.3638 16.1362 22.0001 16.9211 22.0001H20.5C21.3284 22.0001 22 21.3285 22 20.5001V9.78105C22 9.29158 21.7612 8.8329 21.3602 8.55221L12.8602 2.60221C12.3437 2.24067 11.6563 2.24067 11.1398 2.60221Z"
                stroke={props?.color || "#1F1F1F"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>


    );
}
