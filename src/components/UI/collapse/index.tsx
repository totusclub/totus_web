import { useState, useRef, useEffect } from 'react';
import styles from './collapse.module.css';
import Icon from "@/components/icons/Icon";

interface CollapseProps {
    title: string;
    children: React.ReactNode;
    open?: boolean;
}

export default function Collapse({ title, children, open }: CollapseProps) {
    const [isOpen, setIsOpen] = useState(open);
    const [height, setHeight] = useState<string | number>('0px');
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current) {
            setHeight(isOpen ? `${contentRef.current.scrollHeight}px` : '0px');
        }
    }, [isOpen]);

    const toggle = () => setIsOpen((prev) => !prev);

    return (
        <div className={styles.collapse}>
            <div className={styles.collapseHeader} onClick={toggle}>
                <p className={styles.collapseTitle}>{title}</p>
                <Icon name={isOpen ? 'upArrow' : 'downArrow'} size={24} />
            </div>
            <div
                ref={contentRef}
                className={styles.contentWrapper}
                style={{ height }}
            >
                <div className={styles.content}>
                    {children}
                </div>
            </div>
        </div>
    );
}
