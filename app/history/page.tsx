"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import type React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Search, FileText, Download, Trash2, BarChart3, Filter, X, Loader2 } from "lucide-react"

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
  name: string
  originalRowIndex?: number
  [key: string]: any
}

interface MasterData {
  companyNames: string[]
  transactionTypes: string[]
  projects: string[]
  bankAccounts: string[]
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

  // Master data state for dropdowns
  const [masterData, setMasterData] = useState<MasterData>({
    companyNames: [],
    transactionTypes: [],
    projects: [],
    bankAccounts: []
  })
  const [loadingMasterData, setLoadingMasterData] = useState(false)

  // Filter states
  const [selectedCompany, setSelectedCompany] = useState("all")
  const [selectedProject, setSelectedProject] = useState("all")
  const [selectedPurpose, setSelectedPurpose] = useState("all")
  const [selectedTransactionType, setSelectedTransactionType] = useState("all")
  const [selectedName, setSelectedName] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [amountFrom, setAmountFrom] = useState("")
  const [amountTo, setAmountTo] = useState("")

  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editVoucher, setEditVoucher] = useState<VoucherData | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [deletingVoucherId, setDeletingVoucherId] = useState<string | null>(null)

  // Add convertNumberToWords function
  const convertNumberToWords = (num: number): string => {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ]
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    if (num === 0) return "Zero"
    if (num < 10) return ones[num]
    if (num < 20) return teens[num - 10]
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "")
    if (num < 1000)
      return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + convertNumberToWords(num % 100) : "")
    if (num < 100000)
      return (
        convertNumberToWords(Math.floor(num / 1000)) +
        " Thousand" +
        (num % 1000 ? " " + convertNumberToWords(num % 1000) : "")
      )
    if (num < 10000000)
      return (
        convertNumberToWords(Math.floor(num / 100000)) +
        " Lakh" +
        (num % 100000 ? " " + convertNumberToWords(num % 100000) : "")
      )
    return (
      convertNumberToWords(Math.floor(num / 10000000)) +
      " Crore" +
      (num % 10000000 ? " " + convertNumberToWords(num % 10000000) : "")
    )
  }

  // Add handleAmountChange function
  const handleAmountChange = (value: string) => {
    if (!editVoucher) return

    setEditVoucher(prev => prev ? { ...prev, amount: value } : null)

    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      const words = convertNumberToWords(numValue) + " Rupees Only"
      setEditVoucher(prev => prev ? { ...prev, amountInWords: words } : null)
    } else {
      setEditVoucher(prev => prev ? { ...prev, amountInWords: "" } : null)
    }
  }

  // Configuration for Google Sheets access
  const SHEET_ID = "1EqDGisEeo_QTH08z8VX44w6pdHGaSyqv5yrmpA4GI-E"
  const SHEET_NAME = "History"
  const MASTER_SHEET_NAME = "Master"
  const GOOGLE_APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxxHogp4YBZ1VClZCdkEPyAddFUK6Y2grFmMrJHcqfIwufVG5ar9FACeVe_YIBb0PY9/exec"

  // Function to fetch master data from Google Sheet
  const fetchMasterData = async () => {
    try {
      setLoadingMasterData(true)
      console.log("=== FETCHING MASTER DATA ===")
      console.log("Sheet ID:", SHEET_ID)
      console.log("Master Sheet Name:", MASTER_SHEET_NAME)
      console.log("Apps Script URL:", GOOGLE_APPS_SCRIPT_URL)

      // Create form data for POST request to read Master sheet
      const formData = new FormData()
      formData.append("action", "getMasterData")
      formData.append("sheetName", MASTER_SHEET_NAME)
      formData.append("sheetId", SHEET_ID)

      console.log("Sending POST request to fetch Master data...")

      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.text()
      console.log("Raw response from Apps Script:", result)

      try {
        const jsonResult = JSON.parse(result)
        console.log("Parsed JSON result:", jsonResult)

        if (jsonResult.success && jsonResult.data) {
          console.log("Successfully received master data")
          console.log("Master data received:", jsonResult.data)

          // The Apps Script already processes the data and returns organized arrays
          setMasterData({
            companyNames: jsonResult.data.companyNames || [],
            transactionTypes: jsonResult.data.transactionTypes || [],
            projects: jsonResult.data.projects || [],
            bankAccounts: jsonResult.data.bankAccounts || []
          })

          console.log(`✅ Successfully loaded master data!`)
          console.log("Company Names:", jsonResult.data.companyNames)
          console.log("Transaction Types:", jsonResult.data.transactionTypes)
          console.log("Projects:", jsonResult.data.projects)
          console.log("Bank Accounts:", jsonResult.data.bankAccounts)

        } else if (jsonResult.error) {
          console.error("Apps Script returned error:", jsonResult.error)
          throw new Error(`Apps Script error: ${jsonResult.error}`)
        } else {
          console.error("Invalid response format:", jsonResult)
          throw new Error("Invalid response format from Apps Script")
        }
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError)
        console.log("Response text was:", result)
        if (result.includes("Google Apps Script is running")) {
          throw new Error("Apps Script is running but getMasterData action is not implemented")
        }
        throw new Error("Invalid JSON response from Apps Script")
      }
    } catch (error) {
      console.error("Failed to fetch master data:", error)
      // Set fallback data if fetch fails
      setMasterData({
        companyNames: ["ABC Corp", "XYZ Ltd", "Global Tech"],
        transactionTypes: ["PAYMENT", "TRANSFER", "REFUND", "OTHER"],
        projects: ["Project Alpha", "Project Beta", "Project Gamma"],
        bankAccounts: ["SBI - 1234", "HDFC - 5678", "ICICI - 9012"]
      })
      console.log("Using fallback master data due to fetch failure")
    } finally {
      setLoadingMasterData(false)
    }
  }

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
      console.log("=== FETCHING ACTUAL DATA FROM HISTORY SHEET ===")
      console.log("Sheet ID:", SHEET_ID)
      console.log("Sheet Name:", SHEET_NAME)
      console.log("Apps Script URL:", GOOGLE_APPS_SCRIPT_URL)

      // Clear any cached data
      localStorage.removeItem("tns_history_cache")
      localStorage.removeItem("tns_vouchers_cache")

      // Fetch real data from History sheet
      await fetchRealHistoryData()
    } catch (error) {
      console.error("=== FETCH FAILED ===")
      console.error("Error details:", error)
      const errorMsg = error instanceof Error ? error.message : "Unknown error"
      alert(
        `Failed to fetch data from History sheet.\n\nError: ${errorMsg}\n\nPlease check:\n1. History sheet exists\n2. Google Apps Script is deployed\n3. Internet connection`,
      )
      // Don't load mock data - show empty state instead
      setVouchers([])
    } finally {
      setLoading(false)
    }
  }

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    try {
      // Try to parse as ISO date string first
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // If not valid ISO, try parsing as DD/MM/YYYY
        const parts = dateString.split("/");
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // months are 0-indexed
          const year = parseInt(parts[2], 10);
          return new Date(year, month, day).toISOString().split("T")[0];
        }
        return "";
      }
      return date.toISOString().split("T")[0];
    } catch {
      return "";
    }
  }

  const fetchRealHistoryData = async () => {
    try {
      console.log("Fetching real data from History sheet...")

      // Create form data for POST request to read History sheet
      const formData = new FormData()
      formData.append("action", "getHistoryData")
      formData.append("sheetName", SHEET_NAME)
      formData.append("sheetId", SHEET_ID)

      console.log("Sending POST request to fetch History data...")

      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.text()
      console.log("Raw response from Apps Script:", result)

      try {
        const jsonResult = JSON.parse(result)
        console.log("Parsed JSON result:", jsonResult)

        if (jsonResult.success && Array.isArray(jsonResult.data)) {
          console.log("Successfully received data from History sheet")
          console.log("Data preview:", jsonResult.data.slice(0, 2)) // Show first 2 rows for debugging
          processRealSheetData(jsonResult.data)
        } else if (jsonResult.error) {
          console.error("Apps Script returned error:", jsonResult.error)
          throw new Error(`Apps Script error: ${jsonResult.error}`)
        } else {
          console.error("Invalid response format:", jsonResult)
          throw new Error("Invalid response format from Apps Script")
        }
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError)
        console.log("Response text was:", result)
        if (result.includes("Google Apps Script is running")) {
          throw new Error("Apps Script is running but getHistoryData action is not implemented")
        }
        throw new Error("Invalid JSON response from Apps Script")
      }
    } catch (error) {
      console.error("Failed to fetch real data:", error)
      throw error
    }
  }

  const processRealSheetData = useCallback((data: any[]) => {
    console.log("Processing real data from History sheet...")
    console.log("Raw data received:", data)

    if (!Array.isArray(data) || data.length === 0) {
      console.log("No data received from History sheet")
      setVouchers([])
      return
    }

    // Check if first row contains headers
    const hasHeaders =
      data.length > 0 &&
      (String(data[0][0]).toLowerCase().includes("timestamp") ||
        String(data[0][1]).toLowerCase().includes("voucher") ||
        String(data[0][0]).toLowerCase().includes("date"))

    console.log("Has headers:", hasHeaders)
    const dataRows = hasHeaders ? data.slice(1) : data
    console.log(`Processing ${dataRows.length} data rows from History sheet`)

    const mappedVouchers = dataRows
      .map((row: any[], index: number) => {
        // Check if this row has essential data (at least voucher number in column B)
        if (!row || row.length < 2 || !row[1] || String(row[1]).trim() === "") {
          return null
        }

        const voucher: VoucherData = {
          id: `history_${index + 1}`,
          // Main display fields with correct column mapping:
          timestamp: row[0] ? String(row[0]) : "", // Column A - TIMESTAMP
          voucherNo: row[1] ? String(row[1]) : "", // Column B - Voucher No.
          bankAcFrom: row[2] ? String(row[2]) : "", // Column C - BANK AC FROM
          companyName: row[3] ? String(row[3]) : "", // Column D - COMPANY NAME
          dateOfPaymentProcess: row[4] ? String(row[4]) : "", // Column E - DATE
          purposeOfPayment: row[5] ? String(row[5]) : "", // Column F - PURPOSE
          transactionType: row[6] ? String(row[6]) : "", // Column G - TRANSACTION TYPE
          project: row[7] ? String(row[7]) : "", // Column H - PROJECT
          beneficiaryName: row[8] ? String(row[8]) : "", // Column I - BENEFICIARY NAME (PAID TO)
          poNumber: row[9] ? String(row[9]) : "", // Column J - PO. NUMBER
          beneficiaryAcName: row[10] ? String(row[10]) : "", // Column K - (NAME OF AC HOLDER) BENEFICIARY A/C NAME
          beneficiaryAcNumber: row[11] ? String(row[11]) : "", // Column L - BENEFICIARY A/C NUMBER
          beneficiaryBankName: row[12] ? String(row[12]) : "", // Column M - BENEFICIARY BANK NAME
          beneficiaryBankIfsc: row[13] ? String(row[13]) : "", // Column N - BENEFICIARY BANK IFSC
          particulars: row[14] ? String(row[14]) : "", // Column O - PARTICULARS
          amount: row[15] ? String(row[15]) : "0", // Column P - AMOUNT
          amountInWords: row[16] ? String(row[16]) : "", // Column Q - AMOUNT IN WORDS
          entryDoneBy: row[17] ? String(row[17]) : "", // Column R - ENTRY DONE BY
          checkedBy: row[18] ? String(row[18]) : "", // Column S - CHECKED BY
          approvedBy: row[19] ? String(row[19]) : "", // Column T - APPROVED BY
          pdfLink: row[20] ? String(row[20]) : "", // Column U - PDF Link
          name: row[17] ? String(row[17]) : "", // Column X - Name (currently logged-in username)
          // Set dateOfPayment for compatibility (using timestamp)
          dateOfPayment: row[0] ? String(row[0]) : "",
          // Add original row index for updates
          originalRowIndex: index + 2, // +1 for header row (if exists), +1 for 1-based index
        }

        return voucher
      })
      .filter((voucher: { voucherNo: string } | null): voucher is VoucherData =>
        Boolean(voucher && voucher.voucherNo && voucher.voucherNo.trim() !== ""),
      )

    console.log(`Successfully processed ${mappedVouchers.length} real vouchers from History sheet`)

    if (mappedVouchers.length === 0) {
      console.warn("No valid vouchers found in History sheet data")
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

  const updateVoucherInSheet = async (voucher: VoucherData) => {
    try {
      const rowData = [
        voucher.timestamp || "",
        voucher.voucherNo || "",
        voucher.bankAcFrom || "",
        voucher.companyName || "",
        voucher.dateOfPaymentProcess || "",
        voucher.purposeOfPayment || "",
        voucher.transactionType || "",
        voucher.project || "",
        voucher.beneficiaryName || "",
        voucher.poNumber || "",
        voucher.beneficiaryAcName || "",
        voucher.beneficiaryAcNumber || "",
        voucher.beneficiaryBankName || "",
        voucher.beneficiaryBankIfsc || "",
        voucher.particulars || "",
        voucher.amount || "",
        voucher.amountInWords || "",
        voucher.entryDoneBy || "",
        voucher.checkedBy || "",
        voucher.approvedBy || "",
        voucher.pdfLink || "",
        "", // Column V
        "", // Column W
        voucher.name || "", // Column X - Name
      ]

      console.log("Attempting to update voucher:", {
        voucherNo: voucher.voucherNo,
        originalRowIndex: voucher.originalRowIndex,
        rowData: rowData,
      })

      const formData = new FormData()
      formData.append("action", "update")
      formData.append("sheetName", SHEET_NAME)
      formData.append("rowData", JSON.stringify(rowData))
      formData.append("rowIndex", voucher.originalRowIndex?.toString() || "")

      console.log("Sending update request with form data:", {
        action: "update",
        rowIndex: voucher.originalRowIndex,
        rowData: rowData,
      })

      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      console.log("Update response:", result)

      if (result.success) {
        return true
      } else {
        throw new Error(result.error || "Update failed")
      }
    } catch (error) {
      console.error("Update error:", error)
      throw error
    }
  }

  // Open edit modal with voucher data and fetch master data
  const openEditModal = async (voucher: VoucherData) => {
    setEditVoucher({ ...voucher }) // Create a copy for editing
    setIsEditModalOpen(true)
    setSelectedVoucher(null) // Close view modal if open

    // Fetch master data when opening edit modal
    await fetchMasterData()
  }

  // Close edit modal
  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditVoucher(null)
  }

  // Handle form submission for editing with COLORED PDF generation
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editVoucher) return

    try {
      setIsUpdating(true)

      // Generate new PDF with updated voucher data and professional table layout
      const { jsPDF } = await import("jspdf")
      const { default: autoTable } = await import("jspdf-autotable")

      const doc = new jsPDF("p", "mm", "a4")
      const pageWidth = 210 // A4 Portrait width
      const pageHeight = 297 // A4 Portrait height
      const margin = 10
      let currentY = 15

      // Professional color palette
      const colors = {
        primary: [28, 48, 80] as [number, number, number], // Dark Blue
        secondary: [90, 120, 150] as [number, number, number], // Muted Blue
        accent: [200, 50, 50] as [number, number, number], // Muted Red
        success: [40, 140, 80] as [number, number, number], // Green
        background: {
          light: [248, 248, 248] as [number, number, number], // Light Gray
          blue: [235, 245, 255] as [number, number, number], // Very Light Blue
          green: [240, 255, 240] as [number, number, number], // Very Light Green
          yellow: [255, 252, 220] as [number, number, number], // Pale Yellow
          amount: [230, 255, 230] as [number, number, number], // Light Green for amount
        },
        text: {
          primary: [20, 20, 20] as [number, number, number], // Very Dark Gray
          secondary: [60, 60, 60] as [number, number, number], // Dark Gray
          muted: [120, 120, 120] as [number, number, number], // Medium Gray
        },
        border: {
          primary: [80, 80, 80] as [number, number, number], // Dark Gray
          secondary: [150, 150, 150] as [number, number, number], // Medium Gray
        },
      }

      const formatCurrency = (value: string) => {
        const numValue = Number.parseFloat(value) || 0
        return (
          "Rs. " +
          numValue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        )
      }

      const formatDate = (dateString: string | number | Date) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      }

      // Main container border
      doc.setDrawColor(...colors.border.primary)
      doc.setLineWidth(2)
      doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin)

      // Header Section
      doc.setFillColor(...colors.background.blue)
      doc.setDrawColor(...colors.border.primary)
      doc.setLineWidth(1)
      doc.rect(margin + 3, currentY, pageWidth - 2 * margin - 6, 22, "FD")

      // Company Name
      doc.setFont("helvetica", "bold")
      doc.setFontSize(18)
      doc.setTextColor(...colors.primary)
      doc.text(editVoucher.companyName || "COMPANY NAME", pageWidth / 2, currentY + 8, { align: "center" })

      // Voucher Title
      doc.setFontSize(12)
      doc.setTextColor(...colors.secondary)
      doc.text("BANK PAYMENT VOUCHER", pageWidth / 2, currentY + 16, { align: "center" })

      currentY += 28

      // Voucher Information Table - Colorful rows with different backgrounds
      const voucherInfoData = [
        // Row 1 - Basic Info with light blue background
        [
          {
            content: "VOUCHER NO:",
            styles: { fontStyle: 'bold' as import('jspdf-autotable').FontStyle, fillColor: colors.background.blue, textColor: colors.primary },
          },
          { content: editVoucher.voucherNo || "", styles: { fillColor: colors.background.blue } },
          {
            content: "DATE OF PAYMENT:",
            styles: { fontStyle: 'bold' as import('jspdf-autotable').FontStyle, fillColor: colors.background.blue, textColor: colors.primary },
          },
          { content: formatDate(editVoucher.dateOfPaymentProcess), styles: { fillColor: colors.background.blue } },
          {
            content: "TRANSACTION TYPE:",
            styles: { fontStyle: "bold" as import("jspdf-autotable").FontStyle, fillColor: colors.background.blue, textColor: colors.primary },
          },
          {
            content: editVoucher.transactionType || "",
            styles: { fillColor: colors.background.blue, textColor: colors.accent, fontStyle: "bold" as import("jspdf-autotable").FontStyle },
          },
        ],
        // Row 2 - Bank & Company with yellow background
        [
          {
            content: "BANK A/C FROM:",
            styles: { fontStyle: 'bold' as import('jspdf-autotable').FontStyle, fillColor: colors.background.yellow, textColor: colors.primary },
          },
          { content: editVoucher.bankAcFrom || "", styles: { fillColor: colors.background.yellow } },
          {
            content: "COMPANY:",
            styles: { fontStyle: 'bold' as import('jspdf-autotable').FontStyle, fillColor: colors.background.yellow, textColor: colors.primary },
          },
          { content: editVoucher.companyName || "", styles: { fillColor: colors.background.yellow } },
          {
            content: "PURPOSE:",
            styles: { fontStyle: "bold" as import("jspdf-autotable").FontStyle, fillColor: colors.background.yellow, textColor: colors.primary },
          },
          { content: editVoucher.purposeOfPayment || "", styles: { fillColor: colors.background.yellow } },
        ],
        // Row 3 - Project & Beneficiary with green background
        [
          {
            content: "PROJECT:",
            styles: { fontStyle: 'bold' as import('jspdf-autotable').FontStyle, fillColor: colors.background.green, textColor: colors.primary },
          },
          {
            content: editVoucher.project || "",
            styles: { fillColor: colors.background.green, textColor: colors.success, fontStyle: 'bold' as import('jspdf-autotable').FontStyle },
          },
          {
            content: "BENEFICIARY NAME (PAID TO):",
            styles: { fontStyle: "bold" as import("jspdf-autotable").FontStyle, fillColor: colors.background.green, textColor: colors.primary },
          },
          {
            content: editVoucher.beneficiaryName || "",
            styles: { fillColor: colors.background.green, colSpan: 3, fontStyle: "bold" as import("jspdf-autotable").FontStyle },
          },
          "",
          "",
        ],
        // Row 4 - Account Details with light blue background
        [
          {
            content: "PO NUMBER:",
            styles: { fontStyle: "bold", fillColor: colors.background.blue, textColor: colors.primary },
          },
          { content: editVoucher.poNumber || "N/A", styles: { fillColor: colors.background.blue } },
          {
            content: "BENEFICIARY A/C NAME:",
            styles: { fontStyle: "bold", fillColor: colors.background.blue, textColor: colors.primary },
          },
          { content: editVoucher.beneficiaryAcName || "", styles: { fillColor: colors.background.blue } },
          {
            content: "BENEFICIARY A/C NUMBER:",
            styles: { fontStyle: "bold", fillColor: colors.background.blue, textColor: colors.primary },
          },
          { content: editVoucher.beneficiaryAcNumber || "", styles: { fillColor: colors.background.blue } },
        ],
        // Row 5 - Bank Details with light gray background
        [
          {
            content: "BENEFICIARY BANK NAME:",
            styles: { fontStyle: 'bold' as import('jspdf-autotable').FontStyle, fillColor: colors.background.light, textColor: colors.primary },
          },
          { content: editVoucher.beneficiaryBankName || "", styles: { fillColor: colors.background.light } },
          {
            content: "BENEFICIARY BANK IFSC:",
            styles: { fontStyle: 'bold' as import('jspdf-autotable').FontStyle, fillColor: colors.background.light, textColor: colors.primary },
          },
          {
            content: editVoucher.beneficiaryBankIfsc || "",
            styles: { fillColor: colors.background.light, colSpan: 3 },
          },
          "",
          "",
        ],
      ]

      autoTable(doc, {
        startY: currentY,
        body: voucherInfoData,
        margin: { left: margin + 3, right: margin + 3 },
        tableWidth: pageWidth - 2 * margin - 6,
        styles: {
          cellPadding: 4,
          lineColor: colors.border.primary,
          lineWidth: 0.8,
          textColor: colors.text.primary,
          font: "helvetica",
          fontSize: 9,
          overflow: "linebreak",
        },
        columnStyles: {
          0: { cellWidth: 30, fontSize: 8 },
          1: { cellWidth: 30 },
          2: { cellWidth: 30, fontSize: 8 },
          3: { cellWidth: 30 },
          4: { cellWidth: 30, fontSize: 8 },
          5: { cellWidth: 30 },
        },
        didDrawPage: (data) => {
          if (data.cursor && typeof data.cursor.y === "number") {
            currentY = data.cursor.y
          }
        },
      })

      currentY += 8

      // Particulars and Amount Section - Colorful with different backgrounds
      const particularsAmountData = [
        // Header row with distinct colors
        [
          {
            content: "PARTICULARS:",
            styles: {
              fontStyle: "bold",
              fontSize: 10,
              fillColor: colors.background.light,
              textColor: colors.primary,
              halign: "center",
              cellPadding: 5,
            },
          },
          {
            content: "AMOUNT:",
            styles: {
              fontStyle: "bold",
              fontSize: 10,
              fillColor: colors.background.yellow,
              textColor: colors.primary,
              halign: "center",
              cellPadding: 5,
            },
          },
        ],
        // Content row with vibrant amount highlight
        [
          {
            content: editVoucher.particulars || "",
            styles: {
              fontSize: 10,
              minCellHeight: 20,
              valign: "top",
              cellPadding: 6,
              fillColor: [255, 255, 255], // White background for particulars
            },
          },
          {
            content: formatCurrency(editVoucher.amount),
            styles: {
              fontSize: 14,
              fontStyle: "bold",
              fillColor: colors.background.amount,
              textColor: colors.success,
              halign: "center",
              valign: "middle",
              minCellHeight: 20,
              cellPadding: 8,
            },
          },
        ],
      ]

      autoTable(doc, {
        startY: currentY,
        body: particularsAmountData,
        margin: { left: margin + 3, right: margin + 3 },
        tableWidth: pageWidth - 2 * margin - 6,
        styles: {
          cellPadding: 4,
          lineColor: colors.border.primary,
          lineWidth: 0.8,
          textColor: colors.text.primary,
          font: "helvetica",
          overflow: "linebreak",
        },
        columnStyles: {
          0: { cellWidth: (pageWidth - 2 * margin - 6) * 0.7 },
          1: { cellWidth: (pageWidth - 2 * margin - 6) * 0.3 },
        },
        didDrawPage: (data) => {
          if (data.cursor) {
            currentY = data.cursor.y
          }
        },
      })

      currentY += 3

      // Amount in Words Section - Vibrant blue background
      const amountWordsData = [
        [
          {
            content: `AMOUNT IN WORDS: ${editVoucher.amountInWords || ""}`,
            styles: {
              fontSize: 11,
              fontStyle: "bold",
              fillColor: colors.background.blue,
              textColor: colors.primary,
              cellPadding: 8,
            },
          },
        ],
      ]

      autoTable(doc, {
        startY: currentY,
        body: amountWordsData,
        margin: { left: margin + 3, right: margin + 3 },
        tableWidth: pageWidth - 2 * margin - 6,
        styles: {
          cellPadding: 4,
          lineColor: colors.border.primary,
          lineWidth: 0.8,
          textColor: colors.text.primary,
          font: "helvetica",
        },
        didDrawPage: (data) => {
          if (data.cursor) {
            currentY = data.cursor.y
          }
        },
      })

      currentY += 15

      // Signature Section - Colorful with different backgrounds for each column
      const signatureData = [
        // Header row with distinct colors for each approval level
        [
          {
            content: "ENTRY DONE BY",
            styles: {
              fontStyle: "bold",
              fontSize: 10,
              fillColor: colors.background.blue,
              textColor: colors.primary,
              halign: "center",
              cellPadding: 5,
            },
          },
          {
            content: "CHECKED BY",
            styles: {
              fontStyle: "bold",
              fontSize: 10,
              fillColor: colors.background.yellow,
              textColor: colors.primary,
              halign: "center",
              cellPadding: 5,
            },
          },
          {
            content: "APPROVED BY",
            styles: {
              fontStyle: "bold",
              fontSize: 10,
              fillColor: colors.background.green,
              textColor: colors.primary,
              halign: "center",
              cellPadding: 5,
            },
          },
        ],
        // Empty signature space with light backgrounds
        [
          { content: "", styles: { minCellHeight: 15, fillColor: [250, 250, 255] } },
          { content: "", styles: { minCellHeight: 15, fillColor: [255, 255, 240] } },
          { content: "", styles: { minCellHeight: 15, fillColor: [245, 255, 245] } },
        ],
        // Names row with matching background colors
        [
          {
            content: editVoucher.entryDoneBy || "",
            styles: {
              fontStyle: "bold",
              fontSize: 9,
              halign: "center",
              fillColor: colors.background.blue,
              textColor: colors.primary,
              cellPadding: 4,
            },
          },
          {
            content: editVoucher.checkedBy || "",
            styles: {
              fontStyle: "bold",
              fontSize: 9,
              halign: "center",
              fillColor: colors.background.yellow,
              textColor: colors.primary,
              cellPadding: 4,
            },
          },
          {
            content: editVoucher.approvedBy || "",
            styles: {
              fontStyle: "bold",
              fontSize: 9,
              halign: "center",
              fillColor: colors.background.green,
              textColor: colors.primary,
              cellPadding: 4,
            },
          },
        ],
      ]

      autoTable(doc, {
        startY: currentY,
        body: signatureData,
        margin: { left: margin + 3, right: margin + 3 },
        tableWidth: pageWidth - 2 * margin - 6,
        styles: {
          cellPadding: 3,
          lineColor: colors.border.primary,
          lineWidth: 0.8,
          textColor: colors.text.primary,
          font: "helvetica",
        },
        columnStyles: {
          0: { cellWidth: (pageWidth - 2 * margin - 6) / 3 },
          1: { cellWidth: (pageWidth - 2 * margin - 6) / 3 },
          2: { cellWidth: (pageWidth - 2 * margin - 6) / 3 },
        },
        didDrawCell: (data) => {
          // Draw signature line in the middle row
          if (data.row.index === 1) {
            const cellX = data.cell.x
            const cellY = data.cell.y + data.cell.height - 4
            const cellWidth = data.cell.width
            doc.setDrawColor(...colors.border.primary)
            doc.setLineWidth(0.3)
            doc.line(cellX + 8, cellY, cellX + cellWidth - 8, cellY)
          }
        },
        didDrawPage: (data) => {
          currentY = data.cursor.y
        },
      })

      currentY += 15

      // Footer with colorful background
      doc.setFillColor(...colors.background.light)
      doc.setDrawColor(...colors.accent)
      doc.setLineWidth(0.5)
      doc.rect(margin + 3, currentY, pageWidth - 2 * margin - 6, 12, "FD")

      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      doc.setTextColor(...colors.primary)
      doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, pageWidth / 2, currentY + 5, { align: "center" })

      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      doc.setTextColor(...colors.secondary)
      doc.text("This is a computer generated voucher", pageWidth / 2, currentY + 9, { align: "center" })

      // Add colorful accent line at the bottom
      doc.setDrawColor(...colors.accent)
      doc.setLineWidth(2)
      doc.line(margin + 8, currentY + 11, pageWidth - margin - 8, currentY + 11)

      // Convert to base64
      const pdfOutput = doc.output("datauristring")
      const pdfBase64 = pdfOutput.split(",")[1]

      // Upload to Google Drive
      const uploadResponse = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          action: "uploadPDF",
          pdfData: pdfBase64,
          fileName: `Voucher_${editVoucher.voucherNo}_${Date.now()}.pdf`,
          folderId: "1fnjCwWiu16-RBPNqjUGkKRVrf3o3Hwoo",
        }),
      })

      const uploadResult = await uploadResponse.json()

      if (!uploadResult.success || !uploadResult.pdfUrl) {
        throw new Error("PDF upload failed: " + (uploadResult.error || "No URL returned"))
      }

      console.log("PDF uploaded successfully:", uploadResult.pdfUrl)

      // Update voucher with new PDF link
      const updatedVoucher = {
        ...editVoucher,
        pdfLink: uploadResult.pdfUrl,
      }

      // Update the sheet
      await updateVoucherInSheet(updatedVoucher)

      // Update local state
      setVouchers((prev) => prev.map((v) => (v.id === editVoucher.id ? updatedVoucher : v)))

      // Close modal and show success
      closeEditModal()
      alert("Voucher updated successfully with colorful professional layout!")
    } catch (error) {
      console.error("Update failed:", error)
      alert(`Update failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteVoucher = async (voucherId: string) => {
    if (!confirm("Are you sure you want to permanently delete this voucher?")) {
      return
    }

    try {
      setDeletingVoucherId(voucherId)
      setLoading(true)

      // 1. Find the voucher to get its row index
      const voucherToDelete = vouchers.find((v) => v.id === voucherId)
      if (!voucherToDelete) {
        throw new Error("Voucher not found in local state")
      }

      // 2. Verify we have the original row index
      if (voucherToDelete.originalRowIndex === undefined) {
        throw new Error("Cannot determine sheet row for this voucher")
      }

      // 3. Prepare delete request using FormData
      const formData = new FormData()
      formData.append("action", "delete")
      formData.append("sheetName", "History")
      formData.append("rowIndex", voucherToDelete.originalRowIndex.toString())

      // 4. Send POST request to Google Apps Script
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Delete operation failed")
      }

      // 5. Update local state if successful
      setVouchers((prev) => prev.filter((v) => v.id !== voucherId))

      // Show success message
      alert(`Voucher ${voucherToDelete.voucherNo} deleted successfully`)
    } catch (error) {
      console.error("Voucher deletion failed:", error)
      alert(`Delete failed: ${error instanceof Error ? error.message : "Unknown error"}`)
      await fetchVouchersFromSheet()
    } finally {
      setDeletingVoucherId(null)
      setLoading(false)
    }
  }

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

  const uniqueNames = useMemo(() => {
    const names = [
      ...new Set(
        vouchers
          .map((v) => v.entryDoneBy?.trim()) // <-- added .trim()
          .filter(Boolean)
      ),
    ]
    return names.sort()
  }, [vouchers])


  // Memoized filtered vouchers for performance
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((voucher) => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        !searchTerm ||
        voucher.beneficiaryName?.toLowerCase().includes(searchLower) ||
        voucher.voucherNo?.toLowerCase().includes(searchLower) ||
        voucher.project?.toLowerCase().includes(searchLower) ||
        voucher.purposeOfPayment?.toLowerCase().includes(searchLower) ||
        voucher.companyName?.toLowerCase().includes(searchLower)

      const matchesCompany = selectedCompany === "all" || voucher.companyName === selectedCompany
      const matchesProject = selectedProject === "all" || voucher.project === selectedProject
      const matchesPurpose = selectedPurpose === "all" || voucher.purposeOfPayment === selectedPurpose
      const matchesTransactionType =
        selectedTransactionType === "all" || voucher.transactionType === selectedTransactionType
      const matchesName = selectedName === "all" || voucher.name === selectedName

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
        matchesName &&
        matchesDateFrom &&
        matchesDateTo &&
        matchesAmountFrom &&
        matchesAmountTo
      )
    })
  }, [
    vouchers,
    searchTerm,
    selectedCompany,
    selectedProject,
    selectedPurpose,
    selectedTransactionType,
    selectedName,
    dateFrom,
    dateTo,
    amountFrom,
    amountTo,
  ])

  const clearAllFilters = useCallback(() => {
    setSearchTerm("")
    setSelectedCompany("all")
    setSelectedProject("all")
    setSelectedPurpose("all")
    setSelectedTransactionType("all")
    setSelectedName("all")
    setDateFrom("")
    setDateTo("")
    setAmountFrom("")
    setAmountTo("")
  }, [])

  const downloadPDF = async (voucher: VoucherData) => {
    try {
      if (voucher.pdfLink && voucher.pdfLink.includes("http")) {
        // Convert Google Drive link to direct download link if needed
        let downloadUrl = voucher.pdfLink
        // Check if it's a Google Drive link and convert to direct download
        if (voucher.pdfLink.includes("drive.google.com")) {
          const fileIdMatch = voucher.pdfLink.match(/\/d\/([a-zA-Z0-9-_]+)/)
          if (fileIdMatch) {
            downloadUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`
          }
        }

        try {
          // Try to fetch and download the PDF
          const response = await fetch(downloadUrl, {
            method: "GET",
            mode: "no-cors", // This helps with CORS issues
          })

          // If fetch with no-cors fails, fallback to opening in new tab
          if (!response.ok) {
            throw new Error("Fetch failed")
          }

          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `Voucher_${voucher.voucherNo}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        } catch (fetchError) {
          console.log("Direct download failed, opening in new tab:", fetchError)
          // Fallback: Open in new tab for user to download manually
          const link = document.createElement("a")
          link.href = downloadUrl
          link.target = "_blank"
          link.rel = "noopener noreferrer"
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      } else {
        // Generate PDF if no link exists (keep existing code)
        const { jsPDF } = await import("jspdf")
        const doc = new jsPDF()

        doc.setFont("helvetica")
        doc.setFontSize(16)
        doc.setTextColor(0, 0, 0)
        doc.text(voucher.companyName || "COMPANY NAME", 105, 20, { align: "center" })

        doc.setFontSize(12)
        doc.text("Bank Payment Voucher - Complete Details", 105, 30, { align: "center" })

        doc.rect(10, 35, 190, 250)

        let yPosition = 50

        const addSection = (title: string, fields: Array<{ label: string; value: string }>) => {
          doc.setFontSize(10)
          doc.setFont("helvetica", "bold")

          doc.setFillColor(230, 230, 230)
          doc.rect(15, yPosition - 5, 180, 8, "F")
          doc.text(title, 20, yPosition)

          yPosition += 12

          doc.setFont("helvetica", "normal")
          doc.setFontSize(8)

          fields.forEach((field) => {
            if (yPosition > 270) {
              doc.addPage()
              yPosition = 20
            }

            doc.setFont("helvetica", "bold")
            doc.text(field.label + ":", 20, yPosition)

            doc.setFont("helvetica", "normal")
            const lines = doc.splitTextToSize(field.value || "N/A", 120)
            doc.text(lines, 80, yPosition)

            yPosition += Math.max(6, lines.length * 4)
          })

          yPosition += 5
        }

        addSection("BASIC VOUCHER INFORMATION", [
          {
            label: "Timestamp",
            value: voucher.timestamp ? new Date(voucher.timestamp).toLocaleString("en-IN") : "N/A",
          },
          { label: "Voucher Number", value: voucher.voucherNo },
          { label: "Transaction Type", value: voucher.transactionType },
          { label: "Purpose", value: voucher.purposeOfPayment },
          { label: "Project", value: voucher.project },
        ])

        addSection("BANK INFORMATION", [
          { label: "Bank AC From", value: voucher.bankAcFrom },
          { label: "Date", value: voucher.dateOfPaymentProcess },
        ])

        addSection("BENEFICIARY INFORMATION", [
          { label: "Beneficiary Name (Paid To)", value: voucher.beneficiaryName },
          { label: "PO Number", value: voucher.poNumber },
          { label: "Beneficiary A/C Name", value: voucher.beneficiaryAcName },
          { label: "Beneficiary A/C Number", value: voucher.beneficiaryAcNumber },
          { label: "Beneficiary Bank Name", value: voucher.beneficiaryBankName },
        ])

        addSection("FINANCIAL INFORMATION", [
          { label: "Particulars", value: voucher.particulars },
          { label: "Amount", value: `₹${Number.parseFloat(voucher.amount).toLocaleString("en-IN")}` },
          { label: "Amount in Words", value: voucher.amountInWords },
        ])

        addSection("APPROVAL INFORMATION", [
          { label: "Entry Done By", value: voucher.entryDoneBy },
          { label: "Checked By", value: voucher.checkedBy },
          { label: "Approved By", value: voucher.approvedBy },
          { label: "Name", value: voucher.name },
          { label: "PDF Link", value: voucher.pdfLink },
        ])

        doc.setFontSize(8)
        doc.setFont("helvetica", "italic")
        doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 20, doc.internal.pageSize.height - 20)
        doc.text(`Voucher ID: ${voucher.id}`, 20, doc.internal.pageSize.height - 15)
        doc.text("Complete History Sheet Data Export", 20, doc.internal.pageSize.height - 10)

        doc.save(`Payment_Voucher_${voucher.voucherNo}_${Date.now()}.pdf`)
      }
    } catch (error) {
      console.error("Error downloading PDF:", error)
      alert("Error downloading PDF. The file may be corrupted or inaccessible. Please try again or contact support.")
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
      selectedName !== "all",
      dateFrom,
      dateTo,
      amountFrom,
      amountTo,
    ].filter(Boolean).length
  }, [
    selectedCompany,
    selectedProject,
    selectedPurpose,
    selectedTransactionType,
    selectedName,
    dateFrom,
    dateTo,
    amountFrom,
    amountTo,
  ])

  const renderAllDetails = (voucher: VoucherData) => {
    const columnMapping = {
      timestamp: "TIMESTAMP",
      voucherNo: "Voucher No.",
      bankAcFrom: "BANK AC FROM",
      companyName: "COMPANY NAME",
      dateOfPaymentProcess: "DATE",
      purposeOfPayment: "PURPOSE",
      transactionType: "TRANSACTION TYPE",
      project: "PROJECT",
      beneficiaryName: "BENEFICIARY NAME (PAYER TO)",
      poNumber: "PO. NUMBER",
      beneficiaryAcName: "(NAME OF AC HOLDER) BENEFICIARY A/C NAME",
      beneficiaryAcNumber: "BENEFICIARY A/C NUMBER",
      beneficiaryBankName: "BENEFICIARY BANK NAME",
      beneficiaryBankIfsc: "BENEFICIARY BANK IFSC",
      particulars: "PARTICULARS",
      amount: "AMOUNT",
      amountInWords: "AMOUNT IN WORDS",
      entryDoneBy: "ENTRY DONE BY",
      checkedBy: "CHECKED BY",
      approvedBy: "APPROVED BY",
      pdfLink: "PDF Link",
      name: "Name",
    }

    return (
      <div className="mt-4 sm:mt-6 bg-gray-50 p-3 sm:p-4 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">All Details from History Sheet</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
          {Object.entries(columnMapping).map(([key, label]) => (
            <div key={key} className="bg-white p-2 sm:p-3 rounded border">
              <p className="text-gray-600 font-medium text-xs">{label}</p>
              <p className="text-gray-800 break-words mt-1">
                {voucher[key] === null || voucher[key] === undefined || voucher[key] === "" ? (
                  "N/A"
                ) : key === "timestamp" && voucher[key] ? (
                  (() => {
                    try {
                      return new Date(voucher[key]).toLocaleString("en-IN")
                    } catch {
                      return String(voucher[key])
                    }
                  })()
                ) : key === "amount" && voucher[key] ? (
                  (() => {
                    try {
                      return `₹${Number.parseFloat(voucher[key]).toLocaleString("en-IN")}`
                    } catch {
                      return String(voucher[key])
                    }
                  })()
                ) : key === "pdfLink" && voucher[key] && voucher[key].includes("http") ? (
                  <a
                    href={voucher[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View PDF
                  </a>
                ) : (
                  String(voucher[key])
                )}
              </p>
            </div>
          ))}
        </div>

        {/* Summary section showing the main fields mapping */}
        <div className="mt-4 sm:mt-6 bg-blue-50 p-3 sm:p-4 rounded-lg">
          <h5 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">
            Main Fields Summary (as shown in table)
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="space-y-2">
              <p>
                <strong>Voucher No:</strong> {voucher.voucherNo}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {voucher.timestamp
                  ? (() => {
                    try {
                      return new Date(voucher.timestamp).toLocaleDateString("en-IN")
                    } catch {
                      return voucher.timestamp
                    }
                  })()
                  : "N/A"}
              </p>
              <p>
                <strong>Company:</strong> {voucher.companyName}
              </p>
              <p>
                <strong>Beneficiary:</strong> {voucher.beneficiaryName}
              </p>
            </div>
            <div className="space-y-2">
              <p>
                <strong>Purpose:</strong> {voucher.purposeOfPayment}
              </p>
              <p>
                <strong>Project:</strong> {voucher.project}
              </p>
              <p>
                <strong>Amount:</strong> ₹{Number.parseFloat(voucher.amount || "0").toLocaleString("en-IN")}
              </p>
              <p>
                <strong>Type:</strong> {voucher.transactionType}
              </p>
              <p>
                <strong>Name:</strong> {voucher.name}
              </p>
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

      <div className=" mx-auto px-4 sm:px-4 py-8 sm:py-8 space-y-4 sm:space-y-6">
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
                <Button
                  onClick={clearAllFilters}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 text-xs sm:text-sm"
                >
                  <X className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  Clear All
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="relative w-full sm:w-[70%]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
                <Input
                  placeholder="Search by voucher number, beneficiary name, project, purpose, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 sm:pl-10 h-10 sm:h-11 border-2 border-gray-200 focus:border-blue-500 text-sm"
                />
              </div>

              <div className="w-full sm:w-[25%]">

                <Select value={selectedName} onValueChange={setSelectedName}>
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm w-full">
                    <SelectValue placeholder="All Names" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Names</SelectItem>
                    {uniqueNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Date To</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                />
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
                              <p className="text-xs text-gray-500">
                                {new Date(voucher.timestamp).toLocaleDateString("en-IN")}
                              </p>
                            </div>
                            <Badge
                              variant={voucher.transactionType === "PAYMENT" ? "default" : "secondary"}
                              className={`text-xs ${voucher.transactionType === "PAYMENT"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                                }`}
                            >
                              {voucher.transactionType}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm">
                              <strong>Company:</strong> <span className="text-xs">{voucher.companyName}</span>
                            </p>
                            <p className="text-sm">
                              <strong>Beneficiary:</strong> <span className="text-xs">{voucher.beneficiaryName}</span>
                            </p>
                            <p className="text-sm">
                              <strong>Purpose:</strong> <span className="text-xs">{voucher.purposeOfPayment}</span>
                            </p>
                            <p className="text-sm">
                              <strong>Project:</strong> <span className="text-xs">{voucher.project}</span>
                            </p>
                            <p className="text-sm">
                              <strong>Name:</strong> <span className="text-xs">{voucher.name}</span>
                            </p>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t">
                            <p className="font-semibold text-green-600 text-sm">
                              ₹{Number.parseFloat(voucher.amount).toLocaleString("en-IN")}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadPDF(voucher)}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 text-xs px-2 py-1"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                              {userRole === "admin" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditModal(voucher)}
                                  className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200 text-xs px-2 py-1"
                                >
                                  Edit
                                </Button>
                              )}
                            </div>
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
                          <TableHead className="font-semibold text-xs lg:text-sm">Created Date</TableHead>
                          <TableHead className="font-semibold text-xs lg:text-sm">Voucher Date</TableHead>
                          <TableHead className="font-semibold text-xs lg:text-sm">Company</TableHead>
                          <TableHead className="font-semibold text-xs lg:text-sm">Beneficiary Name</TableHead>
                          <TableHead className="font-semibold text-xs lg:text-sm">Purpose</TableHead>
                          <TableHead className="font-semibold text-xs lg:text-sm">Project</TableHead>
                          <TableHead className="text-right font-semibold text-xs lg:text-sm">Amount</TableHead>
                          <TableHead className="font-semibold text-xs lg:text-sm">Transaction Type</TableHead>
                          <TableHead className="font-semibold text-center text-xs lg:text-sm">Name</TableHead>
                          <TableHead className="font-semibold text-center text-xs lg:text-sm">Download</TableHead>
                          {userRole === "admin" && (
                            <TableHead className="font-semibold text-center text-xs lg:text-sm">Edit</TableHead>
                          )}
                          {userRole === "admin" && (
                            <TableHead className="font-semibold text-center text-xs lg:text-sm">Delete</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredVouchers.map((voucher, index) => (
                          <TableRow
                            key={voucher.id}
                            className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}
                          >
                            <TableCell className="font-medium text-blue-600 text-xs lg:text-sm">
                              {voucher.voucherNo}
                            </TableCell>
                            <TableCell className="text-xs lg:text-sm">
                              {new Date(voucher.timestamp).toLocaleDateString("en-IN")}
                            </TableCell>
                            <TableCell className="text-xs lg:text-sm">
                              {new Date(voucher.dateOfPaymentProcess).toLocaleDateString("en-IN")}
                            </TableCell>
                            <TableCell className="max-w-[100px] lg:max-w-[150px] truncate">
                              <Badge variant="outline" className="text-xs">
                                {voucher.companyName}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[80px] lg:max-w-[120px] truncate text-xs lg:text-sm">
                              {voucher.beneficiaryName}
                            </TableCell>
                            <TableCell className="max-w-[80px] lg:max-w-[100px] truncate text-xs lg:text-sm">
                              {voucher.purposeOfPayment}
                            </TableCell>
                            <TableCell className="max-w-[80px] lg:max-w-[100px] truncate text-xs lg:text-sm">
                              {voucher.project}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-green-600 text-xs lg:text-sm">
                              ₹{Number.parseFloat(voucher.amount).toLocaleString("en-IN")}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={voucher.transactionType === "PAYMENT" ? "default" : "secondary"}
                                className={`text-xs ${voucher.transactionType === "PAYMENT"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                                  }`}
                              >
                                {voucher.transactionType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center text-xs lg:text-sm">
                              <Badge variant="outline" className="text-xs">
                                {voucher.name || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center space-x-1 lg:space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadPDF(voucher)}
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 p-1 lg:p-2"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            {userRole === "admin" && (
                              <TableCell>
                                <div className="flex justify-center space-x-1 lg:space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditModal(voucher)}
                                    className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200 p-1 lg:p-2"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-3 w-3"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                            {userRole === "admin" && (
                              <TableCell>
                                <div className="flex justify-center space-x-1 lg:space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                      try {
                                        await deleteVoucher(voucher.id)
                                      } catch (error) {
                                        console.error("Delete failed:", error)
                                      }
                                    }}
                                    disabled={loading || deletingVoucherId === voucher.id}
                                    className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200 p-1 lg:p-2 transition-colors"
                                  >
                                    {deletingVoucherId === voucher.id ? (
                                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                    )}
                                    <span className="sr-only">Delete voucher</span>
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                        {filteredVouchers.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={userRole === "admin" ? 13 : 11}
                              className="text-center py-8 text-gray-500"
                            >
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
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editVoucher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300">
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
                  Edit Voucher: {editVoucher.voucherNo}
                </h2>
                <Button
                  onClick={closeEditModal}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-red-600"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {loadingMasterData && (
                <div className="flex items-center justify-center p-4 mb-4 bg-blue-50 rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
                  <span className="text-blue-700 text-sm">Loading dropdown options...</span>
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Company Name Dropdown - Now using Master Sheet data */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <Select
                      value={editVoucher.companyName}
                      onValueChange={(value) =>
                        setEditVoucher((prev) => (prev ? { ...prev, companyName: value } : null))
                      }
                      disabled={loadingMasterData}
                    >
                      <SelectTrigger className="w-full border border-gray-300 rounded-lg px-3 py-2 h-auto">
                        <SelectValue placeholder={loadingMasterData ? "Loading..." : "Select Company"} />
                      </SelectTrigger>
                      <SelectContent>
                        {masterData.companyNames.map((company) => (
                          <SelectItem key={company} value={company}>
                            {company}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bank AC From Dropdown - Now using Master Sheet data */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank AC From</label>
                    <Select
                      value={editVoucher.bankAcFrom}
                      onValueChange={(value) =>
                        setEditVoucher((prev) => (prev ? { ...prev, bankAcFrom: value } : null))
                      }
                      disabled={loadingMasterData}
                    >
                      <SelectTrigger className="w-full border border-gray-300 rounded-lg px-3 py-2 h-auto">
                        <SelectValue placeholder={loadingMasterData ? "Loading..." : "Select Bank Account"} />
                      </SelectTrigger>
                      <SelectContent>
                        {masterData.bankAccounts.map((bank) => (
                          <SelectItem key={bank} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date of Payment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <Input
                      type="date"
                      value={formatDateForInput(editVoucher.dateOfPaymentProcess)}
                      onChange={(e) =>
                        setEditVoucher((prev) => (prev ? { ...prev, dateOfPaymentProcess: e.target.value } : null))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  {/* Purpose */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                    <Input
                      value={editVoucher.purposeOfPayment}
                      onChange={(e) =>
                        setEditVoucher((prev) => (prev ? { ...prev, purposeOfPayment: e.target.value } : null))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  {/* Project Dropdown - Now using Master Sheet data */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                    <Select
                      value={editVoucher.project}
                      onValueChange={(value) =>
                        setEditVoucher((prev) => (prev ? { ...prev, project: value } : null))
                      }
                      disabled={loadingMasterData}
                    >
                      <SelectTrigger className="w-full border border-gray-300 rounded-lg px-3 py-2 h-auto">
                        <SelectValue placeholder={loadingMasterData ? "Loading..." : "Select Project"} />
                      </SelectTrigger>
                      <SelectContent>
                        {masterData.projects.map((proj) => (
                          <SelectItem key={proj} value={proj}>
                            {proj}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Other input fields (unchanged) */}
                  {[
                    ["Beneficiary Name", "beneficiaryName"],
                    ["PO Number", "poNumber"],
                    ["Beneficiary A/C Name", "beneficiaryAcName"],
                    ["Beneficiary A/C Number", "beneficiaryAcNumber"],
                    ["Beneficiary Bank Name", "beneficiaryBankName"],
                    ["Beneficiary Bank IFSC", "beneficiaryBankIfsc"]
                  ].map(([label, key]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                      </label>
                      <Input
                        value={editVoucher[key]}
                        onChange={(e) =>
                          setEditVoucher((prev) => (prev ? { ...prev, [key]: e.target.value } : null))
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        required
                      />
                    </div>
                  ))}

                  {/* Transaction Type Dropdown - Now using Master Sheet data */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                    <Select
                      value={editVoucher.transactionType}
                      onValueChange={(value) =>
                        setEditVoucher((prev) => (prev ? { ...prev, transactionType: value } : null))
                      }
                      disabled={loadingMasterData}
                    >
                      <SelectTrigger className="w-full border border-gray-300 rounded-lg px-3 py-2 h-auto">
                        <SelectValue placeholder={loadingMasterData ? "Loading..." : "Select Transaction Type"} />
                      </SelectTrigger>
                      <SelectContent>
                        {masterData.transactionTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Remaining form: Particulars, Amounts, Buttons — no change */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Particulars</label>
                  <Textarea
                    value={editVoucher.particulars}
                    onChange={(e) =>
                      setEditVoucher((prev) => (prev ? { ...prev, particulars: e.target.value } : null))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editVoucher.amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount in Words</label>
                    <Input
                      value={editVoucher.amountInWords}
                      onChange={(e) =>
                        setEditVoucher((prev) => (prev ? { ...prev, amountInWords: e.target.value } : null))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: "Entry Done By", key: "entryDoneBy", isReadOnly: true },
                    { label: "Checked By", key: "checkedBy", isReadOnly: false },
                    { label: "Approved By", key: "approvedBy", isReadOnly: false }
                  ].map(({ label, key, isReadOnly }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                      <Input
                        value={editVoucher[key]}
                        onChange={(e) =>
                          setEditVoucher((prev) => (prev ? { ...prev, [key]: e.target.value } : null))
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        required
                        readOnly={isReadOnly}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-4">
                  <Button type="button" variant="outline" onClick={closeEditModal} disabled={isUpdating}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUpdating || loadingMasterData}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Voucher"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}