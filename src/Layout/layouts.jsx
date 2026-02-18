import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import HeaderNavigation from '../components/HeaderNavigation';
import BottomNav from '../components/BottomNav';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header />
      <HeaderNavigation />
      {/* 56px header + 47px nav = 103px total offset */}
      <main className="pt-[103px] pb-[70px] md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}