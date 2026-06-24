import { useEffect, useState } from 'react';
import styles from './collapse.module.css';
import Icon from "@/components/icons/Icon";

interface CollapseProps {
    title: string;
    children: React.ReactNode;
    open?: boolean;
}

export default function Collapse({ title, children, open = false }: CollapseProps) {
    const [isOpen, setIsOpen] = useState(open);

    useEffect(() => {
        setIsOpen(open);
    }, [open]);

    const toggle = () => setIsOpen((prev) => !prev);

    return (
        <div className={styles.collapse}>
            <div className={styles.collapseHeader} onClick={toggle}>
                <p className={styles.collapseTitle}>{title}</p>
                <Icon name={isOpen ? 'upArrow' : 'downArrow'} size={24} />
            </div>
            <div className={`${styles.contentWrapper} ${isOpen ? styles.contentWrapperOpen : ''}`}>
                <div className={styles.content}>
                    {children}
                </div>
            </div>
        </div>
    );
}
