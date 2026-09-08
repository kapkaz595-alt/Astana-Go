'use client';
import { useState } from 'react';
import Image from 'next/image';

export default function WechatQRTrigger({ className }: { className?: string }) {
  const [showQR, setShowQR] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowQR(!showQR)}
        className={className}
      >
        · 微信客服
      </button>

      {showQR && (
        <div
          className="absolute bottom-full mb-2 left-0 bg-white p-3 rounded-lg shadow-xl z-50 border border-[#E7E9EE]"
          onMouseLeave={() => setShowQR(false)}
        >
          <Image src="/wechat-qrcode.png" alt="微信公众号二维码" width={160} height={160} />
          <p className="text-xs text-center mt-1 text-gray-500">扫码关注</p>
        </div>
      )}
    </div>
  );
}
