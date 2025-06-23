import React from "react";

interface TagListProps {
  items?: string[];
  colorClass?: string; // Optional: for custom color
}

const TagList: React.FC<TagListProps> = ({ items = [], colorClass }) => {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, idx) => (
        <span
          key={idx}
          className={`inline-block text-xs px-2 py-1 rounded-full ${colorClass || "bg-blue-100 text-blue-800"}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
};

export default TagList;