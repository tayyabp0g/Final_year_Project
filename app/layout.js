import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";
import Navbar from "@/components/Navbar"; // Agar Navbar alag component hai

export const metadata = {
  title: "AutoSRS.AI",
  description: "Authentication System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Puri app ko AuthProvider se wrap karna zaroori hai */}
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html> 
  );
}
