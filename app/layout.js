import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata = {
  title: "AutoSRS.AI",
  description: "Authentication System",
};

// Yeh 'export default' hona zaroori hai
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <div className="pt-16">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
