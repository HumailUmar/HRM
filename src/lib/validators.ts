export function validateEmail(email: string): boolean {
  // Simple but effective regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
