import { useEffect, useRef, useState } from 'react';

interface ExpandableContentProps<T = any> {
  text?: string;
  items?: T[];
  renderItem?: (item: T, index: number) => JSX.Element;
  maxLines?: number;
  initialCount?: number;
  moreLabel?: string;
  lessLabel?: string;
}

export default function ExpandableContent<T>({
  text,
  items,
  renderItem,
  maxLines = 5,
  initialCount = 10,
  moreLabel = 'more',
  lessLabel = 'less',
}: ExpandableContentProps<T>) {
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (text && textRef.current) {
      const el = textRef.current;
      (el.style as CSSStyleDeclaration & { webkitLineClamp?: string }).webkitLineClamp = String(maxLines);
      const overflowing = el.scrollHeight > el.clientHeight;
      setIsOverflowing(overflowing);
    }
  }, [text, maxLines]);

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
            {expanded ? lessLabel : moreLabel}
          </button>
        )}
      </div>
    );
  }

  if (items && renderItem) {
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
            {expanded ? lessLabel : moreLabel}
          </button>
        )}
      </div>
    );
  }

  return null;
}
