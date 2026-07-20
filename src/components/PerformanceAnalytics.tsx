import React, { useState, useMemo } from 'react';
import { Employee, PerformanceReview, User, Department, Designation } from '../types';
import { getPerformanceReviews, getEmployees, getDepartments, getDesignations } from '../lib/storage';
import { getEmployeeDepartment, getEmployeeDesignation } from '../lib/employeeUtils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { ChartWrapper } from './ChartWrapper';
import { safeAverage, safeSum } from '../lib/mathUtils';
import {
  Users, Star, TrendingUp,
  CheckCircle, FileText, BarChart3, Download, Filter
} from 'lucide-react';

interface PerformanceAnalyticsProps {
  user: User | null;
  departments: Department[];
  designations: Designation[];
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

export default function PerformanceAnalytics({ user, departments, designations }: PerformanceAnalyticsProps) {
  const [employees] = useState<Employee[]>(getEmployees());
  const [reviews] = useState<PerformanceReview[]>(getPerformanceReviews());
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [reviewTypeFilter, setReviewTypeFilter] = useState('All');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');

  const deptOptions = ['All', ...departments.map(d => d.name)];

  const filteredReviews = useMemo(() => {
    let filtered = [...reviews];
    
    if (user?.role === 'Manager') {
      const teamIds = employees.filter(e => e.reportingManagerId === user.employeeId).map(e => e.id);
      filtered = filtered.filter(r => teamIds.includes(r.employeeId));
    } else if (user?.role === 'Employee') {
      filtered = filtered.filter(r => r.employeeId === user.employeeId);
    }
    
    if (departmentFilter !== 'All') {
      const deptEmployees = employees.filter(e => e.department === departmentFilter).map(e => e.id);
      filtered = filtered.filter(r => deptEmployees.includes(r.employeeId));
    }
    
    if (reviewTypeFilter !== 'All') {
      filtered = filtered.filter(r => r.reviewerType === reviewTypeFilter);
    }
    
    if (dateRangeStart) {
      filtered = filtered.filter(r => r.submittedAt && new Date(r.submittedAt) >= new Date(dateRangeStart));
    }
    if (dateRangeEnd) {
      filtered = filtered.filter(r => r.submittedAt && new Date(r.submittedAt) <= new Date(dateRangeEnd));
    }
    
    return filtered;
  }, [reviews, employees, user, departmentFilter, reviewTypeFilter, dateRangeStart, dateRangeEnd]);

  const metrics = useMemo(() => {
    const completed = filteredReviews.filter(r => r.status === 'Completed');
    const totalReviews = filteredReviews.length;
    const completedCount = completed.length;
    const completionRate = totalReviews > 0 ? Math.round((completedCount / totalReviews) * 100) : 0;
    
    let totalScore = 0;
    let scoredReviews = 0;
    completed.forEach(r => {
      if (r.overallScore && r.overallScore > 0) {
        totalScore += r.overallScore;
        scoredReviews++;
      }
    });
    const avgScore = scoredReviews > 0 ? Math.round(totalScore / scoredReviews) : 0;
    
    const reviewedEmployees = new Set(completed.map(r => r.employeeId));
    
    return {
      totalReviews,
      completedCount,
      completionRate,
      avgScore,
      reviewedEmployees: reviewedEmployees.size,
    };
  }, [filteredReviews]);

  const scoreDistribution = useMemo(() => {
    const ranges = [
      { range: '0-20%', count: 0 },
      { range: '21-40%', count: 0 },
      { range: '41-60%', count: 0 },
      { range: '61-80%', count: 0 },
      { range: '81-100%', count: 0 },
    ];
    
    const completed = filteredReviews.filter(r => r.status === 'Completed' && r.overallScore > 0);
    completed.forEach(r => {
      const score = r.overallScore || 0;
      if (score <= 20) ranges[0].count++;
      else if (score <= 40) ranges[1].count++;
      else if (score <= 60) ranges[2].count++;
      else if (score <= 80) ranges[3].count++;
      else ranges[4].count++;
    });
    
    return ranges;
  }, [filteredReviews]);

  const departmentScores = useMemo(() => {
    const deptMap = new Map<string, { total: number; count: number }>();
    const completed = filteredReviews.filter(r => r.status === 'Completed' && r.overallScore > 0);
    
    completed.forEach(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      if (emp) {
        if (!deptMap.has(emp.department)) {
          deptMap.set(emp.department, { total: 0, count: 0 });
        }
        const dept = deptMap.get(emp.department)!;
        dept.total += r.overallScore || 0;
        dept.count++;
      }
    });
    
    return Array.from(deptMap.entries()).map(([name, data]) => ({
      name,
      score: data.count > 0 ? Math.round(data.total / data.count) : 0,
      count: data.count
    })).sort((a, b) => b.score - a.score);
  }, [filteredReviews, employees]);

  const typeCompletion = useMemo(() => {
    const types = ['Self', 'Manager', 'Peer', 'Subordinate'];
    return types.map(type => {
      const typeReviews = filteredReviews.filter(r => r.reviewerType === type);
      const completed = typeReviews.filter(r => r.status === 'Completed');
      return {
        type,
        total: typeReviews.length,
        completed: completed.length,
        rate: typeReviews.length > 0 ? Math.round((completed.length / typeReviews.length) * 100) : 0
      };
    });
  }, [filteredReviews]);

