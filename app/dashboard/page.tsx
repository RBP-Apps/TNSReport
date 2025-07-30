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
  Loader2,
} from "lucide-react"

interface VoucherData {
  id: string
  timestamp: string
  voucherNo: string
  bankAcFrom: string
  companyName: string
  dateOfPaymentProcess: string
  purposeOfPayment: string
  transactionType: string
  project: string
  beneficiaryName: string
  poNumber: string
  beneficiaryAcName: string
  beneficiaryAcNumber: string
  beneficiaryBankName: string
  beneficiaryBankIfsc: string
  particulars: string
  amount: string
  amountInWords: string
  entryDoneBy: string
  checkedBy: string
  approvedBy: string
  pdfLink: string
  dateOfPayment: string
  [key: string]: any
}

export default function DashboardPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [vouchers, setVouchers] = useState<VoucherData[]>([])
  const [loading, setLoading] = useState(true)

  // Configuration for Google Sheets access
  const SHEET_ID = "1EqDGisEeo_QTH08z8VX44w6pdHGaSyqv5yrmpA4GI-E"
  const SHEET_NAME = "History"
  const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxxHogp4YBZ1VClZCdkEPyAddFUK6Y2grFmMrJHcqfIwufVG5ar9FACeVe_YIBb0PY9/exec"

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("tns_logged_in")
    const userRole = localStorage.getItem("tns_user_role")
    const storedUsername = localStorage.getItem("tns_username")

    if (isLoggedIn !== "true" || userRole !== "admin") {
      router.push("/")
    } else {
      setUsername(storedUsername || "Admin")
      fetchVouchersFromSheet()
    }
  }, [router])

  const fetchVouchersFromSheet = async () => {
    try {
      setLoading(true)
      console.log('=== FETCHING DASHBOARD DATA FROM HISTORY SHEET ===')
      console.log('Sheet ID:', SHEET_ID)
      console.log('Sheet Name:', SHEET_NAME)
      console.log('Apps Script URL:', GOOGLE_APPS_SCRIPT_URL)

      // Clear any cached data
      localStorage.removeItem('tns_history_cache')
      localStorage.removeItem('tns_vouchers_cache')

      // Fetch real data from History sheet
      await fetchRealHistoryData()

    } catch (error) {
      console.error('=== FETCH FAILED ===')
      console.error('Error details:', error)

      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Failed to fetch dashboard data from History sheet. Error: ${errorMsg}`)

      // Set empty data on error
      setVouchers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchRealHistoryData = async () => {
    try {
      console.log('Fetching real data from History sheet for dashboard...')

      // Create form data for POST request to read History sheet
      const formData = new FormData()
      formData.append('action', 'getHistoryData')
      formData.append('sheetName', SHEET_NAME)
      formData.append('sheetId', SHEET_ID)

      console.log('Sending POST request to fetch History data...')
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.text()
      console.log('Raw response from Apps Script:', result)

      try {
        const jsonResult = JSON.parse(result)
        console.log('Parsed JSON result:', jsonResult)

        if (jsonResult.success && Array.isArray(jsonResult.data)) {
          console.log('Successfully received data from History sheet')
          console.log('Data preview:', jsonResult.data.slice(0, 2)) // Show first 2 rows for debugging
          processRealSheetData(jsonResult.data)
        } else if (jsonResult.error) {
          console.error('Apps Script returned error:', jsonResult.error)
          throw new Error(`Apps Script error: ${jsonResult.error}`)
        } else {
          console.error('Invalid response format:', jsonResult)
          throw new Error('Invalid response format from Apps Script')
        }
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError)
        console.log('Response text was:', result)

        if (result.includes('Google Apps Script is running')) {
          throw new Error('Apps Script is running but getHistoryData action is not implemented')
        }

        throw new Error('Invalid JSON response from Apps Script')
      }

    } catch (error) {
      console.error('Failed to fetch real data:', error)
      throw error
    }
  }

  const processRealSheetData = (data: any[]) => {
    console.log('Processing real data from History sheet for dashboard...')
    console.log('Raw data received:', data)

    if (!Array.isArray(data) || data.length === 0) {
      console.log('No data received from History sheet')
      setVouchers([])
      return
    }

    // Check if first row contains headers
    const hasHeaders = data.length > 0 &&
      (String(data[0][0]).toLowerCase().includes('timestamp') ||
        String(data[0][1]).toLowerCase().includes('voucher') ||
        String(data[0][0]).toLowerCase().includes('date'))

    console.log('Has headers:', hasHeaders)
    const dataRows = hasHeaders ? data.slice(1) : data
    console.log(`Processing ${dataRows.length} data rows from History sheet`)

    const mappedVouchers = dataRows
      .map((row: any[], index: number) => {
        console.log(`Processing row ${index + 1}:`, row)

        // Check if this row has essential data (at least voucher number in column B)
        if (!row || row.length < 2 || !row[1] || String(row[1]).trim() === '') {
          console.log(`Skipping row ${index + 1}: Missing voucher number in column B`)
          return null
        }

        const voucher: VoucherData = {
          id: `history_${index + 1}`,

          // Main display fields with correct column mapping:
          timestamp: row[0] ? String(row[0]) : '', // Column A - TIMESTAMP
          voucherNo: row[1] ? String(row[1]) : '', // Column B - Voucher No.
          bankAcFrom: row[2] ? String(row[2]) : '', // Column C - BANK AC FROM
          companyName: row[3] ? String(row[3]) : '', // Column D - COMPANY NAME
          dateOfPaymentProcess: row[4] ? String(row[4]) : '', // Column E - DATE
          purposeOfPayment: row[5] ? String(row[5]) : '', // Column F - PURPOSE
          transactionType: row[6] ? String(row[6]) : '', // Column G - TRANSACTION TYPE
          project: row[7] ? String(row[7]) : '', // Column H - PROJECT
          beneficiaryName: row[8] ? String(row[8]) : '', // Column I - BENEFICIARY NAME PAYER
          poNumber: row[9] ? String(row[9]) : '', // Column J - PO. NUMBER
          beneficiaryAcName: row[10] ? String(row[10]) : '', // Column K - (NAME OF AC HOLDER) BENEFICIARY A/C NAME
          beneficiaryAcNumber: row[11] ? String(row[11]) : '', // Column L - BENEFICIARY A/C NUMBER
          beneficiaryBankName: row[12] ? String(row[12]) : '', // Column M - BENEFICIARY BANK NAME
          beneficiaryBankIfsc: row[13] ? String(row[13]) : '', // Column N - BENEFICIARY BANK IFSC
          particulars: row[14] ? String(row[14]) : '', // Column O - PARTICULARS
          amount: row[15] ? String(row[15]) : '0', // Column P - AMOUNT
          amountInWords: row[16] ? String(row[16]) : '', // Column Q - AMOUNT IN WORDS
          entryDoneBy: row[17] ? String(row[17]) : '', // Column R - ENTRY DONE BY
          checkedBy: row[18] ? String(row[18]) : '', // Column S - CHECKED BY
          approvedBy: row[19] ? String(row[19]) : '', // Column T - APPROVED BY
          pdfLink: row[20] ? String(row[20]) : '', // Column U - PDF Link

          // Set dateOfPayment for compatibility (using timestamp)
          dateOfPayment: row[0] ? String(row[0]) : '',
        }

        console.log(`Mapped voucher ${index + 1}:`, {
          id: voucher.id,
          voucherNo: voucher.voucherNo,
          companyName: voucher.companyName,
          amount: voucher.amount,
          date: voucher.timestamp
        })

        return voucher
      })
      .filter((voucher: { voucherNo: string } | null): voucher is VoucherData =>
        Boolean(voucher && voucher.voucherNo && voucher.voucherNo.trim() !== '')
      )

    console.log(`Successfully processed ${mappedVouchers.length} real vouchers from History sheet`)

    if (mappedVouchers.length === 0) {
      console.warn('No valid vouchers found in History sheet data')
      setVouchers([])
      return
    }

    // Sort by date (newest first) and set the data
    const sortedVouchers = mappedVouchers.sort((a, b) => {
      const dateA = new Date(a.timestamp)
      const dateB = new Date(b.timestamp)
      return dateB.getTime() - dateA.getTime()
    })

    setVouchers(sortedVouchers)
    console.log(`✅ Successfully loaded ${sortedVouchers.length} vouchers from History sheet for dashboard!`)
    console.log('Voucher numbers loaded:', sortedVouchers.map(v => v.voucherNo))
    console.log('Sample voucher data:', sortedVouchers[0])
  }

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
      const date = new Date(voucher.timestamp).toLocaleDateString("en-IN")
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
      const date = new Date(voucher.timestamp)
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
    return vouchers.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center p-4">
        <Card className="p-6 sm:p-8 text-center w-full max-w-md">
          <CardContent>
            <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">Loading Dashboard</h3>
          </CardContent>
        </Card>
      </div>
    )
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
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg">
                <Building2 className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-800">Admin Dashboard</h1>
                <p className="text-xs sm:text-sm text-gray-600">Welcome, {username}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                onClick={() => router.push("/voucher")}
                variant="outline"
                size="sm"
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 text-xs sm:text-sm flex-1 sm:flex-none"
              >
                <FileText className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                New Voucher
              </Button>
              <Button
                onClick={() => router.push("/history")}
                variant="outline"
                size="sm"
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 text-xs sm:text-sm flex-1 sm:flex-none"
              >
                <History className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                History
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 text-xs sm:text-sm flex-1 sm:flex-none"
              >
                <LogOut className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Vouchers</p>
                  <p className="text-lg sm:text-3xl font-bold">{vouchers.length}</p>
                </div>
                <FileText className="h-4 w-4 sm:h-8 sm:w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs sm:text-sm font-medium">Total Amount</p>
                  <p className="text-sm sm:text-3xl font-bold">₹{getTotalAmount().toLocaleString("en-IN")}</p>
                </div>
                <DollarSign className="h-4 w-4 sm:h-8 sm:w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs sm:text-sm font-medium">Active Projects</p>
                  <p className="text-lg sm:text-3xl font-bold">{projectWiseData.length}</p>
                </div>
                <Briefcase className="h-4 w-4 sm:h-8 sm:w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-xs sm:text-sm font-medium">Avg Amount</p>
                  <p className="text-sm sm:text-3xl font-bold">
                    ₹
                    {vouchers.length > 0 ? Math.round(getTotalAmount() / vouchers.length).toLocaleString("en-IN") : "0"}
                  </p>
                </div>
                <TrendingUp className="h-4 w-4 sm:h-8 sm:w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Company Wise Analysis & Project Wise Analysis with Scrollable Frames */}
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardTitle className="flex items-center text-sm sm:text-base">
                <Building2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Company Wise Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-80 sm:max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  {companyWiseData.map((company, index) => (
                    <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">{company.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600">{company.count} vouchers</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-green-600 text-sm sm:text-base">₹{company.amount.toLocaleString("en-IN")}</p>
                        <p className="text-xs text-gray-500">{((company.amount / getTotalAmount()) * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                  {companyWiseData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No company data available</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
              <CardTitle className="flex items-center text-sm sm:text-base">
                <Target className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Project Wise Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-80 sm:max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  {projectWiseData.map((project, index) => (
                    <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">{project.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600">{project.count} vouchers</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-green-600 text-sm sm:text-base">₹{project.amount.toLocaleString("en-IN")}</p>
                        <p className="text-xs text-gray-500">{((project.amount / getTotalAmount()) * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                  {projectWiseData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No project data available</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trends */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardTitle className="flex items-center text-sm sm:text-base">
              <BarChart3 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Monthly Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {monthlyData.slice(-6).map((month, index) => (
                <div key={index} className="p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-gray-600">
                        {new Date(month.month + "-01").toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "long",
                        })}
                      </p>
                      <p className="text-sm sm:text-lg font-bold text-gray-800">{month.count} vouchers</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm sm:text-lg font-bold text-green-600">₹{month.amount.toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Purpose Wise & Recent Vouchers with Scrollable Frames */}
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
              <CardTitle className="flex items-center text-sm sm:text-base">
                <PieChart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Purpose Wise Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-80 sm:max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  {purposeWiseData.map((purpose, index) => (
                    <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="font-medium text-gray-800 text-sm sm:text-base truncate">{purpose.purpose}</p>
                        <p className="text-xs sm:text-sm text-gray-600">{purpose.count} vouchers</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-green-600 text-sm sm:text-base">₹{purpose.amount.toLocaleString("en-IN")}</p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {((purpose.amount / getTotalAmount()) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {purposeWiseData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No purpose data available</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
              <CardTitle className="flex items-center text-sm sm:text-base">
                <Activity className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Recent Vouchers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-80 sm:max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  {recentVouchers.map((voucher, index) => (
                    <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="font-medium text-gray-800 text-sm sm:text-base truncate">{voucher.voucherNo}</p>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{voucher.beneficiaryName}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(voucher.timestamp).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-green-600 text-sm sm:text-base">
                          ₹{Number.parseFloat(voucher.amount).toLocaleString("en-IN")}
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {voucher.transactionType}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {recentVouchers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No recent vouchers available</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Date Wise Analysis */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
            <CardTitle className="flex items-center text-sm sm:text-base">
              <Calendar className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Date Wise Analysis (Last 10 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {dateWiseData.slice(-10).map((day, index) => (
                <div key={index} className="p-3 sm:p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border">
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{day.date}</p>
                    <p className="text-sm sm:text-lg font-bold text-gray-800">{day.count}</p>
                    <p className="text-xs sm:text-sm font-semibold text-green-600">₹{day.amount.toLocaleString("en-IN")}</p>
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