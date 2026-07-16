export function validateEmail(email: string): boolean {
  if (typeof email !== 'string' || email.length === 0) return false;
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(trimmed)) return false;
  const [local, domain] = trimmed.split('@');
  if (!local || !domain) return false;
  if (local.startsWith('.') || local.endsWith('.')) return false;
  if (domain.startsWith('.') || domain.endsWith('.')) return false;
  if (domain.includes('..')) return false;
  return true;
}
