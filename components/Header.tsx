import React from 'react';
import { MenuIcon } from './icons/Icons';

interface HeaderProps {
    pageTitle: string;
    onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ pageTitle, onMenuClick }) => {
    return (
        <header className="md:hidden flex items-center justify-between p-4 bg-white shadow-md sticky top-0 z-30">
            <h1 className="text-lg font-bold text-primary">{pageTitle}</h1>
            <button 
                onClick={onMenuClick} 
                className="p-2 text-primary"
                aria-label="افتح القائمة"
            >
                <MenuIcon />
            </button>
        </header>
    );
};

export default Header;
