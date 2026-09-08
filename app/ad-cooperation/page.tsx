export default function AdCooperationPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8" style={{ fontFamily: 'Manrope, sans-serif' }}>
        广告合作
      </h1>

      <div className="space-y-8 text-[#14171F] leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold mb-3">广告位介绍</h2>
          <p>平台首页设有轮播广告位，展示给所有访问阿斯塔纳本地生活平台的用户，适合希望触达在哈中国人、留学生、中企员工及本地用户群体的商家和机构。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">合作方式</h2>
          <p>广告以图片形式展示在首页轮播位，可设置点击跳转链接。具体展示时长、位置及合作细节，可与我们沟通后确定。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">如何合作</h2>
          <p>
            如有广告合作意向，请发送邮件至{' '}
            <a href="mailto:kapkaz595@gmail.com" className="text-[#2B8C93] underline">
              kapkaz595@gmail.com
            </a>
            ，简要说明您的合作需求，我们会尽快与您联系。
          </p>
        </section>
      </div>
    </div>
  );
}
