import React from 'react';

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
};

export default function Modal({ isOpen, onClose, children, title }: ModalProps) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 "
            onClick={onClose}
        >
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
                   onClick={e => e.stopPropagation()} // <-- Prevent close when clicking inside modal
>
                <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
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
        </div>
    );
} 