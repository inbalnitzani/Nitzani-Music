import React from 'react';

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
};

export default function Modal({ isOpen, onClose, children, title, size = 'md' }: ModalProps) {
    if (!isOpen) return null;
    
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        '2xl': 'max-w-6xl',
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm"
            onClick={onClose}
        >
            <div 
                className={`bg-white rounded-lg shadow-lg w-full p-6 relative ${sizeClasses[size]}`}
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