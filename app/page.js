"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, ArrowRight, FileText, Zap, LogOut } from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground.jsx";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const particles = useMemo(() => [...Array(8)].map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 4 + Math.random() * 2,
    delay: Math.random() * 2,
  })), []);

  const binaryTexts = useMemo(() => [...Array(3)].map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    text: Math.random() > 0.5 ? '01' : '10',
  })), []);

  return (
    <AnimatedBackground>
      <nav className="flex items-center justify-between px-4 md:px-8 py-6 backdrop-blur-sm bg-white/5 border-b border-white/10">
        <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          AutoSRS.ai
        </div>
        <div className="flex space-x-2 md:space-x-4 items-center">
          {token && user ? (
            <>
              <span className="text-sm text-gray-300 px-3 py-2">
                👤 {user.username}
              </span>
              <Link
                href="/generator"
                className="px-3 md:px-4 py-2 text-sm bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              >
                Chat Bot
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 md:px-4 py-2 text-sm text-red-400 hover:text-red-300 transition flex items-center gap-2"
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 md:px-4 py-2 text-sm hover:text-blue-300 transition">
                Login
              </Link>
              <Link href="/signup" className="px-3 md:px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition text-sm">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          Generate <span className="text-blue-500">IEEE 830</span> SRS <br /> in Minutes.
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mb-10">
          Convert your project ideas into a professional SRS document using AI.
        </p>
        <Link href="/generator">
          <button className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-lg font-semibold hover:scale-105 transition-all shadow-lg shadow-blue-500/30">
            <Bot className="w-6 h-6" />
            Launch AI Generator
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </button>
        </Link>

      {/* AI-Themed Background Animations */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
        {/* Neural Network Nodes */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`node-${i}`}
            className="absolute w-2 h-2 bg-blue-400 rounded-full"
            style={{
              left: `${10 + (i * 7)}%`,
              top: `${20 + (i * 5)}%`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 3 + (i * 0.5),
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}

        {/* Data Flow Particles */}
        {particles.map((particle) => (
          <motion.div
            key={`particle-${particle.id}`}
            className="absolute w-1 h-1 bg-purple-400 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
            }}
          />
        ))}

        {/* Circuit Connections */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {[...Array(6)].map((_, i) => (
            <motion.path
              key={`circuit-${i}`}
              d={`M${10 + i * 15} ${20 + i * 10} Q${30 + i * 10} ${40 + i * 5} ${50 + i * 10} ${60 + i * 5}`}
              stroke="rgba(59, 130, 246, 0.3)"
              strokeWidth="0.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </svg>

        {/* AI Brain Waves */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`wave-${i}`}
            className="absolute border border-cyan-400/30 rounded-full"
            style={{
              width: `${50 + i * 20}px`,
              height: `${50 + i * 20}px`,
              left: `${70 + i * 5}%`,
              top: `${30 + i * 8}%`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}

        {/* Binary Code Stream */}
        {binaryTexts.map((binary, i) => (
          <motion.div
            key={`binary-${binary.id}`}
            className="absolute text-cyan-400/40 text-xs font-mono"
            style={{
              left: `${15 + i * 30}%`,
              top: `${10 + i * 25}%`,
            }}
            animate={{
              y: [0, 100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              delay: i * 1.5,
            }}
          >
            {binary.text}
          </motion.div>
        ))}
      </div>
      </main>
    </AnimatedBackground>
  );
}