"use client";

import { useState, useEffect } from "react";
import { ChevronRight, Home, DollarSign, ShoppingCart, Users, TrendingUp, Calendar, Download } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("Sales Report");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [groupBy, setGroupBy] = useState("");

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await apiFetch<any>("/api/admin/stats");
        if (res.data) {
          setStats(res.data);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load stats");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle filter logic here
  };

  const chartData = stats?.revenueByMonth?.map((item: any) => ({
    name: item.month,
    sales: item.revenue,
  })) || [];

  return (
    <div className="flex-1 p-8 overflow-auto bg-[#F1F5F9] min-h-screen font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-800">Reports Dashboard</h1>
          
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
              <Calendar className="w-4 h-4" />
              <span>Last 7 Days</span>
            </button>
            <button className="flex items-center gap-2 bg-[#0052cc] hover:bg-[#0047b3] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center text-[13px] text-slate-500 pb-2">
          <Home className="w-3.5 h-3.5 mr-1.5" />
          <Link href="/admin" className="hover:text-[#0052cc] cursor-pointer transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 mx-1" />
          <span className="text-slate-700">Reports</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-500">
            <div className="w-6 h-6 border-2 border-t-transparent border-[#0052cc] rounded-full animate-spin"></div>
            <span className="ml-3 text-sm font-medium">Loading reports data...</span>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Total Revenue", value: `$${stats?.totalRevenue?.toFixed(2) || '0.00'}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-100" },
                { label: "Total Orders", value: stats?.totalOrders || 0, icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-100" },
                { label: "Active Users", value: stats?.totalUsers || 0, icon: Users, color: "text-indigo-600", bg: "bg-indigo-100" },
                { label: "Total Products", value: stats?.totalProducts || 0, icon: TrendingUp, color: "text-rose-600", bg: "bg-rose-100" },
              ].map((kpi, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-slate-500 mb-1">{kpi.label}</p>
                    <h3 className="text-2xl font-bold text-slate-800">{kpi.value}</h3>
                  </div>
                  <div className={`w-12 h-12 rounded-full ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Chart Section */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 mb-6">Revenue Overview (Last 6 Months)</h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0052cc" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0052cc" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`$${value}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#0052cc" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-6 pt-4">
              {/* Main Content Area */}
              <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 h-fit overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h2 className="text-[15px] font-semibold text-slate-800">Recent Orders</h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px] text-left">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200">
                        <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Order ID</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Customer</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats?.recentOrders?.length > 0 ? stats.recentOrders.map((order: any) => (
                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-slate-600">{format(new Date(order.createdAt), "MMM d, yyyy")}</td>
                          <td className="px-6 py-4 text-slate-800 font-medium">
                            <Link href={`/admin/orders/${order.id}`} className="text-[#0052cc] hover:underline">
                              {order.orderNumber}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{order.customerName || order.user?.name || "Guest"}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.status === 'COMPLETED' || order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                              order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-800 font-medium">${order.total?.toFixed(2)}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No recent orders found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
              </div>
              
              {/* Filter Sidebar */}
              <div className="w-full lg:w-[320px] shrink-0 bg-white rounded-xl shadow-sm border border-slate-200 h-fit overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-[15px] font-semibold text-slate-800">Report Filters</h2>
                </div>
                
                <div className="p-6">
                  <form onSubmit={handleFilter} className="space-y-5">
                    
                    {/* Report Type */}
                    <div className="space-y-2">
                      <label className="text-[13px] font-medium text-slate-700">Report Type</label>
                      <div className="relative">
                        <select 
                          value={reportType}
                          onChange={(e) => setReportType(e.target.value)}
                          className="w-full h-10 pl-3 pr-10 text-[13px] text-slate-700 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc] appearance-none transition-all shadow-sm"
                        >
                          <option value="Sales Report">Sales Report</option>
                          <option value="Coupons Report">Coupons Report</option>
                          <option value="Products Report">Products Report</option>
                          <option value="Customers Report">Customers Report</option>
                        </select>
                        <ChevronRight className="w-4 h-4 absolute right-3 top-3 text-slate-400 rotate-90 pointer-events-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Date Start */}
                      <div className="space-y-2">
                        <label className="text-[13px] font-medium text-slate-700">Start Date</label>
                        <input 
                          type="date" 
                          value={dateStart}
                          onChange={(e) => setDateStart(e.target.value)}
                          className="w-full h-10 px-3 text-[13px] text-slate-700 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc] transition-all shadow-sm"
                        />
                      </div>

                      {/* Date End */}
                      <div className="space-y-2">
                        <label className="text-[13px] font-medium text-slate-700">End Date</label>
                        <input 
                          type="date" 
                          value={dateEnd}
                          onChange={(e) => setDateEnd(e.target.value)}
                          className="w-full h-10 px-3 text-[13px] text-slate-700 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc] transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    {/* Order Status */}
                    <div className="space-y-2">
                      <label className="text-[13px] font-medium text-slate-700">Order Status</label>
                      <div className="relative">
                        <select 
                          value={orderStatus}
                          onChange={(e) => setOrderStatus(e.target.value)}
                          className="w-full h-10 pl-3 pr-10 text-[13px] text-slate-700 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc] appearance-none transition-all shadow-sm"
                        >
                          <option value="">All Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <ChevronRight className="w-4 h-4 absolute right-3 top-3 text-slate-400 rotate-90 pointer-events-none" />
                      </div>
                    </div>

                    {/* Group By */}
                    <div className="space-y-2">
                      <label className="text-[13px] font-medium text-slate-700">Group By</label>
                      <div className="relative">
                        <select 
                          value={groupBy}
                          onChange={(e) => setGroupBy(e.target.value)}
                          className="w-full h-10 pl-3 pr-10 text-[13px] text-slate-700 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc] appearance-none transition-all shadow-sm"
                        >
                          <option value="">Don't Group</option>
                          <option value="day">Days</option>
                          <option value="week">Weeks</option>
                          <option value="month">Months</option>
                          <option value="year">Years</option>
                        </select>
                        <ChevronRight className="w-4 h-4 absolute right-3 top-3 text-slate-400 rotate-90 pointer-events-none" />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <button 
                        type="submit"
                        className="w-full bg-[#0052cc] hover:bg-[#0047b3] text-white h-10 rounded-lg text-[14px] font-medium transition-colors shadow-sm"
                      >
                        Apply Filters
                      </button>
                      <button 
                        type="button"
                        className="w-full mt-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 h-10 rounded-lg text-[14px] font-medium transition-colors shadow-sm"
                      >
                        Reset
                      </button>
                    </div>
                    
                  </form>
                </div>
              </div>
              
            </div>
          </>
        )}
      </div>
    </div>
  );
}
