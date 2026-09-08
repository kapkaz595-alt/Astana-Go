'use client';
import { useState } from 'react';
import Image from 'next/image';

export default function WechatQRTrigger({ className }: { className?: string }) {
  const [showQR, setShowQR] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowQR(true)}
        className={className}
      >
        · 微信客服
      </button>

      {showQR && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-white p-6 rounded-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image src="/wechat-qrcode.png" alt="微信公众号二维码" width={260} height={260} />
            <p className="text-sm text-center mt-3 text-gray-500">扫码关注</p>
          </div>
        </div>
      )}
    </>
  );
}
