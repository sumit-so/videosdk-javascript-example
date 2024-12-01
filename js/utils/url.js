export const urlParams = new URL(window.location.href);

export function setUrlParams(key, value) {
  urlParams.searchParams.set(key, value);
  window.history.replaceState({}, "", urlParams);
}

export function deleteUrlParams(key) {
  urlParams.searchParams.delete(key);
  window.history.replaceState({}, "", urlParams);
}
