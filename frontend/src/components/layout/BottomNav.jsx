import { NavLink, useLocation } from 'react-router-dom';
import { Home, DoorOpen, Users, IndianRupee, MoreHorizontal } from 'lucide-react';

const BottomNav = () => {
    const location = useLocation();

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/rooms', icon: DoorOpen, label: 'Rooms' },
        { path: '/residents', icon: Users, label: 'Residents' },
        { path: '/rent', icon: IndianRupee, label: 'Rent' },
        { path: '/more', icon: MoreHorizontal, label: 'More' },
    ];

    return (
        <nav className="bottom-nav">
            {navItems.map(({ path, icon: Icon, label }) => (
                <NavLink
                    key={path}
                    to={path}
                    className={({ isActive }) =>
                        `bottom-nav-item ${isActive ? 'active' : ''}`
                    }
                >
                    <Icon size={24} />
                    <span>{label}</span>
                </NavLink>
            ))}
        </nav>
    );
};

export default BottomNav;
