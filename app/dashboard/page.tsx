"use client";

import React, { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Activity, Zap, Shield, LogOut, User, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { logout } from "@/store/slices/authSlice";
import Link from "next/link";

export default function DashboardLanding() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { token } = useSelector((state: RootState) => state.auth);
  const { scrollY } = useScroll();
        
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -150]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("token");
    router.push("/login");
  };

  const navVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6 } },
  };

  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8 } },
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-200 font-sans selection:bg-indigo-500/30 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      
      {/* Navigation */}
      <motion.nav 
        initial="hidden"
        animate="visible"
        variants={navVariants}
        className="fixed top-0 w-full z-50 px-6 py-4 backdrop-blur-md bg-black/40 border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-wide text-white">NEXUS</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <Link href="#" className="hover:text-white transition-colors">Features</Link>
            <Link href="#" className="hover:text-white transition-colors">Analytics</Link>
            <Link href="#" className="hover:text-white transition-colors">Integrations</Link>
          </div>

          <div className="flex items-center gap-4">
            {token ? ( 
              <div className="flex items-center gap-3">
                <button className="hidden md:flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link 
                href="/login"
                className="px-5 py-2 rounded-full bg-white text-black hover:bg-zinc-200 text-sm font-semibold transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                Sign In
              </Link>
            )}
            <button className="md:hidden p-2 text-zinc-400 hover:text-white">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen flex flex-col justify-center">
        <motion.div 
          style={{ y: y1 }}
          className="text-center max-w-4xl mx-auto z-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-indigo-300 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Nexus Dashboard 2.0 is live
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight"
          >
            Manage your universe <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              in anti-gravity.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Experience a dashboard that defies gravity. Smooth, powerful, and designed for the top 1% of creators and startups.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-black font-semibold text-sm hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.15)] group">
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white/5 border border-white/10 text-white font-medium text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
              View Demo
            </button>
          </motion.div>
        </motion.div>

        {/* Floating Abstract Elements */}
        <motion.div 
          style={{ y: y2 }}
          className="absolute top-[20%] right-[10%] w-64 h-64 border border-white/5 rounded-full blur-[1px] -z-10 hidden lg:block"
        />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[20%] left-[10%] w-96 h-96 border border-white/5 rounded-full border-dashed opacity-50 -z-10 hidden lg:block"
        />
      </section>

      {/* Features Grid */}
      <section className="px-6 py-24 max-w-7xl mx-auto z-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Activity, title: "Real-time Metrics", desc: "Watch your data flow instantly with zero latency." },
            { icon: Zap, title: "Lightning Fast", desc: "Built on modern edge infrastructure for maximum speed." },
            { icon: Shield, title: "Enterprise Grade", desc: "Bank-level security protecting your most valuable assets." }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={cardVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-sm hover:bg-white/[0.04] transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-colors">
                <feature.icon className="w-6 h-6 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-zinc-500 leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
      
      {/* Footer minimal */}
      <footer className="border-t border-white/5 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-zinc-500 text-sm">
          <p>© 2026 Nexus Dashboard. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
