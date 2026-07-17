import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import Icon from '@/components/icons/Icon';
import useAuth from '@/hooks/useAuth';
import { logout } from '@/store/slices/authSlice';
import { deleteToken } from '@/utils/auth';
import styles from './header.module.css';

type MenuItem = {
  id: string;
  label: string;
  icon: 'profile' | 'order' | 'favorite' | 'logout';
  href?: string;
  danger?: boolean;
  onSelect?: () => void;
};

const HeaderProfileMenu = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const displayName = useMemo(() => {
    const full = `${user?.name || ''} ${user?.l_name || ''}`.trim();
    return full || 'Профиль';
  }, [user?.name, user?.l_name]);

  const initials = useMemo(() => {
    const first = String(user?.name || '').trim().charAt(0);
    const last = String(user?.l_name || '').trim().charAt(0);
    const value = `${first}${last}`.toUpperCase();
    return value || 'U';
  }, [user?.name, user?.l_name]);

  const handleLogout = () => {
    deleteToken();
    dispatch(logout());
    setOpen(false);
    router.push('/');
    if (window.ReactNativeWebView?.postMessage) {
      window.ReactNativeWebView.postMessage('logout');
    }
  };

  const items: MenuItem[] = [
    { id: 'profile', label: 'Профиль', icon: 'profile', href: '/profile' },
    { id: 'orders', label: 'Мои заказы', icon: 'order', href: '/profile/my-orders' },
    { id: 'favorites', label: 'Избранное', icon: 'favorite', href: '/profile/favorites' },
    { id: 'logout', label: 'Выйти', icon: 'logout', danger: true, onSelect: handleLogout },
  ];

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    const close = () => setOpen(false);
    router.events.on('routeChangeStart', close);
    return () => {
      router.events.off('routeChangeStart', close);
    };
  }, [router.events]);

  const handleSelect = (item: MenuItem) => {
    if (item.onSelect) {
      item.onSelect();
      return;
    }
    if (item.href) {
      setOpen(false);
      router.push(item.href);
    }
  };

  return (
    <div ref={rootRef} className={styles.profileMenuRoot}>
      <button
        type="button"
        className={`${styles.profileTrigger} ${open ? styles.profileTriggerOpen : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={styles.profileAvatar} aria-hidden>
          {initials}
        </span>
        <span className={styles.profileTriggerText}>
          <span className={styles.profileTriggerName}>{displayName}</span>
          <span className={styles.profileTriggerHint}>Личный кабинет</span>
        </span>
        <Icon
          name={open ? 'upArrow' : 'downArrow'}
          size={16}
          color="var(--textTertiary)"
        />
      </button>

      {open ? (
        <div className={styles.profileDropdown} role="menu">
          <div className={styles.profileDropdownHead}>
            <span className={styles.profileAvatarLarge} aria-hidden>
              {initials}
            </span>
            <div className={styles.profileDropdownHeadText}>
              <p className={styles.profileDropdownName}>{displayName}</p>
              {user?.email ? (
                <p className={styles.profileDropdownEmail}>{user.email}</p>
              ) : null}
            </div>
          </div>

          <div className={styles.profileDropdownList}>
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                className={`${styles.profileDropdownItem} ${item.danger ? styles.profileDropdownItemDanger : ''}`}
                onClick={() => handleSelect(item)}
              >
                <Icon
                  name={item.icon}
                  size={18}
                  color={item.danger ? 'var(--core_Orange)' : 'var(--textPrimary)'}
                />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default HeaderProfileMenu;
