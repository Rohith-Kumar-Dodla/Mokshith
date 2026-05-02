import React, { useState } from 'react';
import { useAuth } from '../../modules/auth/hooks/useAuth';
import Navbar from '../common/Navbar';
import Sidebar from '../common/Sidebar';
import Footer from '../common/Footer';
import styles from './UserLayout.module.css';

const UserLayout = ({ children }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className={styles.userLayoutContainer}>
      <Navbar />
      
      <div className={styles.userLayoutContent}>
        <Sidebar 
          isOpen={true}
          onClose={() => {}}
          user={user}
          onLogout={handleLogout}
        />
        
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default UserLayout;
