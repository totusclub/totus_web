import { useState, useRef, useEffect } from 'react';
import styles from './collapse.module.css';
import Icon from "@/components/icons/Icon";

interface CollapseProps {
    title: string;
    children: React.ReactNode;
    open?: boolean;
}

export default function Collapse({ title, children, open = false }: CollapseProps) {
    const [isOpen, setIsOpen] = useState(open);
    const [height, setHeight] = useState<string | number>('0px');
    const contentRef = useRef<HTMLDivElement>(null);

    // Recalculate height when isOpen or children/content size changes
    useEffect(() => {
        const updateHeight = () => {
            if (contentRef.current) {
                setHeight(isOpen ? `${contentRef.current.scrollHeight}px` : '0px');
            }
        };

        updateHeight();

        if (typeof ResizeObserver !== 'undefined' && contentRef.current) {
            const observer = new ResizeObserver(updateHeight);
            observer.observe(contentRef.current);

            return () => observer.disconnect();
        }
    }, [isOpen, children]);

    const toggle = () => setIsOpen((prev) => !prev);

    return (
        <div className={styles.collapse}>
            <div className={styles.collapseHeader} onClick={toggle}>
                <p className={styles.collapseTitle}>{title}</p>
                <Icon name={isOpen ? 'upArrow' : 'downArrow'} size={24} />
            </div>
            <div
                className={styles.contentWrapper}
                style={{
                    height,
                    transition: 'height 0.3s ease',
                    overflow: 'hidden',
                }}
            >
                <div ref={contentRef} className={styles.content}>
                    {children}
                </div>
            </div>
        </div>
    );
}
