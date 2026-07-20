import { IDataAdapter } from './interfaces/IDataAdapter';
import { getDataAdapter } from './DataAdapterFactory';
import { PayrollRecord } from '../types';

export class PayrollService {
  private getAdapter(): IDataAdapter {
    return getDataAdapter();
  }

  async getAll(): Promise<PayrollRecord[]> {
    return this.getAdapter().getPayroll();
  }

  async getByEmployee(employeeId: string): Promise<PayrollRecord[]> {
    return this.getAdapter().getPayrollByEmployee(employeeId);
  }

  async save(records: PayrollRecord[]): Promise<void> {
    return this.getAdapter().savePayroll(records);
  }

  async sync(): Promise<void> {
    return this.getAdapter().syncModule('payroll');
  }
}

export const payrollService = new PayrollService();
export default payrollService;
