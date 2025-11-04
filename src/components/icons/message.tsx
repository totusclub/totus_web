
import { SVGProps } from 'react';

export default function MessageIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M17.5 5V12.5C17.5 13.8807 16.3807 15 15 15H10.877C10.3093 15 9.7585 15.1932 9.31521 15.5478L6.51029 17.7918C6.23747 18.01 5.83333 17.8158 5.83333 17.4664V15.4167C5.83333 15.1865 5.64679 15 5.41667 15H5C3.61929 15 2.5 13.8807 2.5 12.5V5C2.5 3.61929 3.61929 2.5 5 2.5H15C16.3807 2.5 17.5 3.61929 17.5 5Z"
                fill="#7A7A7A"/>
        </svg>
    );
}
