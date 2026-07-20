import { Employee } from '../types';

export function getNextEmployeeId(employees: Employee[]): string {
  const ids = employees
    .map(e => {
      if (!e || !e.id) return null;
      const match = e.id.match(/^EMP-(\d+)$/i);
      if (!match) return null;
      const num = parseInt(match[1], 10);
      return isNaN(num) ? null : num;
    })
    .filter((id): id is number => id !== null);

  const maxId = ids.length > 0 ? Math.max(...ids) : 100;
  return `EMP-${maxId + 1}`;
}
