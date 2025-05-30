import React from 'react';
import styles from './tags.module.css';
import Icon from "@/components/icons/Icon";

interface TagItem {
    id: number | string;
    name: string;
}

interface TagsProps {
    item: {
        title: string;
        list: TagItem[];
    };
}

const Tags: React.FC<TagsProps> = ({ item }) => {
    const chunkArray = <T,>(arr: T[], size: number): T[][] => {
        const result: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
            result.push(arr.slice(i, i + size));
        }
        return result;
    };

    const groupedData = chunkArray(item.list, 3);

    return (
        <div className={styles.tagsItem}>
            <div className={styles.tagsItemHead}>
                <p>{item.title}</p>
            </div>
            <div className={styles.tagsItemsWrapper}>
                {groupedData.map((group, groupIndex) => (
                    <div key={groupIndex} className={styles.tagsItemsList}>
                        {group.map((tag) => (
                            <div key={tag.id} className={styles.tagsItemList}>
                                <Icon name="checkLine" size={20} />
                                <p>{tag.name}</p>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Tags;
