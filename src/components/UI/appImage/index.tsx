"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
    imageUrl: string;
};

export default function AppImage({ imageUrl }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [aspectRatio, setAspectRatio] = useState<number>(16 / 9); // fallback

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const image = new Image();
        image.crossOrigin = "anonymous";
        image.src = imageUrl;

        image.onload = () => {
            canvas.width = image.width;
            canvas.height = image.height;
            setAspectRatio(image.width / image.height);

            ctx.drawImage(image, 0, 0);

            // === Logo layer coordinates ===
            const logoX = 20;
            const logoY = image.height - 75;
            const logoWidth = 360;
            const logoHeight = 60;

            // === Add custom logo-colored layer ===
            ctx.fillStyle = "rgba(255, 255, 255)"; // orange color with transparency
            ctx.fillRect(logoX, logoY, logoWidth, logoHeight);

            // Optional: add custom text or icon
            ctx.fillStyle = "#000"; // text color
            ctx.font = "bold 28px sans-serif";
            ctx.fillText("Арлекино тур", logoX + 80, logoY + 40); // centered in the layer
        };
    }, [imageUrl]);

    return (
        <div className={'mobHide'} style={{ width: "100%", position: "relative" }}>
            <div
                style={{
                    width: "100%",
                    paddingTop: `${100 / aspectRatio}%`,
                    position: "relative",
                    borderRadius:12,
                    overflow:'hidden',
                    height:'200px'
                }}
            >
                <img src={imageUrl} alt=""   style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    // width: "100%",
                    height: "220px",
                    display: "block",
                    borderRadius:12
                }}/>
                {/*<canvas*/}
                {/*    ref={canvasRef}*/}
                {/*    style={{*/}
                {/*        position: "absolute",*/}
                {/*        top: 0,*/}
                {/*        left: 0,*/}
                {/*        width: "100%",*/}
                {/*        height: "100%",*/}
                {/*        display: "block",*/}
                {/*        borderRadius:12*/}
                {/*    }}*/}
                {/*/>*/}
            </div>
        </div>
    );
}
