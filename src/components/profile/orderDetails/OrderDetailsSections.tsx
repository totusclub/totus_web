import React, { useMemo, useState, useEffect } from 'react';
import styles from './orderDetails.module.css';
import Icon from '@/components/icons/Icon';
import InfoRow from './InfoRow';
import DocumentsModal from './DocumentsModal';
import TicketModal from '@/components/modals/ticketModal';
import { Packagesflights } from '@/api/levelTravelApi';

interface OrderDetailsSectionsProps {
  pkg: any;
  hotelName: string;
  destination: string;
  order: any;
}

const OrderDetailsSections: React.FC<OrderDetailsSectionsProps> = ({
  pkg,
  hotelName,
  destination,
  order,
}) => {
  const [documentsModalVisible, setDocumentsModalVisible] = useState(false);
  const [modalTicket, setModalTicket] = useState(false);
  const [flightData, setFlightData] = useState<any>(null);
  const [loadingFlight, setLoadingFlight] = useState<boolean>(false);

  const documents = useMemo(() => {
    if (!order) return [];

    const docs: Array<{ name: string; url: string }> = [];
    const orderData = order as any;
    const packageData = orderData?.package || {};
    const nestedPackage = packageData?.package || {};

    const agreementDoc = orderData?.agreement_doc || packageData?.agreement_doc || nestedPackage?.agreement_doc;
    const agreementLicense = orderData?.agreement_license || packageData?.agreement_license || nestedPackage?.agreement_license;
    const voucher = orderData?.voucher || packageData?.voucher || nestedPackage?.voucher;
    const ticket = orderData?.ticket || packageData?.ticket || nestedPackage?.ticket;

    if (agreementDoc) {
      docs.push({ name: 'Договор оферты.pdf', url: agreementDoc });
    }
    if (agreementLicense) {
      docs.push({ name: 'Лицензионный договор.pdf', url: agreementLicense });
    }
    if (voucher) {
      docs.push({ name: 'Ваучер на отель.pdf', url: voucher });
    }
    if (ticket) {
      docs.push({ name: 'Авиабилет.pdf', url: ticket });
    }

    return docs;
  }, [order]);

  const formatFlightDate = useMemo(() => {
    if (pkg?.dates_info?.start_date && pkg?.dates_info?.end_date) {
      const startDate = new Date(pkg.dates_info.start_date);
      const endDate = new Date(pkg.dates_info.end_date);

      const formatter = new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long"
      });

      const weekdayFormatter = new Intl.DateTimeFormat("ru-RU", {
        weekday: "short"
      });

      const startDay = formatter.format(startDate);
      const startWeekday = weekdayFormatter.format(startDate);
      const endDay = formatter.format(endDate);
      const endWeekday = weekdayFormatter.format(endDate);

      return `${startDay}, ${startWeekday} – ${endDay}, ${endWeekday}`;
    }
    return '—';
  }, [pkg]);

  const formatTouristDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      // Handle different date formats
      let date: Date;
      if (dateString.includes('.')) {
        // Format: DD.MM.YYYY
        const [day, month, year] = dateString.split('.');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        date = new Date(dateString);
      }

      const formatter = new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });

      return formatter.format(date);
    } catch (e) {
      return dateString;
    }
  };

  // Extract flight data from order or fetch it
  useEffect(() => {
    if (!order) return;

    // First, try to get flight data from order
    const orderFlightData = order?.package?.flight ||
      order?.package?.flight_pair ||
      order?.flight ||
      order?.flight_pair;

    if (orderFlightData) {
      setFlightData(orderFlightData);
    } else if (pkg?.id || order?.package?.id) {
      // If flight data is not in order, fetch it using package_id
      const packageId = pkg?.id || order?.package?.id;
      setLoadingFlight(true);
      Packagesflights({ package_id: packageId })
        .then((response) => {
          // Find the selected flight from the flights array
          const selectedFlight = response?.flights?.find(
            (flight: any) => flight.flight_pair_id === (order?.package?.flight_pair_id || pkg?.flight_pair_id)
          ) || response?.flights?.[0];

          if (selectedFlight) {
            setFlightData(selectedFlight);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch flight data:', err);
        })
        .finally(() => {
          setLoadingFlight(false);
        });
    }
  }, [order, pkg]);

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
            <p className={styles.documentsDescription}>
              Документы по заказу можно будет скачать перед началом тура
            </p>
          </div>
        </div>

        <div className={styles.sectionWrapper}>
          <p className={styles.sectionHeader}>Самое важное</p>
          <div className={styles.infoPanel}>
            <InfoRow
              label="Даты перелёта"
              value={formatFlightDate}
              showArrow={true}
              onClick={() => setModalTicket(true)}
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
            {(order?.package?.tourists || order?.tourists || pkg?.tourists || []).map((tourist: any, index: number) => (
              <React.Fragment key={index}>
                <div className={styles.touristRow}>
                  <p className={styles.touristName}>{tourist.name} {tourist.surname}</p>
                  <p className={styles.touristDetails}>
                    {tourist.birthday ? formatTouristDate(tourist.birthday) : ''}
                    {tourist.birthday && (tourist.passport || tourist.document_number) ? ', ' : ''}
                    {tourist.passport || tourist.document_number ? `загран. паспорт ${tourist.passport || tourist.document_number}` : ''}
                  </p>
                </div>
                {index < (order?.package?.tourists || order?.tourists || pkg?.tourists || []).length - 1 && (
                  <div className={styles.divider}></div>
                )}
              </React.Fragment>
            ))}
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

