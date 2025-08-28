import React from 'react';

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    align?: 'bottom' | 'center';
};

export default function Modal({ isOpen, onClose, children, title, align = 'center' }: ModalProps) {
    if (!isOpen) return null;


    return (
        <div
           className={`fixed inset-0 z-50 flex justify-center
                          ${align === 'center' ? 'items-center' : 'items-end sm:items-start'}
                          bg-black bg-opacity-40 backdrop-blur-sm
                         sm:overflow-y-auto sm:p-4`}          onClick={onClose}
        >
            <div
                className={`bg-white rounded-lg shadow-lg relative
                w-[calc(100vw-2rem)] sm:w-auto
                p-3 md:p-4 lg:p-6
                sm:my-0
               sm:rounded-2xl
               /* רוחב רספונסיבי שמרני במסכים רגילים */
            sm:max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl
               /* גלילה: רק במובייל פנימה, ב-sm+ אין גלילה פנימית */
                max-h-[90vh] lg:max-h-[95vh] xl:max-h-[97vh] overflow-y-auto
`}
                onClick={e => e.stopPropagation()} // Prevent close when clicking inside modal
            >
                <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
                    onClick={onClose}
                >
                    &times;
                </button>
                {title && <h2 className="text-xl font-bold mb-4">{title}</h2>}
                {children}
            </div>
        </div>
    );
} 