
import { SVGProps } from 'react';

export default function CheckIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path fillRule="evenodd" clipRule="evenodd"
                  d="M6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11ZM8.76516 4.76517C8.91161 4.61872 8.91161 4.38128 8.76516 4.23483C8.61872 4.08839 8.38128 4.08839 8.23484 4.23483L5 7.46967L3.76517 6.23483C3.61872 6.08839 3.38128 6.08839 3.23483 6.23483C3.08839 6.38128 3.08839 6.61872 3.23483 6.76517L4.73483 8.26517C4.88128 8.41161 5.11872 8.41161 5.26517 8.26517L8.76516 4.76517Z"
                  fill={props.color?props.color:"white"}/>
        </svg>
    );
}
