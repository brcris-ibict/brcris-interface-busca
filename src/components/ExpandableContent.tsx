import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'next-i18next';

interface ExpandableContentProps<T = any> {
  text?: string;
  items?: T[];
  renderItem?: (item: T, index: number) => JSX.Element;
  maxLines?: number;
  initialCount?: number;
}

export default function ExpandableContent<T>({
  text,
  items,
  renderItem,
  maxLines = 5,
  initialCount = 10,
}: ExpandableContentProps<T>) {
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const { t } = useTranslation('common');

  useEffect(() => {
    if (text && textRef.current) {
      const el = textRef.current;
      (el.style as CSSStyleDeclaration & { webkitLineClamp?: string }).webkitLineClamp = String(maxLines);
      const overflowing = el.scrollHeight > el.clientHeight;
      setIsOverflowing(overflowing);
    }
  }, [text, maxLines]);

  // --- Caso texto ---
  if (text) {
    return (
      <div className="expandable-content overview">
        <p
          ref={textRef}
          className={expanded ? 'expanded' : 'clamped'}
          style={{ WebkitLineClamp: expanded ? 'none' : maxLines }}
        >
          {text}
        </p>
        {isOverflowing && (
          <button onClick={() => setExpanded(!expanded)} className="see-more-btn">
            {expanded ? t('see less') : t('see more')}
          </button>
        )}
      </div>
    );
  }

  // --- Caso lista ---
  if (items && renderItem) {
    // Se só 1 item → não usa expand/collapse
    if (items.length === 1) {
      return <>{renderItem(items[0], 0)}</>;
    }

    // Caso contrário → lista expandível
    const visibleItems = expanded ? items : items.slice(0, initialCount);
    return (
      <div className="expandable-content list">
        {visibleItems.map((item, index) => (
          <div key={index} className="list-item">
            {renderItem(item, index)}
          </div>
        ))}
        {items.length > initialCount && (
          <button onClick={() => setExpanded(!expanded)} className="see-more-btn">
            {expanded ? t('see less') : t('see more')}
          </button>
        )}
      </div>
    );
  }
  return null;
}
