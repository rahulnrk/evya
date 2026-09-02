import { AppName, CompanyName } from '@/config';
import React from 'react';

const Footer = () => {
  return (
    <footer className="border-t p-4 text-center text-sm text-muted-foreground">
      © 2024 {CompanyName}. All rights reserved by {AppName}
    </footer>
  );
};

export default Footer;
