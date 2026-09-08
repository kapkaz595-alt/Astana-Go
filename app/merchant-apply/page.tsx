export default function MerchantApplyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8" style={{ fontFamily: 'Manrope, sans-serif' }}>
        商家入驻
      </h1>

      <div className="space-y-8 text-[#14171F] leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold mb-3">入驻条件</h2>
          <p>在哈萨克斯坦境内拥有合法营业手续的实体店铺或服务提供者，均可申请入驻。我们欢迎各类本地商家和服务方加入平台，面向所有在哈生活、工作、旅行的用户展示您的店铺。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">入驻费用</h2>
          <p>平台目前处于免费引流阶段，商家入驻<strong>完全免费</strong>，不收取任何上架或展示费用。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">需要提供的资料</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>店铺/服务名称</li>
            <li>营业执照或合法经营证明</li>
            <li>店铺地址</li>
            <li>联系方式（电话/WhatsApp）</li>
            <li>店铺照片（至少1张，建议3-5张）</li>
            <li>简要介绍（经营内容、特色等）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">如何申请</h2>
          <p>
            请将以上资料发送至邮箱{' '}
            <a href="mailto:kapkaz595@gmail.com" className="text-[#2B8C93] underline">
              kapkaz595@gmail.com
            </a>
            ，我们会尽快审核并与您联系，完成上架。
          </p>
        </section>
      </div>
    </div>
  );
}
