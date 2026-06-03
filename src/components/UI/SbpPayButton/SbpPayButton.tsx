import SbpLogo from './SbpLogo';
import styles from './sbpPayButton.module.css';

type Props = {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  label?: string;
  loadingLabel?: string;
};

const SbpPayButton = ({
  onClick,
  loading = false,
  disabled = false,
  fullWidth = true,
  label = 'Оплатить',
  loadingLabel = 'Создаём QR-код...',
}: Props) => {
  const isDisabled = disabled || loading;

  return (
    <div className={fullWidth ? styles.wrapFull : styles.wrap}>
      <button
        type="button"
        className={styles.button}
        onClick={onClick}
        disabled={isDisabled}
        aria-busy={loading}
      >
        {loading ? (
          <>
            <span className={styles.spinner} aria-hidden />
            <span className={styles.label}>{loadingLabel}</span>
          </>
        ) : (
          <>
            <span className={styles.label}>{label}</span>
            <span className={styles.badge}>
              <SbpLogo size={28} />
              <span className={styles.badgeText}>сбп</span>
            </span>
          </>
        )}
      </button>
    </div>
  );
};

export default SbpPayButton;
