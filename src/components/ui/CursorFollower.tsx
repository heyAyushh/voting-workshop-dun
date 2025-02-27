"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const CursorFollower = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Function to check screen size
    const checkScreenSize = () => setIsMobile(window.innerWidth < 640);

    checkScreenSize(); // Initial check
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    if (isMobile) return; // Stop cursor movement on mobile

    const moveCursor = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, [isMobile]);

  return (
    <motion.div
      className={`fixed top-0 left-0 w-8 h-8 bg-blue-500 rounded-full pointer-events-none mix-blend-difference z-50 transition-opacity duration-300 ${
        isMobile ? "opacity-0" : "opacity-100"
      }`}
      animate={{ x: position.x - 10, y: position.y - 10 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    />
  );
};

export default CursorFollower;
