import { onUnmounted, watch, unref } from 'vue'

let activeModalsCount = 0

export function useScrollLock(isOpenRef) {
  let isLockedByThis = false;

  watch(isOpenRef, (isOpenVal) => {
    const isOpen = unref(isOpenVal);
    if (isOpen && !isLockedByThis) {
      isLockedByThis = true;
      activeModalsCount++;
      if (activeModalsCount === 1) {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
      }
    } else if (!isOpen && isLockedByThis) {
      isLockedByThis = false;
      activeModalsCount = Math.max(0, activeModalsCount - 1);
      if (activeModalsCount === 0) {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    }
  }, { immediate: true });

  onUnmounted(() => {
    if (isLockedByThis) {
      activeModalsCount = Math.max(0, activeModalsCount - 1);
      if (activeModalsCount === 0) {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    }
  });
}
