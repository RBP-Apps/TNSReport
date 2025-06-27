"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  LogOut,
  FileText,
  Building2,
  Calendar,
  TrendingUp,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Briefcase,
  History,
} from "lucide-react"

interface VoucherData {
  id: string
  voucherNo: string
  dateOfPayment: string
  companyName: string
  bankAccount: string
  transactionType: string
  purposeOfPayment: string
  project: string
  beneficiaryName: string
  poNumber: string
  beneficiaryAccountName: string
  beneficiaryAccountNumber: string
  beneficiaryBankName: string
  beneficiaryBankIFSC: string
  amount: string
  amountInWords: string
  particulars: string
  entryDoneBy: string
  checkedBy: string
  approvedBy: string
  submittedAt: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [vouchers, setVouchers] = useState<VoucherData[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState("all")
  const [selectedProject, setSelectedProject] = useState("all")

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("tns_logged_in")
    const userRole = localStorage.getItem("tns_user_role")
    const storedUsername = localStorage.getItem("tns_username")

    if (isLoggedIn !== "true" || userRole !== "admin") {
      router.push("/")
    } else {
      setUsername(storedUsername || "Admin")
      // Load vouchers from localStorage
      const storedVouchers = JSON.parse(localStorage.getItem("tns_vouchers") || "[]")
      setVouchers(storedVouchers)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("tns_logged_in")
    localStorage.removeItem("tns_username")
    localStorage.removeItem("tns_user_role")
    localStorage.removeItem("tns_user_id")
    router.push("/")
  }

  // Analytics calculations
  const getTotalAmount = () => {
    return vouchers.reduce((sum, voucher) => sum + (Number.parseFloat(voucher.amount) || 0), 0)
  }

  const getCompanyWiseData = () => {
    const companyData: { [key: string]: { count: number; amount: number } } = {}
    vouchers.forEach((voucher) => {
      if (!companyData[voucher.companyName]) {
        companyData[voucher.companyName] = { count: 0, amount: 0 }
      }
      companyData[voucher.companyName].count++
      companyData[voucher.companyName].amount += Number.parseFloat(voucher.amount) || 0
    })
    return Object.entries(companyData).map(([name, data]) => ({ name, ...data }))
  }

  const getProjectWiseData = () => {
    const projectData: { [key: string]: { count: number; amount: number } } = {}
    vouchers.forEach((voucher) => {
      if (!projectData[voucher.project]) {
        projectData[voucher.project] = { count: 0, amount: 0 }
      }
      projectData[voucher.project].count++
      projectData[voucher.project].amount += Number.parseFloat(voucher.amount) || 0
    })
    return Object.entries(projectData).map(([name, data]) => ({ name, ...data }))
  }

  const getDateWiseData = () => {
    const dateData: { [key: string]: { count: number; amount: number } } = {}
    vouchers.forEach((voucher) => {
      const date = new Date(voucher.dateOfPayment).toLocaleDateString("en-IN")
      if (!dateData[date]) {
        dateData[date] = { count: 0, amount: 0 }
      }
      dateData[date].count++
      dateData[date].amount += Number.parseFloat(voucher.amount) || 0
    })
    return Object.entries(dateData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const getMonthlyData = () => {
    const monthlyData: { [key: string]: { count: number; amount: number } } = {}
    vouchers.forEach((voucher) => {
      const date = new Date(voucher.dateOfPayment)
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { count: 0, amount: 0 }
      }
      monthlyData[monthYear].count++
      monthlyData[monthYear].amount += Number.parseFloat(voucher.amount) || 0
    })
    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort()
  }

  const getPurposeWiseData = () => {
    const purposeData: { [key: string]: { count: number; amount: number } } = {}
    vouchers.forEach((voucher) => {
      if (!purposeData[voucher.purposeOfPayment]) {
        purposeData[voucher.purposeOfPayment] = { count: 0, amount: 0 }
      }
      purposeData[voucher.purposeOfPayment].count++
      purposeData[voucher.purposeOfPayment].amount += Number.parseFloat(voucher.amount) || 0
    })
    return Object.entries(purposeData).map(([purpose, data]) => ({ purpose, ...data }))
  }

  const getRecentVouchers = () => {
    return vouchers.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 5)
  }

  const companyWiseData = getCompanyWiseData()
  const projectWiseData = getProjectWiseData()
  const dateWiseData = getDateWiseData()
  const monthlyData = getMonthlyData()
  const purposeWiseData = getPurposeWiseData()
  const recentVouchers = getRecentVouchers()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {username}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => router.push("/voucher")}
                variant="outline"
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                <FileText className="mr-2 h-4 w-4" />
                New Voucher
              </Button>
              <Button
                onClick={() => router.push("/history")}
                variant="outline"
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                <History className="mr-2 h-4 w-4" />
                History
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Vouchers</p>
                  <p className="text-3xl font-bold">{vouchers.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Amount</p>
                  <p className="text-3xl font-bold">₹{getTotalAmount().toLocaleString("en-IN")}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Active Projects</p>
                  <p className="text-3xl font-bold">{projectWiseData.length}</p>
                </div>
                <Briefcase className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Avg Amount</p>
                  <p className="text-3xl font-bold">
                    ₹
                    {vouchers.length > 0 ? Math.round(getTotalAmount() / vouchers.length).toLocaleString("en-IN") : "0"}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Company Wise Analysis */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                Company Wise Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {companyWiseData.map((company, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-800">{company.name}</p>
                      <p className="text-sm text-gray-600">{company.count} vouchers</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">₹{company.amount.toLocaleString("en-IN")}</p>
                      <p className="text-xs text-gray-500">{((company.amount / getTotalAmount()) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
              <CardTitle className="flex items-center">
                <Target className="mr-2 h-5 w-5" />
                Project Wise Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {projectWiseData.slice(0, 5).map((project, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-800">{project.name}</p>
                      <p className="text-sm text-gray-600">{project.count} vouchers</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">₹{project.amount.toLocaleString("en-IN")}</p>
                      <p className="text-xs text-gray-500">{((project.amount / getTotalAmount()) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trends */}
        <Card className="shadow-lg mb-8">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Monthly Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monthlyData.slice(-6).map((month, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        {new Date(month.month + "-01").toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "long",
                        })}
                      </p>
                      <p className="text-lg font-bold text-gray-800">{month.count} vouchers</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">₹{month.amount.toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Purpose Wise & Recent Vouchers */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
              <CardTitle className="flex items-center">
                <PieChart className="mr-2 h-5 w-5" />
                Purpose Wise Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {purposeWiseData.slice(0, 5).map((purpose, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{purpose.purpose}</p>
                      <p className="text-sm text-gray-600">{purpose.count} vouchers</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">₹{purpose.amount.toLocaleString("en-IN")}</p>
                      <Badge variant="secondary" className="text-xs">
                        {((purpose.amount / getTotalAmount()) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Recent Vouchers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {recentVouchers.map((voucher, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{voucher.voucherNo}</p>
                      <p className="text-sm text-gray-600">{voucher.beneficiaryName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(voucher.submittedAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        ₹{Number.parseFloat(voucher.amount).toLocaleString("en-IN")}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {voucher.transactionType}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Date Wise Analysis */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Date Wise Analysis (Last 10 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              {dateWiseData.slice(-10).map((day, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">{day.date}</p>
                    <p className="text-lg font-bold text-gray-800">{day.count}</p>
                    <p className="text-sm font-semibold text-green-600">₹{day.amount.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
