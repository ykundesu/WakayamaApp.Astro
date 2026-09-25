export function useTabTransition() {
  return {
    opacity: 1,
    transform: [{ translateY: 0 }],
  } as const;
}
