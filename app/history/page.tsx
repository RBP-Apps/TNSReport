"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Download, Search, FileText, Building2, Eye, Trash2, BarChart3, Filter, X, Loader2 } from "lucide-react"

interface VoucherData {
  id: string
  voucherNo: string
  dateOfPayment: string
  companyName: string
  beneficiaryName: string
  purposeOfPayment: string
  project: string
  amount: string
  transactionType: string
  timestamp: string
  bankAcFrom: string
  dateOfPaymentProcess: string
  poNumber: string
  beneficiaryAcName: string
  beneficiaryAcNumber: string
  beneficiaryBankName: string
  beneficiaryBankIfsc: string
  particulars: string
  amountInWords: string
  entryDoneBy: string
  checkedBy: string
  approvedBy: string
  pdfLink: string
  [key: string]: any
}

export default function HistoryPage() {
  const router = useRouter()
  const [vouchers, setVouchers] = useState<VoucherData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherData | null>(null)
  const [userRole, setUserRole] = useState("")
  const [username, setUsername] = useState("")
  const [showFullDetails, setShowFullDetails] = useState(false)

  // Filter states
  const [selectedCompany, setSelectedCompany] = useState("all")
  const [selectedProject, setSelectedProject] = useState("all")
  const [selectedPurpose, setSelectedPurpose] = useState("all")
  const [selectedTransactionType, setSelectedTransactionType] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [amountFrom, setAmountFrom] = useState("")
  const [amountTo, setAmountTo] = useState("")

  // Configuration for Google Sheets access
  const SHEET_ID = "1EqDGisEeo_QTH08z8VX44w6pdHGaSyqv5yrmpA4GI-E"
  const SHEET_NAME = "History"
  const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxxHogp4YBZ1VClZCdkEPyAddFUK6Y2grFmMrJHcqfIwufVG5ar9FACeVe_YIBb0PY9/exec"

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("tns_logged_in")
    const storedUserRole = localStorage.getItem("tns_user_role")
    const storedUsername = localStorage.getItem("tns_username")

    if (isLoggedIn !== "true") {
      router.push("/")
      return
    }

    setUserRole(storedUserRole || "user")
    setUsername(storedUsername || "User")
    fetchVouchersFromSheet()
  }, [router])

  const fetchVouchersFromSheet = async () => {
    try {
      setLoading(true)
      console.log('=== FETCHING ACTUAL DATA FROM HISTORY SHEET ===')
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
      alert(`Failed to fetch data from History sheet.\n\nError: ${errorMsg}\n\nPlease check:\n1. History sheet exists\n2. Google Apps Script is deployed\n3. Internet connection`)

      // Don't load mock data - show empty state instead
      setVouchers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchRealHistoryData = async () => {
    try {
      console.log('Fetching real data from History sheet...')

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

  const processRealSheetData = useCallback((data: any[]) => {
    console.log('Processing real data from History sheet...')
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
        // Check if this row has essential data (at least voucher number in column B)
        if (!row || row.length < 2 || !row[1] || String(row[1]).trim() === '') {
          return null
        }

        const voucher: VoucherData = {
          id: `history_${index + 1}`,
          
          // Main display fields with correct column mapping:
          timestamp: row[0] ? String(row[0]) : '', // Column A - TIMESTAMP
          voucherNo: row[1] ? String(row[1]) : '', // Column B - Voucher No.
          bankAcFrom: row[2] ? String(row[2]) : '', // Column C - BANK AC FROM
          companyName: row[3] ? String(row[3]) : '', // Column D - COMPANY NAME
          dateOfPaymentProcess: row[4] ? String(row[4]) : '', // Column E - DATE OF PAYMENT/PROCESS
          purposeOfPayment: row[5] ? String(row[5]) : '', // Column F - PURPOSE OF PAYMENT
          transactionType: row[6] ? String(row[6]) : '', // Column G - TRANSACTION TYPE
          project: row[7] ? String(row[7]) : '', // Column H - PROJECT
          beneficiaryName: row[8] ? String(row[8]) : '', // Column I - BENEFICIARY NAME (PAID TO)
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
    console.log(`✅ Successfully loaded ${sortedVouchers.length} vouchers from History sheet!`)
  }, [])

  // Memoized filter options for performance
  const uniqueCompanies = useMemo(() => {
    const companies = [...new Set(vouchers.map((v) => v.companyName).filter(Boolean))]
    return companies.sort()
  }, [vouchers])

  const uniqueProjects = useMemo(() => {
    const projects = [...new Set(vouchers.map((v) => v.project).filter(Boolean))]
    return projects.sort()
  }, [vouchers])

  const uniquePurposes = useMemo(() => {
    const purposes = [...new Set(vouchers.map((v) => v.purposeOfPayment).filter(Boolean))]
    return purposes.sort()
  }, [vouchers])

  const uniqueTransactionTypes = useMemo(() => {
    const types = [...new Set(vouchers.map((v) => v.transactionType).filter(Boolean))]
    return types.sort()
  }, [vouchers])

  // Memoized filtered vouchers for performance
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((voucher) => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm || (
        voucher.beneficiaryName?.toLowerCase().includes(searchLower) ||
        voucher.voucherNo?.toLowerCase().includes(searchLower) ||
        voucher.project?.toLowerCase().includes(searchLower) ||
        voucher.purposeOfPayment?.toLowerCase().includes(searchLower) ||
        voucher.companyName?.toLowerCase().includes(searchLower)
      )
      
      const matchesCompany = selectedCompany === "all" || voucher.companyName === selectedCompany
      const matchesProject = selectedProject === "all" || voucher.project === selectedProject
      const matchesPurpose = selectedPurpose === "all" || voucher.purposeOfPayment === selectedPurpose
      const matchesTransactionType = selectedTransactionType === "all" || voucher.transactionType === selectedTransactionType

      const voucherDate = new Date(voucher.timestamp)
      const matchesDateFrom = !dateFrom || voucherDate >= new Date(dateFrom)
      const matchesDateTo = !dateTo || voucherDate <= new Date(dateTo)

      const voucherAmount = Number.parseFloat(voucher.amount) || 0
      const matchesAmountFrom = !amountFrom || voucherAmount >= Number.parseFloat(amountFrom)
      const matchesAmountTo = !amountTo || voucherAmount <= Number.parseFloat(amountTo)

      return (
        matchesSearch &&
        matchesCompany &&
        matchesProject &&
        matchesPurpose &&
        matchesTransactionType &&
        matchesDateFrom &&
        matchesDateTo &&
        matchesAmountFrom &&
        matchesAmountTo
      )
    })
  }, [vouchers, searchTerm, selectedCompany, selectedProject, selectedPurpose, selectedTransactionType, dateFrom, dateTo, amountFrom, amountTo])

  const clearAllFilters = useCallback(() => {
    setSearchTerm("")
    setSelectedCompany("all")
    setSelectedProject("all")
    setSelectedPurpose("all")
    setSelectedTransactionType("all")
    setDateFrom("")
    setDateTo("")
    setAmountFrom("")
    setAmountTo("")
  }, [])

  const downloadPDF = async (voucher: VoucherData) => {
    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF()

      // Set font
      doc.setFont("helvetica")

      // Company Header
      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.text(voucher.companyName || "COMPANY NAME", 105, 20, { align: "center" })

      // Add subtitle
      doc.setFontSize(12)
      doc.text("Bank Payment Voucher - Complete Details", 105, 30, { align: "center" })

      // Draw border around the voucher
      doc.rect(10, 35, 190, 250)

      let yPosition = 50

      // Helper function to add a section
      const addSection = (title: string, fields: Array<{ label: string, value: string }>) => {
        // Section title
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.setFillColor(230, 230, 230)
        doc.rect(15, yPosition - 5, 180, 8, 'F')
        doc.text(title, 20, yPosition)
        yPosition += 12

        // Section fields
        doc.setFont("helvetica", "normal")
        doc.setFontSize(8)

        fields.forEach(field => {
          if (yPosition > 270) {
            doc.addPage()
            yPosition = 20
          }

          // Field label
          doc.setFont("helvetica", "bold")
          doc.text(field.label + ":", 20, yPosition)

          // Field value
          doc.setFont("helvetica", "normal")
          const lines = doc.splitTextToSize(field.value || 'N/A', 120)
          doc.text(lines, 80, yPosition)

          yPosition += Math.max(6, lines.length * 4)
        })

        yPosition += 5 // Space between sections
      }

      // Section 1: Basic Voucher Information
      addSection("BASIC VOUCHER INFORMATION", [
        { label: "Timestamp", value: voucher.timestamp ? new Date(voucher.timestamp).toLocaleString("en-IN") : 'N/A' },
        { label: "Voucher Number", value: voucher.voucherNo },
        { label: "Transaction Type", value: voucher.transactionType },
        { label: "Purpose of Payment", value: voucher.purposeOfPayment },
        { label: "Project", value: voucher.project }
      ])

      // Section 2: Bank Information
      addSection("BANK INFORMATION", [
        { label: "Bank AC From", value: voucher.bankAcFrom },
        { label: "Date of Payment/Process", value: voucher.dateOfPaymentProcess }
      ])

      // Section 3: Beneficiary Information
      addSection("BENEFICIARY INFORMATION", [
        { label: "Beneficiary Name (Paid To)", value: voucher.beneficiaryName },
        { label: "PO Number", value: voucher.poNumber },
        { label: "Beneficiary A/C Name", value: voucher.beneficiaryAcName },
        { label: "Beneficiary A/C Number", value: voucher.beneficiaryAcNumber },
        { label: "Beneficiary Bank Name", value: voucher.beneficiaryBankName },
      ])

      // Section 4: Financial Information
      addSection("FINANCIAL INFORMATION", [
        { label: "Particulars", value: voucher.particulars },
        { label: "Amount", value: `₹${Number.parseFloat(voucher.amount).toLocaleString("en-IN")}` },
        { label: "Amount in Words", value: voucher.amountInWords }
      ])

      // Section 5: Approval Information
      addSection("APPROVAL INFORMATION", [
        { label: "Entry Done By", value: voucher.entryDoneBy },
        { label: "Checked By", value: voucher.checkedBy },
        { label: "Approved By", value: voucher.approvedBy },
        { label: "PDF Link", value: voucher.pdfLink }
      ])

      // Footer on last page
      doc.setFontSize(8)
      doc.setFont("helvetica", "italic")
      doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 20, doc.internal.pageSize.height - 20)
      doc.text(`Voucher ID: ${voucher.id}`, 20, doc.internal.pageSize.height - 15)
      doc.text("Complete History Sheet Data Export", 20, doc.internal.pageSize.height - 10)

      // Save the PDF
      doc.save(`Payment_Voucher_${voucher.voucherNo}_${Date.now()}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF')
    }
  }

  const deleteVoucher = async (voucherId: string) => {
    if (!confirm("Are you sure you want to delete this voucher?")) {
      return
    }

    try {
      console.log('Attempting to delete voucher:', voucherId)

      // Extract row number from voucher ID or find the voucher
      const voucher = vouchers.find(v => v.id === voucherId)
      if (!voucher) {
        alert('Voucher not found')
        return
      }

      // For demo purposes, remove from local state
      // In a real implementation, you'd need to identify the row in the sheet
      setVouchers(prevVouchers => prevVouchers.filter(v => v.id !== voucherId))
      alert('Voucher removed from view (Note: This is a demo deletion)')

    } catch (error) {
      console.error('Error deleting voucher:', error)
      alert('Error deleting voucher')
    }
  }

  const getTotalAmount = useMemo(() => {
    return filteredVouchers.reduce((sum, voucher) => sum + (Number.parseFloat(voucher.amount) || 0), 0)
  }, [filteredVouchers])

  const activeFiltersCount = useMemo(() => {
    return [
      selectedCompany !== "all",
      selectedProject !== "all",
      selectedPurpose !== "all",
      selectedTransactionType !== "all",
      dateFrom,
      dateTo,
      amountFrom,
      amountTo,
    ].filter(Boolean).length
  }, [selectedCompany, selectedProject, selectedPurpose, selectedTransactionType, dateFrom, dateTo, amountFrom, amountTo])

  const renderAllDetails = (voucher: VoucherData) => {
    const columnMapping = {
      'timestamp': 'TIMESTAMP',
      'voucherNo': 'Voucher No.',
      'bankAcFrom': 'BANK AC FROM',
      'companyName': 'COMPANY NAME',
      'dateOfPaymentProcess': 'DATE OF PAYMENT/PROCESS',
      'purposeOfPayment': 'PURPOSE OF PAYMENT',
      'transactionType': 'TRANSACTION TYPE',
      'project': 'PROJECT',
      'beneficiaryName': 'BENEFICIARY NAME (PAID TO)',
      'poNumber': 'PO. NUMBER',
      'beneficiaryAcName': '(NAME OF AC HOLDER) BENEFICIARY A/C NAME',
      'beneficiaryAcNumber': 'BENEFICIARY A/C NUMBER',
      'beneficiaryBankName': 'BENEFICIARY BANK NAME',
      'beneficiaryBankIfsc': 'BENEFICIARY BANK IFSC',
      'particulars': 'PARTICULARS',
      'amount': 'AMOUNT',
      'amountInWords': 'AMOUNT IN WORDS',
      'entryDoneBy': 'ENTRY DONE BY',
      'checkedBy': 'CHECKED BY',
      'approvedBy': 'APPROVED BY',
      'pdfLink': 'PDF Link'
    }

    return (
      <div className="mt-4 sm:mt-6 bg-gray-50 p-3 sm:p-4 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">All Details from History Sheet</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
          {Object.entries(columnMapping).map(([key, label]) => (
            <div key={key} className="bg-white p-2 sm:p-3 rounded border">
              <p className="text-gray-600 font-medium text-xs">{label}</p>
              <p className="text-gray-800 break-words mt-1">
                {voucher[key] === null || voucher[key] === undefined || voucher[key] === ''
                  ? 'N/A'
                  : key === 'timestamp' && voucher[key]
                    ? (() => {
                      try {
                        return new Date(voucher[key]).toLocaleString("en-IN")
                      } catch {
                        return String(voucher[key])
                      }
                    })()
                    : key === 'amount' && voucher[key]
                      ? (() => {
                        try {
                          return `₹${Number.parseFloat(voucher[key]).toLocaleString("en-IN")}`
                        } catch {
                          return String(voucher[key])
                        }
                      })()
                      : key === 'pdfLink' && voucher[key] && voucher[key].includes('http')
                        ? (
                          <a href={voucher[key]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View PDF
                          </a>
                        )
                        : String(voucher[key])}
              </p>
            </div>
          ))}
        </div>

        {/* Summary section showing the main fields mapping */}
        <div className="mt-4 sm:mt-6 bg-blue-50 p-3 sm:p-4 rounded-lg">
          <h5 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">Main Fields Summary (as shown in table)</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="space-y-2">
              <p><strong>Voucher No:</strong> {voucher.voucherNo}</p>
              <p><strong>Date:</strong> {voucher.timestamp ? (() => {
                try {
                  return new Date(voucher.timestamp).toLocaleDateString("en-IN")
                } catch {
                  return voucher.timestamp
                }
              })() : 'N/A'}</p>
              <p><strong>Company:</strong> {voucher.companyName}</p>
              <p><strong>Beneficiary:</strong> {voucher.beneficiaryName}</p>
            </div>
            <div className="space-y-2">
              <p><strong>Purpose:</strong> {voucher.purposeOfPayment}</p>
              <p><strong>Project:</strong> {voucher.project}</p>
              <p><strong>Amount:</strong> ₹{Number.parseFloat(voucher.amount || '0').toLocaleString("en-IN")}</p>
              <p><strong>Type:</strong> {voucher.transactionType}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center p-4">
        <Card className="p-6 sm:p-8 text-center w-full max-w-md">
          <CardContent>
            <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">Loading Payment History</h3>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button
                onClick={() => router.push("/voucher")}
                variant="outline"
                size="sm"
                className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 text-xs sm:text-sm"
              >
                <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Back to Voucher
              </Button>
              {userRole === "admin" && (
                <Button
                  onClick={() => router.push("/dashboard")}
                  variant="outline"
                  size="sm"
                  className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 text-xs sm:text-sm"
                >
                  <BarChart3 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Dashboard
                </Button>
              )}
              <Badge variant="secondary" className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 text-xs">
                {filteredVouchers.length} of {vouchers.length} Vouchers
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 text-xs">
                Total: ₹{getTotalAmount.toLocaleString("en-IN")}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Search and Filters */}
        <Card className="shadow-sm">
          <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white">
            <CardTitle className="flex items-center justify-between text-sm sm:text-base">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Search & Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800 text-xs">
                    {activeFiltersCount} active
                  </Badge>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <Button onClick={clearAllFilters} variant="ghost" size="sm" className="text-white hover:bg-white/20 text-xs sm:text-sm">
                  <X className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  Clear All
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
              <Input
                placeholder="Search by voucher number, beneficiary name, project, purpose, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-10 h-10 sm:h-11 border-2 border-gray-200 focus:border-blue-500 text-sm"
              />
            </div>

            {/* Filter Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Company</label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="All Companies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {uniqueCompanies.map((company) => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Project</label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {uniqueProjects.map((project) => (
                      <SelectItem key={project} value={project}>
                        {project}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Purpose</label>
                <Select value={selectedPurpose} onValueChange={setSelectedPurpose}>
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="All Purposes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Purposes</SelectItem>
                    {uniquePurposes.map((purpose) => (
                      <SelectItem key={purpose} value={purpose}>
                        {purpose}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Transaction Type</label>
                <Select value={selectedTransactionType} onValueChange={setSelectedTransactionType}>
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {uniqueTransactionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Row 2 - Date and Amount Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Date From</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 sm:h-10 text-xs sm:text-sm" />
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Date To</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 sm:h-10 text-xs sm:text-sm" />
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Amount From (₹)</label>
                <Input
                  type="number"
                  placeholder="Min amount"
                  value={amountFrom}
                  onChange={(e) => setAmountFrom(e.target.value)}
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Amount To (₹)</label>
                <Input
                  type="number"
                  placeholder="Max amount"
                  value={amountTo}
                  onChange={(e) => setAmountTo(e.target.value)}
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vouchers Table */}
        {filteredVouchers.length === 0 ? (
          <Card className="text-center p-6 sm:p-12">
            <CardContent>
              <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">
                {vouchers.length === 0 ? "No Vouchers Found" : "No Matching Vouchers"}
              </h3>
              <p className="text-sm sm:text-base text-gray-500 mb-4">
                {vouchers.length === 0
                  ? "No payment vouchers found in the History sheet."
                  : "Try adjusting your search criteria or filters."}
              </p>
              {vouchers.length === 0 ? (
                <Button
                  onClick={() => router.push("/voucher")}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm"
                >
                  Create First Voucher
                </Button>
              ) : (
                <Button
                  onClick={clearAllFilters}
                  variant="outline"
                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 text-sm"
                >
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardTitle className="flex items-center text-sm sm:text-base">
                <FileText className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Payment Vouchers ({filteredVouchers.length})
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800 text-xs">
                    Filtered
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Mobile Card View for small screens with scrollable frame */}
              <div className="block sm:hidden">
                <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div className="space-y-3 p-3">
                    {filteredVouchers.map((voucher, index) => (
                      <Card key={voucher.id} className="p-4 shadow-sm border hover:bg-gray-50 transition-colors">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-blue-600 text-sm">{voucher.voucherNo}</p>
                              <p className="text-xs text-gray-500">{new Date(voucher.timestamp).toLocaleDateString("en-IN")}</p>
                            </div>
                            <Badge
                              variant={voucher.transactionType === "PAYMENT" ? "default" : "secondary"}
                              className={`text-xs ${
                                voucher.transactionType === "PAYMENT"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {voucher.transactionType}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm"><strong>Company:</strong> <span className="text-xs">{voucher.companyName}</span></p>
                            <p className="text-sm"><strong>Beneficiary:</strong> <span className="text-xs">{voucher.beneficiaryName}</span></p>
                            <p className="text-sm"><strong>Purpose:</strong> <span className="text-xs">{voucher.purposeOfPayment}</span></p>
                            <p className="text-sm"><strong>Project:</strong> <span className="text-xs">{voucher.project}</span></p>
                          </div>
                          
                          <div className="flex justify-between items-center pt-2 border-t">
                            <p className="font-semibold text-green-600 text-sm">
                              ₹{Number.parseFloat(voucher.amount).toLocaleString("en-IN")}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedVoucher(voucher)
                                setShowFullDetails(false)
                              }}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 text-xs px-3 py-1"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {filteredVouchers.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No vouchers to display</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop Table View for larger screens with scrollable frame */}
              <div className="hidden sm:block">
                <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-gray-50 z-10">
                        <TableRow>
                          <TableHead className="font-semibold text-xs lg:text-sm">Voucher No.</TableHead>
                          <TableHead className="font-semibold text-xs lg:text-sm">Date</TableHead>
                          <TableHead className="font-semibold text-xs lg:text-sm">Company</TableHead>
                          <TableHead className="font-semibold text-xs lg:text-sm">Beneficiary Name</TableHead>
                          <TableHead className="font-semibold text-xs lg:text-sm">Purpose</TableHead>
                          <TableHead className="font-semibold text-xs lg:text-sm">Project</TableHead>
                          <TableHead className="font-semibold text-right text-xs lg:text-sm">Amount</TableHead>
                          <TableHead className="font-semibold text-xs lg:text-sm">Transaction Type</TableHead>
                          <TableHead className="font-semibold text-center text-xs lg:text-sm">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredVouchers.map((voucher, index) => (
                          <TableRow key={voucher.id} className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}>
                            <TableCell className="font-medium text-blue-600 text-xs lg:text-sm">{voucher.voucherNo}</TableCell>
                            <TableCell className="text-xs lg:text-sm">{new Date(voucher.timestamp).toLocaleDateString("en-IN")}</TableCell>
                            <TableCell className="max-w-[100px] lg:max-w-[150px] truncate">
                              <Badge variant="outline" className="text-xs">
                                {voucher.companyName}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[80px] lg:max-w-[120px] truncate text-xs lg:text-sm">{voucher.beneficiaryName}</TableCell>
                            <TableCell className="max-w-[80px] lg:max-w-[100px] truncate text-xs lg:text-sm">{voucher.purposeOfPayment}</TableCell>
                            <TableCell className="max-w-[80px] lg:max-w-[100px] truncate text-xs lg:text-sm">{voucher.project}</TableCell>
                            <TableCell className="text-right font-semibold text-green-600 text-xs lg:text-sm">
                              ₹{Number.parseFloat(voucher.amount).toLocaleString("en-IN")}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={voucher.transactionType === "PAYMENT" ? "default" : "secondary"}
                                className={`text-xs ${
                                  voucher.transactionType === "PAYMENT"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {voucher.transactionType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center space-x-1 lg:space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedVoucher(voucher)
                                    setShowFullDetails(false)
                                  }}
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 p-1 lg:p-2"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredVouchers.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>No vouchers to display</p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Voucher Detail Modal */}
        {selectedVoucher && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <Card className="bg-white w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                  <span>Voucher Details - {selectedVoucher.voucherNo}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedVoucher(null)}
                    className="text-white hover:bg-white/20 p-1 sm:p-2"
                  >
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                {/* Company Header */}
                <div className="text-center border-b pb-3 sm:pb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800">{selectedVoucher.companyName}</h2>
                  <p className="text-sm sm:text-base text-gray-600">Bank Payment Voucher</p>
                </div>

                {/* Basic Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 bg-blue-50 p-3 sm:p-4 rounded-lg">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Voucher Number</p>
                    <p className="font-semibold text-sm sm:text-base">{selectedVoucher.voucherNo}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Timestamp</p>
                    <p className="font-semibold text-sm sm:text-base">
                      {new Date(selectedVoucher.timestamp).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Transaction Type</p>
                    <Badge className="bg-green-100 text-green-800 text-xs">{selectedVoucher.transactionType}</Badge>
                  </div>
                </div>

                {/* Bank & Payment Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">Payment Details</h4>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <p>
                        <strong>Purpose:</strong> {selectedVoucher.purposeOfPayment}
                      </p>
                      <p>
                        <strong>Project:</strong> {selectedVoucher.project}
                      </p>
                      <p>
                        <strong>Bank AC From:</strong> {selectedVoucher.bankAcFrom}
                      </p>
                      <p>
                        <strong>Date of Payment/Process:</strong> {selectedVoucher.dateOfPaymentProcess}
                      </p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">Beneficiary Information</h4>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <p>
                        <strong>Name:</strong> {selectedVoucher.beneficiaryName}
                      </p>
                      <p>
                        <strong>PO Number:</strong> {selectedVoucher.poNumber}
                      </p>
                      <p>
                        <strong>A/C Name:</strong> {selectedVoucher.beneficiaryAcName}
                      </p>
                      <p>
                        <strong>A/C Number:</strong> {selectedVoucher.beneficiaryAcNumber}
                      </p>
                      <p>
                        <strong>Bank Name:</strong> {selectedVoucher.beneficiaryBankName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Amount Details */}
                <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">Amount Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Amount</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">
                        ₹{Number.parseFloat(selectedVoucher.amount).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Amount in Words</p>
                      <p className="font-semibold text-sm sm:text-base">{selectedVoucher.amountInWords}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs sm:text-sm text-gray-600">Particulars</p>
                    <p className="font-semibold text-sm sm:text-base">{selectedVoucher.particulars}</p>
                  </div>
                </div>

                {/* Approval Details */}
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">Approval Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <p className="text-gray-600">Entry Done By</p>
                      <p className="font-semibold">{selectedVoucher.entryDoneBy}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Checked By</p>
                      <p className="font-semibold">{selectedVoucher.checkedBy}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Approved By</p>
                      <p className="font-semibold">{selectedVoucher.approvedBy}</p>
                    </div>
                  </div>
                  {selectedVoucher.pdfLink && (
                    <div className="mt-3">
                      <p className="text-xs sm:text-sm text-gray-600">PDF Link</p>
                      <a
                        href={selectedVoucher.pdfLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-semibold text-sm"
                      >
                        View PDF Document
                      </a>
                    </div>
                  )}
                </div>

                {/* Toggle for full details */}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowFullDetails(!showFullDetails)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs sm:text-sm"
                  >
                    {showFullDetails ? 'Hide Full Details' : 'Show All Details from History Sheet'}
                  </Button>
                </div>

                {/* Full details section */}
                {showFullDetails && renderAllDetails(selectedVoucher)}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}