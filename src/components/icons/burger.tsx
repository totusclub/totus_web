
import { SVGProps } from 'react';

export default function BurgerIcon(props: SVGProps<SVGSVGElement>) {
    return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"  {...props}>
        <path d="M4 9L20 9M4 15L20 15" stroke="#1F1F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    );
}
