import React, { useMemo, useState } from 'react';
import styles from './orderDetails.module.css';
import Icon from '@/components/icons/Icon';
import InfoRow from './InfoRow';
import DocumentsModal from './DocumentsModal';
import TicketModal from '@/components/modals/ticketModal';
import { getOrderFlightData } from '@/utils/orderPayment';
import { collectOrderDocuments, formatTravelPeriod } from '@/utils/orderDisplay';

interface OrderDetailsSectionsProps {
  pkg: any;
  hotelName: string;
  destination: string;
  order: any;
  apiDocuments?: Array<{
    title?: string;
    public_url?: string;
    source_url?: string;
    url?: string;
  }>;
}

const OrderDetailsSections: React.FC<OrderDetailsSectionsProps> = ({
  pkg,
  hotelName,
  destination,
  order,
  apiDocuments = [],
}) => {
  const [documentsModalVisible, setDocumentsModalVisible] = useState(false);
  const [modalTicket, setModalTicket] = useState(false);

  const flightData = useMemo(
    () => getOrderFlightData(order, pkg),
    [order, pkg],
  );

  const documents = useMemo(
    () => collectOrderDocuments(order, apiDocuments),
    [order, apiDocuments],
  );

  const formatFlightDate = useMemo(() => formatTravelPeriod(pkg), [pkg]);

  const formatTouristDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      let date: Date;
      if (dateString.includes('.')) {
        const [day, month, year] = dateString.split('.');
        date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      } else {
        date = new Date(dateString);
      }

      return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const tourists =
    order?.package?.tourists ?? order?.tourists ?? pkg?.tourists ?? [];

  const documentsDescription =
    documents.length > 0
      ? `${documents.length} ${documents.length === 1 ? 'документ' : documents.length < 5 ? 'документа' : 'документов'} доступно для скачивания`
      : 'Документы по заказу появятся здесь после подтверждения тура';

  return (
    <>
      <div className={styles.orderDetailsCard}>
        <div
          className={styles.documentsPanel}
          onClick={() => setDocumentsModalVisible(true)}
        >
          <div className={styles.documentsContent}>
            <div className={styles.documentsTitleContainer}>
              <div className={styles.documentsTitleIcon}>
                <Icon name="card" size={24} color="var(--textPrimary)" />
                <p className={styles.documentsTitle}>Документы</p>
              </div>
              <div className={styles.arrowContainer}>
                <Icon name="rightArrow" size={20} color="var(--textPrimary)" />
              </div>
            </div>
            <p className={styles.documentsDescription}>{documentsDescription}</p>
          </div>
        </div>

        <div className={styles.sectionWrapper}>
          <p className={styles.sectionHeader}>Самое важное</p>
          <div className={styles.infoPanel}>
            <InfoRow
              label="Даты перелёта"
              value={formatFlightDate}
              showArrow={Boolean(flightData)}
              onClick={flightData ? () => setModalTicket(true) : undefined}
            />
            <div className={styles.divider}></div>
            <InfoRow
              label="Курорт"
              value={destination || '—'}
              rightValue={pkg?.hotel?.visa?.needed ? 'Требуется виза' : 'Виза не нужна'}
            />
            <div className={styles.divider}></div>
            <InfoRow
              label="Туроператор"
              value={pkg?.operator?.name || 'Level.Travel'}
            />
          </div>
        </div>

        <div className={styles.sectionWrapper}>
          <p className={styles.sectionHeader}>Отель и номер</p>
          <div className={styles.infoPanel}>
            <InfoRow
              label="Отель"
              value={hotelName || '—'}
              showArrow={true}
            />
            <div className={styles.divider}></div>
            <InfoRow
              label="Номер"
              value={pkg?.room_info?.name_ru || pkg?.room_type || '—'}
            />
            <div className={styles.divider}></div>
            <InfoRow
              label="Питание"
              value={pkg?.pansion_description || 'Без питания'}
            />
          </div>
        </div>

        <div className={styles.sectionWrapper}>
          <p className={styles.sectionHeader}>Включено в тур</p>
          <div className={styles.infoPanel}>
            <InfoRow
              label="Страховка"
              value="Не включена в стоимость"
              showArrow={true}
            />
            <div className={styles.divider}></div>
            <InfoRow
              label="Трансфер"
              value="Не включен в стоимость"
              showArrow={true}
            />
          </div>
        </div>

        <div className={styles.sectionWrapper}>
          <p className={styles.sectionHeader}>Туристы</p>
          <div className={styles.infoPanel}>
            {tourists.length === 0 ? (
              <p className={styles.touristDetails}>—</p>
            ) : (
              tourists.map((tourist: any, index: number) => (
                <React.Fragment key={index}>
                  <div className={styles.touristRow}>
                    <p className={styles.touristName}>
                      {tourist.name} {tourist.surname}
                    </p>
                    <p className={styles.touristDetails}>
                      {tourist.birthday ? formatTouristDate(tourist.birthday) : ''}
                      {tourist.birthday && (tourist.passport || tourist.document_number)
                        ? ', '
                        : ''}
                      {tourist.passport || tourist.document_number
                        ? `загран. паспорт ${tourist.passport || tourist.document_number}`
                        : ''}
                    </p>
                  </div>
                  {index < tourists.length - 1 && (
                    <div className={styles.divider}></div>
                  )}
                </React.Fragment>
              ))
            )}
          </div>
        </div>
      </div>

      <DocumentsModal
        visible={documentsModalVisible}
        onClose={() => setDocumentsModalVisible(false)}
        documents={documents}
      />

      <TicketModal open={modalTicket} setOpen={setModalTicket} item={flightData} />
    </>
  );
};

export default OrderDetailsSections;
