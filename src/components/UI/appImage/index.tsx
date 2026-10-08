"use client";

type Props = {
    imageUrl: string;
};

/**
 * Главное фото номера в карточке (компьютер; на телефоне скрыто — там слайдер миниатюр).
 * Рамка 5:3, object-fit: cover, верх кадра: у фото Level.Travel (3:2) срезаются нижние 10 %
 * с надписью Level.Travel — так же, как у фото отеля и в окне с фотографиями.
 */
export default function AppImage({ imageUrl }: Props) {
    return (
        <div className={'mobHide'} style={{ width: "100%", position: "relative" }}>
            <div
                style={{
                    width: "100%",
                    aspectRatio: "5 / 3",
                    position: "relative",
                    borderRadius: 12,
                    overflow: "hidden",
                }}
            >
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "center top",
                            display: "block",
                        }}
                    />
                ) : null}
            </div>
        </div>
    );
}
