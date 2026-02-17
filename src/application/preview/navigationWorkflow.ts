export const getClosestSectionIndex = (container: HTMLElement) => {
  const sections = Array.from(container.querySelectorAll<HTMLElement>(".menu-section"));
  if (sections.length === 0) return -1;
  const centerY = container.scrollTop + container.clientHeight / 2;
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;
  sections.forEach((section, index) => {
    const sectionCenter = section.offsetTop + section.offsetHeight / 2;
    const distance = Math.abs(sectionCenter - centerY);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });
  return closestIndex;
};

export const centerSection = (container: HTMLElement, index: number, behavior: ScrollBehavior) => {
  const sections = Array.from(container.querySelectorAll<HTMLElement>(".menu-section"));
  const target = sections[index];
  if (!target || container.clientHeight === 0) return;
  const targetTop = target.offsetTop + target.offsetHeight / 2 - container.clientHeight / 2;
  container.scrollTo({ top: targetTop, behavior });
};

export const applySectionFocus = (
  container: HTMLElement,
  syncSectionBackgroundByIndex: (index: number) => void
) => {
  const sections = Array.from(container.querySelectorAll<HTMLElement>(".menu-section"));
  if (sections.length === 0) return;
  const centerY = container.scrollTop + container.clientHeight / 2;
  const maxDistance = Math.max(container.clientHeight * 0.6, 1);
  const closestIndex = getClosestSectionIndex(container);
  syncSectionBackgroundByIndex(closestIndex);

  sections.forEach((section, index) => {
    const sectionCenter = section.offsetTop + section.offsetHeight / 2;
    const distance = Math.abs(sectionCenter - centerY);
    const ratio = Math.min(1, distance / maxDistance);
    const focus = 1 - ratio * 0.14;
    section.style.setProperty("--section-focus", focus.toFixed(3));
    section.classList.toggle("is-centered", index === closestIndex);
  });
};

export const getClosestHorizontalSectionIndex = (container: HTMLElement) => {
  const sections = Array.from(container.querySelectorAll<HTMLElement>(".menu-section"));
  if (sections.length === 0) return -1;
  const centerX = container.scrollLeft + container.clientWidth / 2;
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;
  sections.forEach((section, index) => {
    const sectionCenter = section.offsetLeft + section.offsetWidth / 2;
    const distance = Math.abs(sectionCenter - centerX);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });
  return closestIndex;
};

export const centerSectionHorizontally = (
  container: HTMLElement,
  index: number,
  behavior: ScrollBehavior
) => {
  const sections = Array.from(container.querySelectorAll<HTMLElement>(".menu-section"));
  const target = sections[index];
  if (!target || container.clientWidth === 0) return;
  const targetLeft = target.offsetLeft + target.offsetWidth / 2 - container.clientWidth / 2;
  container.scrollTo({ left: targetLeft, behavior });
};

const recoilResetTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

export const triggerSectionBoundaryRecoil = (
  container: HTMLElement,
  axis: "horizontal" | "vertical",
  direction: number
) => {
  if (typeof window === "undefined") return;
  const activeTimer = recoilResetTimers.get(container);
  if (activeTimer) {
    clearTimeout(activeTimer);
  }
  const offset = (axis === "horizontal" ? 18 : 14) * -Math.sign(direction || 1);
  container.classList.add("menu-scroll--recoil");
  container.style.setProperty("--menu-recoil-x", axis === "horizontal" ? `${offset}px` : "0px");
  container.style.setProperty("--menu-recoil-y", axis === "vertical" ? `${offset}px` : "0px");
  requestAnimationFrame(() => {
    container.style.setProperty("--menu-recoil-x", "0px");
    container.style.setProperty("--menu-recoil-y", "0px");
  });
  const timer = setTimeout(() => {
    container.classList.remove("menu-scroll--recoil");
    container.style.removeProperty("--menu-recoil-x");
    container.style.removeProperty("--menu-recoil-y");
    recoilResetTimers.delete(container);
  }, 190);
  recoilResetTimers.set(container, timer);
};

export const isKeyboardEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true'], [contenteditable='']")
  );
};
