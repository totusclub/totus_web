import { SVGProps } from 'react';

export default function UserIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M16.4 6C16.4 8.20914 14.6091 10 12.4 10C10.1909 10 8.39999 8.20914 8.39999 6C8.39999 3.79086 10.1909 2 12.4 2C14.6091 2 16.4 3.79086 16.4 6Z"
                stroke="#1F1F1F" strokeWidth="1.5"/>
            <path
                d="M19.4 22C20.5046 22 21.4222 21.0938 21.1787 20.0164C20.8068 18.3705 19.9761 16.8482 18.764 15.636C17.0761 13.9482 14.7869 13 12.4 13C10.013 13 7.72386 13.9482 6.03603 15.636C4.8239 16.8482 3.99323 18.3705 3.62128 20.0164C3.37781 21.0938 4.29542 22 5.39999 22H19.4Z"
                stroke="#1F1F1F" strokeWidth="1.5"/>
        </svg>

    );
}
