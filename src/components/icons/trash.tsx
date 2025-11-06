
import { SVGProps } from 'react';

export default function TrashIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path d="M11.6667 1.66699H8.33342L7.50008 3.33366H12.5001L11.6667 1.66699Z" fill="#1F1F1F"/>
            <path d="M1.66675 3.33366H18.3334M8.33342 1.66699H11.6667L12.5001 3.33366H7.50008L8.33342 1.66699Z"
                  stroke="#1F1F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path
                d="M8.33333 12.4997V7.49967M11.6667 12.4997V7.49967M2.5 3.33301L4.63549 15.4341C4.84631 16.6288 5.88435 17.4997 7.09745 17.4997H12.9623C14.1487 17.4997 15.1717 16.6658 15.4109 15.5038L17.9167 3.33301H2.5Z"
                stroke="#1F1F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

    );
}
