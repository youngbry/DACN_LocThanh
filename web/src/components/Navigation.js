import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const menuItems = [
        {
            path: '/',
            label: 'Dashboard',
            icon: '🏠',
            description: 'Trang chủ'
        },
        {
            path: '/my-nfts',
            label: 'NFT của tôi',
            icon: '🏍️',
            description: 'Quản lý NFT cá nhân'
        },
        {
            path: '/all-nfts',
            label: 'Tất cả NFT',
            icon: '🔍',
            description: 'Duyệt toàn bộ NFT'
        },
        {
            path: '/register',
            label: 'Đăng ký xe',
            icon: '➕',
            description: 'Tạo NFT mới'
        },
        {
            path: '/search',
            label: 'Tìm kiếm',
            icon: '🔎',
            description: 'Tìm NFT theo thông tin'
        },
        {
            path: '/marketplace',
            label: 'Marketplace',
            icon: '🏪',
            description: 'Chợ mua bán NFT'
        }
    ];

    const isActive = (path) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <>
            <nav className="navigation">
                <div className="nav-container">
                    <Link to="/" className="nav-logo" onClick={closeMenu}>
                        <span className="logo-icon">🏍️</span>
                        <span className="logo-text">NFT Motorbike</span>
                    </Link>

                    <button 
                        className={`nav-toggle ${isMenuOpen ? 'active' : ''}`}
                        onClick={toggleMenu}
                        aria-label="Toggle menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>

                    <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                                onClick={closeMenu}
                                title={item.description}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Overlay for mobile menu */}
            {isMenuOpen && (
                <div className="nav-overlay" onClick={closeMenu}></div>
            )}
        </>
    );
};

export default Navigation;