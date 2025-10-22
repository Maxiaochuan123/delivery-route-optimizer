export default defineNuxtPlugin(() => {
  // 这个插件只在客户端运行
  return {
    provide: {
      waitForAMap: () => {
        return new Promise<void>((resolve, reject) => {
          if (window.AMap) {
            resolve();
            return;
          }

          let attempts = 0;
          const maxAttempts = 100; // 10秒超时

          const checkAMap = setInterval(() => {
            attempts++;
            
            if (window.AMap) {
              clearInterval(checkAMap);
              console.log('AMap loaded successfully');
              resolve();
            } else if (attempts >= maxAttempts) {
              clearInterval(checkAMap);
              console.error('AMap failed to load after 10 seconds');
              reject(new Error('AMap load timeout'));
            }
          }, 100);
        });
      },
    },
  };
});
