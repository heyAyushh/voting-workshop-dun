'use client'

import { motion } from 'framer-motion';
import { Sparkles, Shield, Zap, BarChart as ChartBar } from 'lucide-react';

export default function DashboardFeature() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.4
      }
    }
  };

  const features = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'Tamper-proof voting',
      desc: 'Ensuring votes cannot be altered or manipulated.',
      color: '#9945FF'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Secure & Transparent',
      desc: 'Built on blockchain for full transparency.',
      color: '#14F195'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Fast Transactions',
      desc: 'Optimized for efficiency with minimal fees.',
      color: '#19FB9B'
    },
    {
      icon: <ChartBar className="w-8 h-8" />,
      title: 'Real-time Results',
      desc: 'Instant updates on voting results.',
      color: '#F5A623'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background gradient */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(153, 69, 255, 0.1), transparent 70%)',
          filter: 'blur(80px)'
        }}
      />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 text-center mb-16"
      >
        <motion.h1
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.8,
            ease: [0.34, 1.56, 0.64, 1]
          }}
          className="text-7xl font-extrabold bg-gradient-to-r from-[#9945FF] via-[#14F195] to-[#19FB9B] bg-clip-text text-transparent p-6"
        >
          Solana Voting dApp
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-xl text-gray-300 mt-4"
        >
          Secure, Transparent, and Decentralized Voting on Solana
        </motion.p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-6"
      >
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            }}
            transition={{
              duration: 0.3,
              ease: "easeOut"
            }}
            className="group relative backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-white/20"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: index * 0.1
              }}
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ color: feature.color }}
            >
              {feature.icon}
            </motion.div>
            
            <h3 className="mt-4 text-xl font-semibold" style={{ color: feature.color }}>
              {feature.title}
            </h3>
            
            <p className="mt-2 text-gray-400 text-sm">
              {feature.desc}
            </p>

            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 0.4 }}
              className="absolute inset-0 bg-gradient-to-r rounded-2xl"
              style={{ 
                background: `linear-gradient(45deg, ${feature.color}22, transparent)`,
                filter: 'blur(20px)',
                zIndex: -1
              }}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}