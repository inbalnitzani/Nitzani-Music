import React, { useState, useEffect } from "react";

interface TagListProps {
  items?: string[];
  colorClass?: string; // Optional: for custom color
  deleteable?: boolean;
  onDelete?: (item: string) => void;
  deletedItems?: string[];
  clickable?: boolean; // New: make tags clickable
  onClick?: (item: string) => void; // New: callback when tag is clicked
}

const TagList: React.FC<TagListProps> = ({ items = [], colorClass, deleteable = false, onDelete, deletedItems = [], clickable = false, onClick }) => {
  const [localItems, setLocalItems] = useState(items);

  // Update local items when props change
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const handleDelete = (itemToDelete: string) => {
    setLocalItems(prev => prev.filter(item => item !== itemToDelete));
    onDelete?.(itemToDelete); // Call parent callback if provided
  };

  const handleTagClick = (item: string, event: React.MouseEvent) => {
    if (clickable && onClick) {
      event.stopPropagation(); // Prevent row click when clicking on tag
      onClick(item);
    }
  };

  return (
    <div className="flex flex-wrap gap-1">
      {localItems.map((item, idx) => {
        const isDeleted = deletedItems.includes(item);
        return (
          <span
            key={idx}
            className={`inline-block text-xs px-2 py-1 rounded-full transition-all duration-200 hover:scale-110 hover:shadow-md ${
              clickable ? 'cursor-pointer' : 'cursor-default'
            } ${
              isDeleted
                ? 'bg-gray-200 text-gray-400 line-through'
                : colorClass || "bg-blue-100 text-blue-800 hover:bg-blue-200"
            }`}
            onClick={(e) => handleTagClick(item, e)}
          >
            {item}
            {deleteable && !isDeleted && (
              <button 
                className="ml-2 hover:text-red-600 transition-all duration-200 hover:scale-110" 
                onClick={() => handleDelete(item)}
              >
                &times;
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
};

export default TagList;