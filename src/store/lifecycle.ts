import { clearStoreStorageScope, type StoreScope } from './persistence';

interface StoreRegistration {
  id: string;
  scope: StoreScope;
  reset: () => void;
}

const registrations = new Map<string, StoreRegistration>();

/**
 * 注册模块级 store 的清理能力。
 *
 * 注册表只管理生命周期，不依赖任何具体业务 store；相同 id 会覆盖旧注册，兼容开发期热更新。
 */
export function registerStore(registration: StoreRegistration): void {
  registrations.set(registration.id, registration);
}

function resetRegisteredStores(scopes: ReadonlySet<StoreScope>): void {
  registrations.forEach((registration) => {
    if (scopes.has(registration.scope)) {
      registration.reset();
    }
  });
}

/** 清理当前浏览器标签内的临时 store。 */
export function resetTabStores(): void {
  resetRegisteredStores(new Set<StoreScope>(['tab']));
  clearStoreStorageScope('tab');
}

/** 登录会话结束时，清理用户会话及其下属标签状态。 */
export function resetSessionStores(): void {
  resetRegisteredStores(new Set<StoreScope>(['session', 'tab']));
  clearStoreStorageScope('session');
  clearStoreStorageScope('tab');
}
