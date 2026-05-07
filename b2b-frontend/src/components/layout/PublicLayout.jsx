import React from 'react';
import PublicNavbar from '../common/PublicNavbar.jsx';
import Footer from '../common/Footer.jsx';

const PublicLayout = ({ children }) => {
  return (
    <div className="public-layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <PublicNavbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
