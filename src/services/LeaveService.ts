import { IDataAdapter } from './interfaces/IDataAdapter';
import { getDataAdapter } from './DataAdapterFactory';
import { LeaveRecord } from '../types';

export class LeaveService {
  private getAdapter(): IDataAdapter {
    return getDataAdapter();
  }

  async getAll(): Promise<LeaveRecord[]> {
    return this.getAdapter().getLeaves();
  }

  async getByEmployee(employeeId: string): Promise<LeaveRecord[]> {
    return this.getAdapter().getLeavesByEmployee(employeeId);
  }

  async getPending(): Promise<LeaveRecord[]> {
    const leaves = await this.getAdapter().getLeaves();
    return leaves.filter(l => l.status === 'Pending');
  }

  async apply(leave: LeaveRecord): Promise<void> {
    if (!leave.employeeId) throw new Error('Employee ID is required');
    if (!leave.leaveType) throw new Error('Leave type is required');
    if (!leave.startDate) throw new Error('Start date is required');
    if (!leave.endDate) throw new Error('End date is required');
    
    const existing = await this.getAdapter().getLeavesByEmployee(leave.employeeId);
    const overlapping = existing.some(l => 
      (l.status === 'Pending' || l.status === 'Approved') &&
      !(l.endDate < leave.startDate || l.startDate > leave.endDate)
    );
    if (overlapping) throw new Error('You have an overlapping leave request');

    return this.getAdapter().saveLeave(leave);
  }

  async approve(id: string, approvedBy: string): Promise<void> {
    const leaves = await this.getAdapter().getLeaves();
    const leave = leaves.find(l => l.id === id);
    if (!leave) throw new Error('Leave not found');
    const updated: LeaveRecord = { 
      ...leave, 
      status: 'Approved', 
      approvedBy, 
      approvedAt: new Date().toISOString() 
    };
    return this.getAdapter().saveLeave(updated);
  }

  async reject(id: string, reason: string): Promise<void> {
    const leaves = await this.getAdapter().getLeaves();
    const leave = leaves.find(l => l.id === id);
    if (!leave) throw new Error('Leave not found');
    const updated: LeaveRecord = { 
      ...leave, 
      status: 'Rejected', 
      rejectedReason: reason 
    };
    return this.getAdapter().saveLeave(updated);
  }

  async cancel(id: string): Promise<void> {
    const leaves = await this.getAdapter().getLeaves();
    const leave = leaves.find(l => l.id === id);
    if (!leave) throw new Error('Leave not found');
    if (leave.status !== 'Pending') throw new Error('Only pending leaves can be cancelled');
    const updated: LeaveRecord = { 
      ...leave, 
      status: 'Cancelled' 
    };
    return this.getAdapter().saveLeave(updated);
  }

  async sync(): Promise<void> {
    return this.getAdapter().syncModule('leaves');
  }
}

export const leaveService = new LeaveService();
export default leaveService;
