import React, { useState, useEffect } from "react";

interface TagListProps {
  items?: string[];
  colorClass?: string; // Optional: for custom color
  deleteable?: boolean;
  onDelete?: (item: string) => void;
}

const TagList: React.FC<TagListProps> = ({ items = [], colorClass, deleteable = false, onDelete }) => {
  const [localItems, setLocalItems] = useState(items);

  // Update local items when props change
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const handleDelete = (itemToDelete: string) => {
    setLocalItems(prev => prev.filter(item => item !== itemToDelete));
    onDelete?.(itemToDelete); // Call parent callback if provided
  };

  return (
    <div className="flex flex-wrap gap-1">
      {localItems.map((item, idx) => (
        <span
          key={idx}
          className={`inline-block text-xs px-2 py-1 rounded-full transition-all duration-200 hover:scale-110 hover:shadow-md cursor-pointer ${colorClass || "bg-blue-100 text-blue-800 hover:bg-blue-200"}`}
        >
          {item}
          {deleteable && (
            <button 
              className="ml-2 hover:text-red-600 transition-all duration-200 hover:scale-110" 
              onClick={() => handleDelete(item)}
            >
              &times;
            </button>
          )}
        </span>
      ))}
    </div>
  );
};

export default TagList;