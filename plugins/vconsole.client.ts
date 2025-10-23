export default defineNuxtPlugin(() => {
  // 只在开发环境启用 vConsole
  if (import.meta.dev) {
    import('vconsole').then((module) => {
      const VConsole = module.default;
      new VConsole();
    });
  }
});
