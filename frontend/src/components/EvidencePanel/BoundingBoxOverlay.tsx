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

        return (
          <div
            key={box.id}
            onClick={() => onBoxClick && onBoxClick(box)}
            style={{
              left: `${box.x}%`,
              top: `${box.y}%`,
              width: `${box.width}%`,
              height: `${box.height}%`,
            }}
            className={`absolute rounded-md pointer-events-auto transition-all cursor-pointer bounding-box-answer ${
              isActive ? 'ring-2 ring-amber-500' : ''
            }`}
          >
            {/* Top Yellow Answer Label */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-sm bg-[#f59e0b] text-white text-[10px] font-bold shadow-xs whitespace-nowrap">
              {box.label || 'Answer'}
            </div>
          </div>
        );
      })}
    </div>
  );
};
