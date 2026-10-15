import React from 'react';
import styles from './orderDetails.module.css';
import Icon from '@/components/icons/Icon';
import AppModal from '@/components/UI/modal';
import { resolveDocumentUrl } from '@/utils/orderDisplay';

interface Document {
    name: string;
    url: string;
}

interface DocumentsModalProps {
    visible: boolean;
    onClose: () => void;
    documents: Document[];
}

const DocumentsModal: React.FC<DocumentsModalProps> = ({
    visible,
    onClose,
    documents,
}) => {
    const handleDownload = (url: string) => {
        const resolved = resolveDocumentUrl(url);
        if (resolved) {
            window.open(resolved, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <AppModal
            isOpen={visible}
            onClose={onClose}
            onBack={onClose}
            title="Документы по туру"
            width="600px"
        >
            <div className={styles.documentsModalContent}>
                {documents.length === 0 ? (
                    <p className={styles.noDocuments}>Документы пока недоступны</p>
                ) : (
                    <div className={styles.documentsCard}>
                        {documents.map((doc, index) => (
                            <React.Fragment key={`${doc.url}-${index}`}>
                                <div
                                    className={styles.documentRow}
                                    onClick={() => handleDownload(doc.url)}
                                >
                                    <div className={styles.documentIcon}>
                                        <Icon name="card" size={24} color="var(--textPrimary)" />
                                    </div>
                                    <p className={styles.documentName}>{doc.name}</p>
                                    <div
                                        className={styles.downloadButton}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownload(doc.url);
                                        }}
                                    >
                                        <Icon name="download" size={24} color="var(--textPrimary)" />
                                    </div>
                                </div>
                                {index < documents.length - 1 && (
                                    <div className={styles.divider}></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>
        </AppModal>
    );
};

export default DocumentsModal;
