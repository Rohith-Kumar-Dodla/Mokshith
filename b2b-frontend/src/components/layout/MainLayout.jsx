import React, { useEffect } from 'react';
import Navbar from '../common/Navbar.jsx';
import Footer from '../common/Footer.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../routes/routeConfig.js';

const MainLayout = ({ children }) => {
  const { on } = useSocket();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    // 📡 Real-time Updates: Payment Success
    const offPayment = on('payment:success', (data) => {
      showToast(`🎉 Payment Success: ₹${data.amount.toLocaleString()} for Order #${data.orderId}`, 'success');
      // If we are on the payment page, we might want to refresh or navigate
    });

    // 🚚 Real-time Updates: Delivery Assigned
    const offDelivery = on('delivery:assigned', (data) => {
      showToast(`🚚 Delivery Agent Assigned for Order #${data.orderId}`, 'info');
    });

    return () => {
      if (offPayment) offPayment();
      if (offDelivery) offDelivery();
    };
  }, [on, showToast]);

  return (
    <div className="main-layout flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
      <Navbar />
      <main className="flex-1 w-full flex flex-col items-center py-6 md:py-10 overflow-x-hidden">
        <div className="w-full max-w-[1400px] px-4 md:px-10">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;