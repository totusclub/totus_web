import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

/**
 * Окно входа подгружается отдельным чанком, только когда его впервые открывают
 * (формы входа/регистрации и капча не попадают в общий бандл каждой страницы).
 * После первого открытия остаётся смонтированным — поведение и состояние экранов как раньше.
 * В фоне (после загрузки страницы, в простое) чанк подгружается заранее, чтобы клик был мгновенным.
 */
const AuthModal = dynamic(() => import('@/components/auth'), { ssr: false });

let prefetchScheduled = false;
function prefetchAuthModal() {
    if (prefetchScheduled || typeof window === 'undefined') return;
    prefetchScheduled = true;
    const load = () => {
        void import('@/components/auth');
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
    window.setTimeout(() => {
        if (w.requestIdleCallback) w.requestIdleCallback(load, { timeout: 5000 });
        else load();
    }, 4000);
}

type LazyAuthModalProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
};

const LazyAuthModal = ({ open, setOpen }: LazyAuthModalProps) => {
    const [used, setUsed] = useState(open);

    useEffect(() => {
        if (open) setUsed(true);
    }, [open]);

    useEffect(() => {
        prefetchAuthModal();
    }, []);

    if (!used && !open) return null;
    return <AuthModal open={open} setOpen={setOpen} />;
};

export default LazyAuthModal;
