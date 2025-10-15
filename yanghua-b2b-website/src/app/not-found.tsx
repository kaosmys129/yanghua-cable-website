export default function NotFound() {
  // 纯服务端组件，避免在构建阶段预渲染时引入客户端 Hook
  return (
    <div>
      <h2>404 - Page Not Found</h2>
      <p>The page you're looking for doesn't exist.</p>
    </div>
  );
}