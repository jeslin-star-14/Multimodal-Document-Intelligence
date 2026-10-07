import React from 'react';
import type { BoundingBox } from '../../types';

interface BoundingBoxOverlayProps {
  boxes: BoundingBox[];
  activeBoxId?: string;
  onBoxClick?: (box: BoundingBox) => void;
}

export const BoundingBoxOverlay: React.FC<BoundingBoxOverlayProps> = ({
  boxes,
  activeBoxId,
  onBoxClick,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {boxes.map((box) => {
        const isActive = activeBoxId === box.id;
        const boxColor = box.color || '#6366f1';

        return (
          <div
            key={box.id}
            onClick={() => onBoxClick && onBoxClick(box)}
            style={{
              left: `${box.x}%`,
              top: `${box.y}%`,
              width: `${box.width}%`,
              height: `${box.height}%`,
              borderColor: boxColor,
              backgroundColor: isActive ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.1)',
            }}
            className={`absolute border-2 rounded-md pointer-events-auto transition-all cursor-pointer ${
              isActive
                ? 'highlight-box-active border-indigo-400 z-20'
                : 'hover:border-indigo-400 hover:bg-indigo-500/20 z-10'
            }`}
          >
            {/* Box Header Label */}
            <div
              style={{ backgroundColor: boxColor }}
              className="absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-md whitespace-nowrap flex items-center space-x-1"
            >
              <span>{box.label || `Grounded Region (${box.type})`}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
