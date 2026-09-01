'use client';
import { useState } from 'react';
import { FaWeixin, FaTiktok, FaInstagram } from 'react-icons/fa';
import Image from 'next/image';

export default function FooterSocial() {
  const [showQR, setShowQR] = useState(false);

  return (
    <div className="flex gap-3 relative">
      <button
        onClick={() => setShowQR(!showQR)}
        className="w-10 h-10 rounded-full bg-[#07C160] flex items-center justify-center text-white hover:opacity-80"
      >
        <FaWeixin size={18} />
      </button>

      {showQR && (
        <div
          className="absolute bottom-14 left-0 bg-white p-3 rounded-lg shadow-xl z-50"
          onMouseLeave={() => setShowQR(false)}
        >
          <Image src="/wechat-qrcode.png" alt="微信公众号二维码" width={160} height={160} />
          <p className="text-xs text-center mt-1 text-gray-500">扫码关注</p>
        </div>
      )}

      <a
        href="https://www.tiktok.com/@harix934?_r=1&_t=ZS-99NDZWMuYB2"
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 rounded-full bg-[#14171F] flex items-center justify-center text-white hover:opacity-80"
      >
        <FaTiktok size={18} />
      </a>

      <a
        href="https://www.instagram.com/garyshbiakyn?igsi=MTYzbnB1MDJsbzk3OQ=="
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] flex items-center justify-center text-white hover:opacity-80"
      >
        <FaInstagram size={18} />
      </a>
    </div>
  );
}
