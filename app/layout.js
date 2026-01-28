import './globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'AutoSRS.ai',
  description: 'Generate IEEE 830 SRS documents',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