  const scoreTrend = useMemo(() => {
    const completed = filteredReviews.filter(r => r.status === 'Completed' && r.submittedAt && r.overallScore > 0);
    const monthMap = new Map<string, { total: number; count: number }>();
    
    completed.forEach(r => {
      const month = new Date(r.submittedAt!).toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthMap.has(month)) {
        monthMap.set(month, { total: 0, count: 0 });
      }
      const data = monthMap.get(month)!;
      data.total += r.overallScore || 0;
      data.count++;
    });
    
    return Array.from(monthMap.entries()).map(([month, data]) => ({
      month,
      average: data.count > 0 ? Math.round(data.total / data.count) : 0,
    }));
  }, [filteredReviews]);

  const typeDistribution = useMemo(() => {
    const types = ['Self', 'Manager', 'Peer', 'Subordinate'];
    return types.map(type => ({
      name: type,
      value: filteredReviews.filter(r => r.reviewerType === type).length,
      color: type === 'Self' ? '#8b5cf6' : type === 'Manager' ? '#3b82f6' : type === 'Peer' ? '#10b981' : '#f59e0b'
    }));
  }, [filteredReviews]);

  const employeeTableData = useMemo(() => {
    const empMap = new Map<string, { employee: Employee; reviews: PerformanceReview[] }>();
    
    filteredReviews.forEach(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      if (emp) {
        if (!empMap.has(emp.id)) {
          empMap.set(emp.id, { employee: emp, reviews: [] });
        }
        empMap.get(emp.id)!.reviews.push(r);
      }
    });
    
    return Array.from(empMap.values()).map(({ employee, reviews }) => {
      const completed = reviews.filter(r => r.status === 'Completed');
      const self = completed.find(r => r.reviewerType === 'Self');
      const manager = completed.find(r => r.reviewerType === 'Manager');
      const peers = completed.filter(r => r.reviewerType === 'Peer');
      const subs = completed.filter(r => r.reviewerType === 'Subordinate');
      
      const peerAvg = peers.length > 0 ? Math.round(peers.reduce((sum, r) => sum + (r.overallScore || 0), 0) / peers.length) : 0;
      const subAvg = subs.length > 0 ? Math.round(subs.reduce((sum, r) => sum + (r.overallScore || 0), 0) / subs.length) : 0;
      
      const overallScore = completed.length > 0 ? Math.round(completed.reduce((sum, r) => sum + (r.overallScore || 0), 0) / completed.length) : 0;
      
      return {
        id: employee.id,
        name: employee.name,
        department: getEmployeeDepartment(employee, departments),
        role: getEmployeeDesignation(employee, designations),
        overallScore,
        selfScore: self?.overallScore || 0,
        managerScore: manager?.overallScore || 0,
        peerScore: peerAvg,
        subordinateScore: subAvg,
        reviewsCompleted: completed.length,
        totalReviews: reviews.length
      };
    }).sort((a, b) => b.overallScore - a.overallScore);
  }, [filteredReviews, employees]);

  const handleExportCSV = () => {
    const headers = ['Employee', 'Department', 'Role', 'Overall Score', 'Self Score', 'Manager Score', 'Peer Score', 'Subordinate Score', 'Reviews Completed'];
    const rows = employeeTableData.map(e => [
      e.name, e.department, e.role, e.overallScore, e.selfScore, e.managerScore, e.peerScore, e.subordinateScore, e.reviewsCompleted
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `performance_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const quickStats = [
    { label: 'Total Reviews', value: metrics.totalReviews, icon: FileText, color: 'text-indigo-600' },
    { label: 'Completed Reviews', value: metrics.completedCount, icon: CheckCircle, color: 'text-emerald-600' },
    { label: 'Completion Rate', value: `${metrics.completionRate}%`, icon: TrendingUp, color: 'text-amber-600' },
    { label: 'Avg Overall Score', value: `${metrics.avgScore}%`, icon: Star, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Performance Analytics
          </h2>
          <p className="text-sm text-slate-500">Insights into review completion and employee performance scores.</p>
        </div>
        <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-medium transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span>{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm bg-slate-50"
        >
          {deptOptions.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
        <select
          value={reviewTypeFilter}
          onChange={(e) => setReviewTypeFilter(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm bg-slate-50"
        >
          <option value="All">All Review Types</option>
          <option value="Self">Self</option>
          <option value="Manager">Manager</option>
          <option value="Peer">Peer</option>
          <option value="Subordinate">Subordinate</option>
        </select>
        <input
          type="date"
          value={dateRangeStart}
          onChange={(e) => setDateRangeStart(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm bg-slate-50"
        />
        <span className="text-sm text-slate-400">to</span>
        <input
          type="date"
          value={dateRangeEnd}
          onChange={(e) => setDateRangeEnd(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm bg-slate-50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Score Distribution</h3>
          <ChartWrapper data={scoreDistribution}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Average Score by Department</h3>
          <ChartWrapper data={departmentScores}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={departmentScores} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="score" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-700">Employee Performance</h3>
          <span className="text-xs text-slate-400">{employeeTableData.length} employees</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 text-left">Employee</th>
                <th className="px-6 py-3 text-left">Department</th>
                <th className="px-6 py-3 text-right">Overall</th>
                <th className="px-6 py-3 text-center">Reviews</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employeeTableData.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-800">{emp.name}</td>
                  <td className="px-6 py-3 text-slate-600">{emp.department}</td>
                  <td className="px-6 py-3 text-right font-bold text-indigo-600">{emp.overallScore}%</td>
                  <td className="px-6 py-3 text-center">
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{emp.reviewsCompleted}/{emp.totalReviews}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
