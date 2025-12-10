
import { SVGProps } from 'react';

export default function CardIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M22 8V6C22 4.895 21.105 4 20 4H4C2.895 4 2 4.895 2 6V8H22ZM2 11V18C2 19.105 2.895 20 4 20H20C21.105 20 22 19.105 22 18V11H2ZM10 15H7C6.448 15 6 14.553 6 14C6 13.447 6.448 13 7 13H10C10.552 13 11 13.447 11 14C11 14.553 10.552 15 10 15Z"
                fill={props?.color || "#1F1F1F"}/>
        </svg>


    );
}
