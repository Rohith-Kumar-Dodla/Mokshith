import React from 'react';
import PublicNavbar from '../common/PublicNavbar.jsx';
import Footer from '../common/Footer.jsx';

const PublicLayout = ({ children }) => {
  return (
    <div className="public-layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <PublicNavbar />
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
