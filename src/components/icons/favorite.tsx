
import { SVGProps } from 'react';

export default function FavoriteIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M10.5862 20.5852C11.3673 21.3662 12.6336 21.3662 13.4147 20.5852L20.4857 13.5141C22.8289 11.171 22.8289 7.37199 20.4857 5.02884C18.1426 2.6857 14.3436 2.6857 12.0005 5.02884C9.65731 2.6857 5.85832 2.6857 3.51517 5.02884C1.17203 7.37199 1.17203 11.171 3.51517 13.5141L10.5862 20.5852Z"
                fill={props?.color || "#1F1F1F"}/>
        </svg>

    );
}
