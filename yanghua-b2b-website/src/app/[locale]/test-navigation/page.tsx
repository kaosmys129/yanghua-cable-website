import Link from "next/link"

export default function TestNavigationPage() {
  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-[#212529]">测试页面导航</h1>
      
      <div className="space-y-6">
        <div className="p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-[#212529]">文章详情页测试</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">静态测试页面</h3>
              <p className="text-gray-600 mb-3">
                使用模拟数据渲染的静态文章详情页，展示完整的页面布局和样式。
              </p>
              <Link 
                href="/en/test-article" 
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                访问静态测试页面
              </Link>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">动态页面（Strapi数据）</h3>
              <p className="text-gray-600 mb-3">
                从Strapi CMS获取数据的动态文章详情页。
              </p>
              <Link 
                href="/en/articles/a-bug-is-becoming-a-meme-on-the-internet" 
                className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                访问动态页面
              </Link>
            </div>
          </div>
        </div>
        
        <div className="p-6 border rounded-lg bg-gray-50">
          <h2 className="text-2xl font-semibold mb-4 text-[#212529]">测试说明</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>静态测试页面使用 <code className="bg-gray-200 px-1 rounded">/lib/data.ts</code> 中的模拟数据</li>
            <li>动态页面从Strapi CMS获取实时数据</li>
            <li>两个页面使用相同的组件和样式，确保一致性</li>
            <li>静态页面包含调试信息，显示数据来源和文章详情</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-8">
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          ← 返回首页
        </Link>
      </div>
    </main>
  )
}