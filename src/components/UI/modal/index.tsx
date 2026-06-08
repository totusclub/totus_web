import React, { useEffect } from 'react';
import Modal from 'react-modal';
import styles from './modal.module.css';
import Icon from "@/components/icons/Icon";

interface AppModalProps {
    title: string;
    isOpen: boolean;
    onClose?: () => void;
    onBack: () => void;
    width?: string | number;
    subTitle?: string;
    children: React.ReactNode;
    auth?: boolean;
    back?:boolean
    scroll?:boolean
}
const AppModal: React.FC<AppModalProps> = ({ isOpen, onClose, title, width = '500px', children,subTitle,auth,back,onBack,scroll }:AppModalProps) => {
    useEffect(() => {
        if (typeof document !== 'undefined') {
            Modal.setAppElement('#root');
        }
    }, []);

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            overlayClassName={styles.modalOverlay}
            className={styles.appModal}
            style={{
                content: {
                    width,
                },
            }}
        >
            <div className={styles.modalHeader}>
                {back && (
                    <div style={{height: '100%',display:'flex',alignItems:'center'}} onClick={() => onBack()}>
                        <Icon name={'back'}/>
                    </div>
                )}
                <div className={auth ? styles.modalHeaderInfoAuth : styles.modalHeaderInfo}>
                    <p>{title}</p>
                    {subTitle && (<p>{subTitle}</p>)}
                </div>
                {onClose && (
                    <div className={auth ? styles.modalCloseBtnAuth : styles.modalCloseBtn} onClick={onClose}>
                        <Icon name={'closeLine'}/>
                    </div>
                )}

            </div>
            {!auth && (
                <div className={styles.appModalLine}></div>
            )}
            <div className={styles.modalBody}>{children}</div>
        </Modal>
    );
};

export default AppModal;
