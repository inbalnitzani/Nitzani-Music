import React, { KeyboardEvent } from "react";
import TagList from "./TagList.tsx";

export type SimpleTag = { id: string; name: string };

export interface TagSectionTexts {
  searchPlaceholder: string;
  addPlaceholder: string;
  newItemsTitle: string;
  loadingText: string;
  noMoreText: string;
  addButtonLabel?: string; 
}

interface TagSectionProps {
  typeKey?: string;

  //search
  searchValue: string;
  onSearchChange: (value: string) => void;

  // add new tag
  newInput: string;
  onNewInputChange: (value: string) => void;
  onAddNew?: (typeKey?: string) => void; 

 
  newItems: string[];
  onDeleteNewItem: (name: string) => void;


  items: SimpleTag[];
  deletedNames: string[];
  onDeleteExisting: (name: string) => void;

  sentinelRef?: React.RefObject<HTMLDivElement>;
  loading?: boolean;
  hasMore?: boolean;

  texts: TagSectionTexts;
}

export default function TagSection({
  typeKey,
  searchValue,
  onSearchChange,
  newInput,
  onNewInputChange,
  onAddNew,
  newItems,
  onDeleteNewItem,
  items,
  deletedNames,
  onDeleteExisting,
  sentinelRef,
  loading = false,
  hasMore = true,
  texts,
}: TagSectionProps) {
  const handleEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onAddNew) {
      onAddNew(typeKey);
    }
  };

  return (
    <div>
      {/* search */}
      <div className="mb-2">
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={texts.searchPlaceholder}
          className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
        />
      </div>

      {/* add */}
      {onAddNew && (
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newInput}
            onChange={(e) => onNewInputChange(e.target.value)}
            onKeyPress={handleEnter}
            placeholder={texts.addPlaceholder}
            className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
          />
          <button onClick={() => onAddNew(typeKey)} className="btn btn-secondary">
            {texts.addButtonLabel ?? "Add"}
          </button>
        </div>
      )}

      {/* items to add*/}
      {newItems.length > 0 && (
        <div className="mb-2">
          <span className="text-sm text-gray-600">{texts.newItemsTitle}:</span>
          <TagList
            items={newItems}
            colorClass="bg-yellow-100 text-yellow-800"
            deleteable
            onDelete={onDeleteNewItem}
          />
        </div>
      )}

      {/* items */}
      <div className="relative border border-gray-300 rounded-md bg-white h-64 overflow-y-auto p-3">
        <TagList
          items={items.map((a) => a.name)}
          deletedItems={deletedNames}
          colorClass="bg-green-100 text-green-800"
          deleteable
          onDelete={onDeleteExisting}
        />

        <div ref={sentinelRef as any} />

        {loading && (
          <div className="absolute bottom-2 left-0 w-full flex justify-center">
            <span className="text-xs text-gray-400">{texts.loadingText}</span>
          </div>
        )}
        {!hasMore && items.length > 0 && (
          <div className="absolute bottom-2 left-0 w-full flex justify-center">
            <span className="text-xs text-gray-400">{texts.noMoreText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
