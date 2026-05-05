import { SVGProps } from 'react';

export default function VisaIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 1000 398.9"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <g>
                <path fill="#8F4794" d="M100.3,199.4l-52,30L0,313.1l196.9-113.7L100.3,199.4z"/>
                <path fill="#E40646" d="M248.9,113.7l-52,30l-48.3,83.7l196.9-113.7L248.9,113.7z"/>
                <polygon fill="#F9B429" points="196.9,83.7 148.6,0 148.6,398.9 196.9,315.2"/>
                <polygon fill="#EF8019" points="148.6,0 196.9,83.7 248.9,113.7 345.5,113.7"/>
                <polygon fill="#78B72A" points="148.6,171.5 148.6,398.9 196.9,315.2 196.9,255.2"/>
                <path fill="#00853F" d="M248.9,285.2l-52,30l-48.3,83.7l196.9-113.7L248.9,285.2z"/>
                <polygon fill="#5B57A2" points="0,85.8 0,313.1 48.3,229.5 48.3,169.4"/>
                <polygon fill="#0698D6" points="148.6,171.5 0,85.8 48.3,169.4 248.9,285.2 345.5,285.2"/>

                {/* text/logo part */}
                <g fill="#1D1346">
                    <path d="M918.1,236.7h6.2v35h-6.2z"/>
                    {/* you can keep rest same, just remove className="st8" and add fill here */}
                </g>
            </g>
        </svg>
    );
}