export default defineEventHandler((event) => {
  const start = Date.now();
  const method = event.method;
  const url = event.path;

  // 请求开始日志
  console.log(`[${new Date().toISOString()}] ${method} ${url} - Request started`);

  // 响应完成后记录
  event.node.res.on('finish', () => {
    const duration = Date.now() - start;
    const status = event.node.res.statusCode;
    console.log(
      `[${new Date().toISOString()}] ${method} ${url} - ${status} - ${duration}ms`
    );
  });
});
