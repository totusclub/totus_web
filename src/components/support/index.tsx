// components/SupportButton.tsx
"use client";

import { useState } from "react";

export default function Support() {
    const [loading, setLoading] = useState(false);

    const callSupport = async () => {
        const destination = prompt("Введите номер для звонка:", "+18001234567");

        if (!destination) return;

        setLoading(true);

        try {
            const res = await fetch(`http://localhost:3001/api/support/call`, {
                method: "POST",
            });

            const data = await res.json();

            if (res.ok) {
                alert("Звонок инициирован!");
            } else {
                alert("Ошибка: " + JSON.stringify(data.error || data.message));
            }
        } catch (err) {
            console.error(err);
            alert("Не удалось инициировать звонок.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button onClick={() => window.ReactNativeWebView.postMessage("openModal")} disabled={loading}>
            {loading ? "Звонок..." : "Call Support"}
        </button>
    );
}
