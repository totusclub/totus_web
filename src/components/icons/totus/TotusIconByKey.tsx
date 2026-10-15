import TotusIcon, { type TotusIconProps } from './TotusIcon';
import { TOTUS_ICONS, TOTUS_ICON_LABELS, type TotusIconKey } from './registry.generated';

/**
 * Иконка по ключу — для мест, где ключ приходит из данных (фильтры, удобства, питание).
 * Подтягивает в сборку весь набор (~70 КБ до сжатия), поэтому там, где иконка известна
 * заранее, лучше импортировать константу: `import { iconSearch } from './icons.generated'`.
 *
 *   <TotusIconByKey name={mealIcon(offer.meal)} size={20} />
 */
export interface TotusIconByKeyProps extends Omit<TotusIconProps, 'icon'> {
    name: TotusIconKey;
    /** true — подставить русскую подпись из набора в title. */
    labelled?: boolean;
}

export default function TotusIconByKey({ name, labelled, title, ...rest }: TotusIconByKeyProps) {
    const icon = TOTUS_ICONS[name];
    if (!icon) return null;
    return <TotusIcon icon={icon} title={title ?? (labelled ? TOTUS_ICON_LABELS[name] : undefined)} {...rest} />;
}
