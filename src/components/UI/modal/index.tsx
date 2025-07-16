import React from 'react';
import Modal from 'react-modal';
import styles from './modal.module.css';
import Icon from "@/components/icons/Icon";

// Modal.setAppElement('#root');
interface AppModalProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    onBack: () => void;
    width?: string | number;
    subTitle?: string;
    children: React.ReactNode;
    auth?: boolean;
    back?:boolean
}
const AppModal: React.FC<AppModalProps> = ({ isOpen, onClose, title, width = '500px', children,subTitle,auth,back,onBack }:AppModalProps) => {
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
                    <div style={{height: '100%'}} onClick={() => onBack()}>
                        <Icon name={'back'}/>
                    </div>
                )}
                <div className={auth ? styles.modalHeaderInfoAuth : styles.modalHeaderInfo}>
                    <p>{title}</p>
                    {subTitle && (<p>{subTitle}</p>)}
                </div>
                <div className={auth?styles.modalCloseBtnAuth:styles.modalCloseBtn} onClick={onClose}>
                    <Icon name={'closeLine'}/>
                </div>
            </div>
            {!auth && (
                <div className={styles.appModalLine}></div>
            )}
            <div className={styles.modalBody}>{children}</div>
        </Modal>
    );
};

export default AppModal;
