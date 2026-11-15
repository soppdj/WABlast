import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 pt-16 md:p-6 md:pt-6">
        <Outlet />
      </main>
    </div>
  );
}
