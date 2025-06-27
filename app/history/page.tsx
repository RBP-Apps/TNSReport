"use client"

import { useState, useEffect } from "react"
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
  // All columns from A to X
  columnA?: string
  columnB?: string
  columnC?: string
  columnD?: string
  columnE?: string
  columnF?: string
  columnG?: string
  columnH?: string
  columnI?: string
  columnJ?: string
  columnK?: string
  columnL?: string
  columnM?: string
  columnN?: string
  columnO?: string
  columnP?: string
  columnQ?: string
  columnR?: string
  columnS?: string
  columnT?: string
  columnU?: string
  columnV?: string
  columnW?: string
  columnX?: string
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
          processRealSheetDataV2(jsonResult.data)
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

  const processRealSheetDataV2 = (data: any[]) => {
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
        console.log(`Processing row ${index + 1}:`, row)

        // Check if this row has essential data (at least voucher number in column B)
        if (!row || row.length < 2 || !row[1] || String(row[1]).trim() === '') {
          console.log(`Skipping row ${index + 1}: Missing voucher number in column B`)
          return null
        }

        const voucher: VoucherData = {
          id: `history_${index + 1}`,
          // Main display fields according to your NEW specification:
          dateOfPayment: row[0] ? String(row[0]) : '', // Column A - TIMESTAMP
          voucherNo: row[1] ? String(row[1]) : '', // Column B - VOUCHER NO.
          companyName: row[3] ? String(row[3]) : '', // Column D - COMPANY NAME
          purposeOfPayment: row[5] ? String(row[5]) : '', // Column F - PURPOSE OF PAYMENT
          transactionType: row[7] ? String(row[7]) : '', // Column H - TRANSACTION TYPE
          project: row[8] ? String(row[8]) : '', // Column I - PROJECT
          beneficiaryName: row[9] ? String(row[9]) : '', // Column J - BENEFICIARY NAME (PAID TO)
          amount: row[16] ? String(row[16]) : '0', // Column Q - AMOUNT

          // Store all columns A to X for full details view (24 columns)
          columnA: row[0] ? String(row[0]) : '', // A - TIMESTAMP
          columnB: row[1] ? String(row[1]) : '', // B - VOUCHER NO.
          columnC: row[2] ? String(row[2]) : '', // C
          columnD: row[3] ? String(row[3]) : '', // D - COMPANY NAME
          columnE: row[4] ? String(row[4]) : '', // E
          columnF: row[5] ? String(row[5]) : '', // F - PURPOSE OF PAYMENT
          columnG: row[6] ? String(row[6]) : '', // G
          columnH: row[7] ? String(row[7]) : '', // H - TRANSACTION TYPE
          columnI: row[8] ? String(row[8]) : '', // I - PROJECT
          columnJ: row[9] ? String(row[9]) : '', // J - BENEFICIARY NAME (PAID TO)
          columnK: row[10] ? String(row[10]) : '', // K
          columnL: row[11] ? String(row[11]) : '', // L
          columnM: row[12] ? String(row[12]) : '', // M
          columnN: row[13] ? String(row[13]) : '', // N
          columnO: row[14] ? String(row[14]) : '', // O
          columnP: row[15] ? String(row[15]) : '', // P
          columnQ: row[16] ? String(row[16]) : '', // Q - AMOUNT
          columnR: row[17] ? String(row[17]) : '', // R
          columnS: row[18] ? String(row[18]) : '', // S
          columnT: row[19] ? String(row[19]) : '', // T
          columnU: row[20] ? String(row[20]) : '', // U
          columnV: row[21] ? String(row[21]) : '', // V
          columnW: row[22] ? String(row[22]) : '', // W
          columnX: row[23] ? String(row[23]) : '', // X
        }

        console.log(`Mapped voucher ${index + 1}:`, {
          id: voucher.id,
          voucherNo: voucher.voucherNo,
          companyName: voucher.companyName,
          amount: voucher.amount,
          date: voucher.dateOfPayment
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
      const dateA = new Date(a.dateOfPayment)
      const dateB = new Date(b.dateOfPayment)
      return dateB.getTime() - dateA.getTime()
    })

    setVouchers(sortedVouchers)
    console.log(`✅ Successfully loaded ${sortedVouchers.length} vouchers from History sheet!`)
    console.log('Voucher numbers loaded:', sortedVouchers.map(v => v.voucherNo))
    console.log('Sample voucher data:', sortedVouchers[0])
  }

  const loadMockDataBasedOnHistoryStructure = () => {
    console.log('Loading mock data based on History sheet structure...')

    // This mock data follows the exact structure your History sheet should have
    // based on your voucher creation form
    const mockVouchers: VoucherData[] = [
      {
        id: 'history_1',
        // Following the exact column mapping you specified:
        dateOfPayment: new Date().toISOString(), // Column A - TIMESTAMP
        companyName: 'Tech Solutions Pvt Ltd', // Column C - COMPANY NAME  
        purposeOfPayment: 'Software Development Services', // Column E - PURPOSE OF PAYMENT
        voucherNo: 'TNS-01', // Column F - VOUCHER NO.
        transactionType: 'PAYMENT', // Column G - TRANSACTION TYPE
        project: 'E-commerce Platform', // Column H - PROJECT
        beneficiaryName: 'Rajesh Kumar', // Column I - BENEFICIARY NAME (PAID TO)
        amount: '150000', // Column P - AMOUNT

        // All columns A to V as they would appear in your History sheet
        columnA: new Date().toISOString(),
        columnB: 'REF001',
        columnC: 'Tech Solutions Pvt Ltd',
        columnD: 'HDFC Bank - 50100123456',
        columnE: 'Software Development Services',
        columnF: 'TNS-01',
        columnG: 'PAYMENT',
        columnH: 'E-commerce Platform',
        columnI: 'Rajesh Kumar',
        columnJ: 'Developer',
        columnK: 'Full-time',
        columnL: 'Phase 1',
        columnM: 'Approved',
        columnN: 'Mumbai',
        columnO: 'INR',
        columnP: '150000',
        columnQ: 'TDS 10%',
        columnR: '15000',
        columnS: 'Net: 135000',
        columnT: 'Completed',
        columnU: 'rajesh@techsol.com',
        columnV: 'https://drive.google.com/file/d/sample1/view',
      },
      {
        id: 'history_2',
        dateOfPayment: new Date(Date.now() - 86400000).toISOString(),
        companyName: 'Digital Marketing Agency',
        purposeOfPayment: 'SEO & Content Marketing',
        voucherNo: 'TNS-02',
        transactionType: 'PAYMENT',
        project: 'Brand Promotion Campaign',
        beneficiaryName: 'Priya Sharma',
        amount: '75000',

        columnA: new Date(Date.now() - 86400000).toISOString(),
        columnB: 'REF002',
        columnC: 'Digital Marketing Agency',
        columnD: 'ICICI Bank - 60200987654',
        columnE: 'SEO & Content Marketing',
        columnF: 'TNS-02',
        columnG: 'PAYMENT',
        columnH: 'Brand Promotion Campaign',
        columnI: 'Priya Sharma',
        columnJ: 'Marketing Manager',
        columnK: 'Contract',
        columnL: 'Phase 2',
        columnM: 'In Progress',
        columnN: 'Delhi',
        columnO: 'INR',
        columnP: '75000',
        columnQ: 'TDS 10%',
        columnR: '7500',
        columnS: 'Net: 67500',
        columnT: 'Processing',
        columnU: 'priya@digitalagency.com',
        columnV: 'https://drive.google.com/file/d/sample2/view',
      },
      {
        id: 'history_3',
        dateOfPayment: new Date(Date.now() - 172800000).toISOString(),
        companyName: 'Cloud Infrastructure Ltd',
        purposeOfPayment: 'Server Maintenance & Support',
        voucherNo: 'TNS-03',
        transactionType: 'PAYMENT',
        project: 'Infrastructure Upgrade',
        beneficiaryName: 'Amit Patel',
        amount: '220000',

        columnA: new Date(Date.now() - 172800000).toISOString(),
        columnB: 'REF003',
        columnC: 'Cloud Infrastructure Ltd',
        columnD: 'SBI Bank - 30400567890',
        columnE: 'Server Maintenance & Support',
        columnF: 'TNS-03',
        columnG: 'PAYMENT',
        columnH: 'Infrastructure Upgrade',
        columnI: 'Amit Patel',
        columnJ: 'System Administrator',
        columnK: 'Full-time',
        columnL: 'Complete',
        columnM: 'Verified',
        columnN: 'Bangalore',
        columnO: 'INR',
        columnP: '220000',
        columnQ: 'TDS 10%',
        columnR: '22000',
        columnS: 'Net: 198000',
        columnT: 'Completed',
        columnU: 'amit@cloudinfra.com',
        columnV: 'https://drive.google.com/file/d/sample3/view',
      }
    ]

    setVouchers(mockVouchers)
    console.log(`Loaded ${mockVouchers.length} mock vouchers based on History sheet structure`)
    console.log('Note: This is mock data. To show real data from History sheet, add a read action to your Google Apps Script')
  }

  const fetchRealHistoryDataJSONP = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const callbackName = 'jsonp_history_callback_' + Date.now() + '_' + Math.random().toString(36).substring(2)

        // Create global callback function
        ; (window as any)[callbackName] = (data: any) => {
          try {
            console.log('JSONP received history data:', data)

            if (data && data.success && Array.isArray(data.data)) {
              console.log(`Processing ${data.data.length} rows from History sheet`)
              processRealSheetData(data.data)
              cleanup()
              resolve()
            } else if (data && data.error) {
              console.error('Apps Script returned error:', data.error)
              cleanup()
              reject(new Error(`History sheet error: ${data.error}`))
            } else {
              console.error('Invalid data format from History sheet:', data)
              cleanup()
              reject(new Error('Invalid data format from History sheet'))
            }
          } catch (error) {
            console.error('Error processing History sheet data:', error)
            cleanup()
            reject(error)
          }
        }

      const cleanup = () => {
        try {
          if (script && script.parentNode) {
            script.parentNode.removeChild(script)
          }
          delete (window as any)[callbackName]
        } catch (cleanupError) {
          console.warn('Cleanup error:', cleanupError)
        }
      }

      // Create script element for JSONP
      const script = document.createElement('script')
      script.src = `${GOOGLE_APPS_SCRIPT_URL}?action=getHistoryData&callback=${callbackName}&_=${Date.now()}`

      console.log('JSONP URL for History data:', script.src)

      script.onerror = (error) => {
        console.error('JSONP script failed to load for History data:', error)
        console.error('Check if Google Apps Script URL is correct:', GOOGLE_APPS_SCRIPT_URL)
        console.error('Check if Google Apps Script is deployed and public')
        cleanup()
        reject(new Error('Failed to load History data - Check Google Apps Script deployment'))
      }

      script.onload = () => {
        console.log('JSONP script loaded successfully')
        // If script loads but callback doesn't execute within reasonable time, consider it failed
        setTimeout(() => {
          if ((window as any)[callbackName]) {
            console.error('JSONP callback not executed - likely Apps Script error')
            cleanup()
            reject(new Error('Apps Script did not execute callback - Check doGet function'))
          }
        }, 5000)
      }

      // Set longer timeout for better debugging
      setTimeout(() => {
        if ((window as any)[callbackName]) {
          console.error('JSONP request timed out for History data')
          console.error('This usually means:')
          console.error('1. Google Apps Script URL is wrong')
          console.error('2. doGet function is not implemented correctly')
          console.error('3. Network connectivity issues')
          cleanup()
          reject(new Error('Request timed out - Check Google Apps Script setup'))
        }
      }, 30000) // 30 seconds timeout

      // Add script to head
      try {
        document.head.appendChild(script)
        console.log('JSONP script added to document head')
      } catch (appendError) {
        console.error('Failed to append script to head:', appendError)
        cleanup()
        reject(new Error('Failed to create JSONP request'))
      }
    })
  }

  const processRealSheetData = (data: any[]) => {
    console.log('Processing real data from History sheet...')

    if (!Array.isArray(data) || data.length === 0) {
      console.log('No data received from History sheet')
      throw new Error('History sheet is empty or no data received')
    }

    // Check if first row contains headers
    const hasHeaders = data.length > 0 &&
      (String(data[0][0]).toLowerCase().includes('timestamp') ||
        String(data[0][5]).toLowerCase().includes('voucher'))

    const dataRows = hasHeaders ? data.slice(1) : data
    console.log(`Processing ${dataRows.length} data rows from History sheet`)

    const mappedVouchers = dataRows
      .map((row: any[], index: number) => {
        // Check if this row has essential data (at least voucher number in column F)
        if (!row || row.length < 6 || !row[5] || String(row[5]).trim() === '') {
          return null
        }

        const voucher: VoucherData = {
          id: `history_${index + 1}`,
          // Main display fields according to your specification
          dateOfPayment: row[0] ? String(row[0]) : '', // Column A - TIMESTAMP
          companyName: row[2] ? String(row[2]) : '', // Column C - COMPANY NAME
          purposeOfPayment: row[4] ? String(row[4]) : '', // Column E - PURPOSE OF PAYMENT
          voucherNo: row[5] ? String(row[5]) : '', // Column F - VOUCHER NO.
          transactionType: row[6] ? String(row[6]) : '', // Column G - TRANSACTION TYPE
          project: row[7] ? String(row[7]) : '', // Column H - PROJECT
          beneficiaryName: row[8] ? String(row[8]) : '', // Column I - BENEFICIARY NAME (PAID TO)
          amount: row[15] ? String(row[15]) : '0', // Column P - AMOUNT

          // Store all columns A to V for full details view
          columnA: row[0] ? String(row[0]) : '', // TIMESTAMP
          columnB: row[1] ? String(row[1]) : '',
          columnC: row[2] ? String(row[2]) : '', // COMPANY NAME
          columnD: row[3] ? String(row[3]) : '',
          columnE: row[4] ? String(row[4]) : '', // PURPOSE OF PAYMENT
          columnF: row[5] ? String(row[5]) : '', // VOUCHER NO.
          columnG: row[6] ? String(row[6]) : '', // TRANSACTION TYPE
          columnH: row[7] ? String(row[7]) : '', // PROJECT
          columnI: row[8] ? String(row[8]) : '', // BENEFICIARY NAME (PAID TO)
          columnJ: row[9] ? String(row[9]) : '',
          columnK: row[10] ? String(row[10]) : '',
          columnL: row[11] ? String(row[11]) : '',
          columnM: row[12] ? String(row[12]) : '',
          columnN: row[13] ? String(row[13]) : '',
          columnO: row[14] ? String(row[14]) : '',
          columnP: row[15] ? String(row[15]) : '', // AMOUNT
          columnQ: row[16] ? String(row[16]) : '',
          columnR: row[17] ? String(row[17]) : '',
          columnS: row[18] ? String(row[18]) : '',
          columnT: row[19] ? String(row[19]) : '',
          columnU: row[20] ? String(row[20]) : '',
          columnV: row[21] ? String(row[21]) : '',
        }
        return voucher
      })
      .filter((voucher: { voucherNo: string } | null): voucher is VoucherData =>
        Boolean(voucher && voucher.voucherNo && voucher.voucherNo.trim() !== '')
      )

    console.log(`Successfully processed ${mappedVouchers.length} real vouchers from History sheet`)

    if (mappedVouchers.length === 0) {
      console.warn('No valid vouchers found in History sheet data')
      throw new Error('No valid vouchers found in History sheet')
    }

    // Sort by date (newest first) and set the data
    const sortedVouchers = mappedVouchers.sort((a, b) => {
      const dateA = new Date(a.dateOfPayment)
      const dateB = new Date(b.dateOfPayment)
      return dateB.getTime() - dateA.getTime()
    })

    setVouchers(sortedVouchers)
    console.log(`Loaded ${sortedVouchers.length} vouchers from History sheet successfully`)
  }

  // Process data from sheet
  const processSheetData = (data: any[]) => {
    console.log('Processing sheet data...')

    if (!Array.isArray(data) || data.length === 0) {
      console.log('No data received from sheet')
      loadMockData()
      return
    }

    // Skip header row if present and process data
    const hasHeaders = data.length > 0 && typeof data[0][0] === 'string' && data[0][0].toLowerCase().includes('timestamp')
    const dataRows = hasHeaders ? data.slice(1) : data

    const mappedVouchers = dataRows
      .map((row: any[], index: number) => {
        if (!row || row.length < 6 || !row[5]) { // Check if F column (VOUCHER NO.) exists
          return null
        }

        const voucher: VoucherData = {
          id: `voucher_${index + 1}`,
          // Main display fields according to your specification
          dateOfPayment: row[0] || '', // Column A - TIMESTAMP
          companyName: row[2] || '', // Column C - COMPANY NAME
          purposeOfPayment: row[4] || '', // Column E - PURPOSE OF PAYMENT
          voucherNo: row[5] || '', // Column F - VOUCHER NO.
          transactionType: row[6] || '', // Column G - TRANSACTION TYPE
          project: row[7] || '', // Column H - PROJECT
          beneficiaryName: row[8] || '', // Column I - BENEFICIARY NAME (PAID TO)
          amount: row[15] || '0', // Column P - AMOUNT

          // Store all columns A to V for full details view
          columnA: row[0] || '', // TIMESTAMP
          columnB: row[1] || '',
          columnC: row[2] || '', // COMPANY NAME
          columnD: row[3] || '',
          columnE: row[4] || '', // PURPOSE OF PAYMENT
          columnF: row[5] || '', // VOUCHER NO.
          columnG: row[6] || '', // TRANSACTION TYPE
          columnH: row[7] || '', // PROJECT
          columnI: row[8] || '', // BENEFICIARY NAME (PAID TO)
          columnJ: row[9] || '',
          columnK: row[10] || '',
          columnL: row[11] || '',
          columnM: row[12] || '',
          columnN: row[13] || '',
          columnO: row[14] || '',
          columnP: row[15] || '', // AMOUNT
          columnQ: row[16] || '',
          columnR: row[17] || '',
          columnS: row[18] || '',
          columnT: row[19] || '',
          columnU: row[20] || '',
          columnV: row[21] || '',
        }
        return voucher
      })
      .filter((voucher: { voucherNo: string } | null): voucher is VoucherData => voucher !== null && voucher.voucherNo !== '')

    console.log(`Successfully processed ${mappedVouchers.length} vouchers`)
    setVouchers(mappedVouchers.reverse())

    if (mappedVouchers.length === 0) {
      loadMockData()
    }
  }

  const loadMockData = () => {
    console.log('Loading comprehensive mock data for testing...')
    const mockVouchers: VoucherData[] = [
      {
        id: 'mock_1',
        voucherNo: 'TNS-01',
        dateOfPayment: new Date().toISOString(),
        companyName: 'Tech Solutions Pvt Ltd',
        beneficiaryName: 'Rajesh Kumar',
        purposeOfPayment: 'Software Development Services',
        project: 'E-commerce Platform',
        amount: '150000',
        transactionType: 'PAYMENT',
        columnA: new Date().toISOString(),
        columnB: 'REF001',
        columnC: 'Tech Solutions Pvt Ltd',
        columnD: 'HDFC Bank - 50100123456',
        columnE: 'Software Development Services',
        columnF: 'TNS-01',
        columnG: 'PAYMENT',
        columnH: 'E-commerce Platform',
        columnI: 'Rajesh Kumar',
        columnJ: 'Developer',
        columnK: 'Full-time',
        columnL: 'Phase 1',
        columnM: 'Approved',
        columnN: 'Mumbai',
        columnO: 'INR',
        columnP: '150000',
        columnQ: 'TDS 10%',
        columnR: '15000',
        columnS: 'Net: 135000',
        columnT: 'Completed',
        columnU: 'rajesh@techsol.com',
        columnV: 'PDF_LINK_1',
      },
      {
        id: 'mock_2',
        voucherNo: 'TNS-02',
        dateOfPayment: new Date(Date.now() - 86400000).toISOString(),
        companyName: 'Digital Marketing Agency',
        beneficiaryName: 'Priya Sharma',
        purposeOfPayment: 'SEO & Content Marketing',
        project: 'Brand Promotion Campaign',
        amount: '75000',
        transactionType: 'PAYMENT',
        columnA: new Date(Date.now() - 86400000).toISOString(),
        columnB: 'REF002',
        columnC: 'Digital Marketing Agency',
        columnD: 'ICICI Bank - 60200987654',
        columnE: 'SEO & Content Marketing',
        columnF: 'TNS-02',
        columnG: 'PAYMENT',
        columnH: 'Brand Promotion Campaign',
        columnI: 'Priya Sharma',
        columnJ: 'Marketing Manager',
        columnK: 'Contract',
        columnL: 'Phase 2',
        columnM: 'In Progress',
        columnN: 'Delhi',
        columnO: 'INR',
        columnP: '75000',
        columnQ: 'TDS 10%',
        columnR: '7500',
        columnS: 'Net: 67500',
        columnT: 'Processing',
        columnU: 'priya@digitalagency.com',
        columnV: 'PDF_LINK_2',
      },
      {
        id: 'mock_3',
        voucherNo: 'TNS-03',
        dateOfPayment: new Date(Date.now() - 172800000).toISOString(),
        companyName: 'Cloud Infrastructure Ltd',
        beneficiaryName: 'Amit Patel',
        purposeOfPayment: 'Server Maintenance & Support',
        project: 'Infrastructure Upgrade',
        amount: '220000',
        transactionType: 'PAYMENT',
        columnA: new Date(Date.now() - 172800000).toISOString(),
        columnB: 'REF003',
        columnC: 'Cloud Infrastructure Ltd',
        columnD: 'SBI Bank - 30400567890',
        columnE: 'Server Maintenance & Support',
        columnF: 'TNS-03',
        columnG: 'PAYMENT',
        columnH: 'Infrastructure Upgrade',
        columnI: 'Amit Patel',
        columnJ: 'System Administrator',
        columnK: 'Full-time',
        columnL: 'Complete',
        columnM: 'Verified',
        columnN: 'Bangalore',
        columnO: 'INR',
        columnP: '220000',
        columnQ: 'TDS 10%',
        columnR: '22000',
        columnS: 'Net: 198000',
        columnT: 'Completed',
        columnU: 'amit@cloudinfra.com',
        columnV: 'PDF_LINK_3',
      },
      {
        id: 'mock_4',
        voucherNo: 'TNS-04',
        dateOfPayment: new Date(Date.now() - 259200000).toISOString(),
        companyName: 'Data Analytics Corp',
        beneficiaryName: 'Sneha Reddy',
        purposeOfPayment: 'Business Intelligence Dashboard',
        project: 'Analytics Platform',
        amount: '180000',
        transactionType: 'PAYMENT',
        columnA: new Date(Date.now() - 259200000).toISOString(),
        columnB: 'REF004',
        columnC: 'Data Analytics Corp',
        columnD: 'Axis Bank - 91100445566',
        columnE: 'Business Intelligence Dashboard',
        columnF: 'TNS-04',
        columnG: 'PAYMENT',
        columnH: 'Analytics Platform',
        columnI: 'Sneha Reddy',
        columnJ: 'Data Scientist',
        columnK: 'Contract',
        columnL: 'Phase 3',
        columnM: 'Under Review',
        columnN: 'Hyderabad',
        columnO: 'INR',
        columnP: '180000',
        columnQ: 'TDS 10%',
        columnR: '18000',
        columnS: 'Net: 162000',
        columnT: 'Pending',
        columnU: 'sneha@dataanalytics.com',
        columnV: 'PDF_LINK_4',
      },
      {
        id: 'mock_5',
        voucherNo: 'TNS-05',
        dateOfPayment: new Date(Date.now() - 345600000).toISOString(),
        companyName: 'Mobile App Developers',
        beneficiaryName: 'Vikram Singh',
        purposeOfPayment: 'iOS & Android App Development',
        project: 'Mobile Application Suite',
        amount: '125000',
        transactionType: 'PAYMENT',
        columnA: new Date(Date.now() - 345600000).toISOString(),
        columnB: 'REF005',
        columnC: 'Mobile App Developers',
        columnD: 'PNB Bank - 12300789012',
        columnE: 'iOS & Android App Development',
        columnF: 'TNS-05',
        columnG: 'PAYMENT',
        columnH: 'Mobile Application Suite',
        columnI: 'Vikram Singh',
        columnJ: 'Mobile Developer',
        columnK: 'Freelancer',
        columnL: 'Final',
        columnM: 'Completed',
        columnN: 'Pune',
        columnO: 'INR',
        columnP: '125000',
        columnQ: 'TDS 10%',
        columnR: '12500',
        columnS: 'Net: 112500',
        columnT: 'Completed',
        columnU: 'vikram@mobiledev.com',
        columnV: 'PDF_LINK_5',
      }
    ]
    setVouchers(mockVouchers)
    console.log(`Loaded ${mockVouchers.length} mock vouchers for testing`)
  }

  // Get unique values for filter dropdowns
  const getUniqueCompanies = () => {
    const companies = [...new Set(vouchers.map((v) => v.companyName).filter(Boolean))]
    return companies.sort()
  }

  const getUniqueProjects = () => {
    const projects = [...new Set(vouchers.map((v) => v.project).filter(Boolean))]
    return projects.sort()
  }

  const getUniquePurposes = () => {
    const purposes = [...new Set(vouchers.map((v) => v.purposeOfPayment).filter(Boolean))]
    return purposes.sort()
  }

  const getUniqueTransactionTypes = () => {
    const types = [...new Set(vouchers.map((v) => v.transactionType).filter(Boolean))]
    return types.sort()
  }

  // Apply all filters
  const filteredVouchers = vouchers.filter((voucher) => {
    const matchesSearch =
      (
        voucher.beneficiaryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (voucher.voucherNo?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (voucher.project?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (voucher.purposeOfPayment?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (voucher.companyName?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    const matchesCompany = selectedCompany === "all" || voucher.companyName === selectedCompany
    const matchesProject = selectedProject === "all" || voucher.project === selectedProject
    const matchesPurpose = selectedPurpose === "all" || voucher.purposeOfPayment === selectedPurpose
    const matchesTransactionType = selectedTransactionType === "all" || voucher.transactionType === selectedTransactionType

    const voucherDate = new Date(voucher.dateOfPayment)
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

  const clearAllFilters = () => {
    setSearchTerm("")
    setSelectedCompany("all")
    setSelectedProject("all")
    setSelectedPurpose("all")
    setSelectedTransactionType("all")
    setDateFrom("")
    setDateTo("")
    setAmountFrom("")
    setAmountTo("")
  }

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
        { label: "Voucher Number", value: voucher.voucherNo },
        { label: "Date/Timestamp", value: voucher.dateOfPayment ? new Date(voucher.dateOfPayment).toLocaleString("en-IN") : 'N/A' },
        { label: "Transaction Type", value: voucher.transactionType },
        { label: "Company Name", value: voucher.companyName },
        { label: "Purpose of Payment", value: voucher.purposeOfPayment },
        { label: "Project", value: voucher.project }
      ])

      // Section 2: Beneficiary Information
      addSection("BENEFICIARY INFORMATION", [
        { label: "Beneficiary Name (Paid To)", value: voucher.beneficiaryName },
        { label: "PO. Number", value: voucher.columnK ?? "" },
        { label: "(Name of AC Holder) Beneficiary A/C Name", value: voucher.columnL ?? "" },
        { label: "Beneficiary A/C Number", value: voucher.columnM ?? "" },
        { label: "Beneficiary Bank Name", value: voucher.columnN ?? "" },
        { label: "Beneficiary Bank IFSC", value: voucher.columnO ?? "" },
        { label: "Particulars", value: voucher.columnP ?? "" }
      ])

      // Section 3: Financial Information
      addSection("FINANCIAL INFORMATION", [
        { label: "Amount", value: `₹${Number.parseFloat(voucher.amount).toLocaleString("en-IN")}` },
        { label: "Amount in Words", value: voucher.columnR ?? "" },
        { label: "Bank AC From", value: voucher.columnC ?? "" },
        { label: "Date of Payment/Process", value: voucher.columnE ?? "" }
      ])

      // Section 4: Approval Information
      addSection("APPROVAL INFORMATION", [
        { label: "Entry Done By", value: voucher.columnS ?? "" },
        { label: "Checked By", value: voucher.columnT ?? "" },
        { label: "Approved By", value: voucher.columnU ?? "" },
        { label: "Payment From Which Company", value: voucher.columnG ?? "" },
        { label: "PDF Link", value: voucher.columnV ?? "" }
      ])

      // Add new page for complete data table if needed
      doc.addPage()

      // Complete Data Table
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Complete History Sheet Data (Columns A to V)", 105, 20, { align: "center" })

      yPosition = 35
      doc.setFontSize(8)

      const allColumns = [
        { key: 'columnA', label: 'TIMESTAMP' },
        { key: 'columnB', label: 'Voucher No.' },
        { key: 'columnC', label: 'BANK AC FROM' },
        { key: 'columnD', label: 'COMPANY NAME' },
        { key: 'columnE', label: 'DATE OF PAYMENT/PROCESS' },
        { key: 'columnF', label: 'PURPOSE OF PAYMENT' },
        { key: 'columnG', label: 'Payment From Which Company' },
        { key: 'columnH', label: 'TRANSACTION TYPE' },
        { key: 'columnI', label: 'PROJECT' },
        { key: 'columnJ', label: 'BENEFICIARY NAME (PAID TO)' },
        { key: 'columnK', label: 'PO. NUMBER' },
        { key: 'columnL', label: '(NAME OF AC HOLDER) BENEFICIARY A/C NAME' },
        { key: 'columnM', label: 'BENEFICIARY A/C NUMBER' },
        { key: 'columnN', label: 'BENEFICIARY BANK NAME' },
        { key: 'columnO', label: 'BENEFICIARY BANK IFSC' },
        { key: 'columnP', label: 'PARTICULARS' },
        { key: 'columnQ', label: 'AMOUNT' },
        { key: 'columnR', label: 'AMOUNT IN WORDS' },
        { key: 'columnS', label: 'ENTRY DONE BY' },
        { key: 'columnT', label: 'CHECKED BY' },
        { key: 'columnU', label: 'APPROVED BY' },
        { key: 'columnV', label: 'PDF Link' },
        { key: 'columnW', label: 'Column W' },
        { key: 'columnX', label: 'Column X' }
      ]

      allColumns.forEach((column, index) => {
        if (yPosition > 270) {
          doc.addPage()
          yPosition = 20
        }

        // Column header
        doc.setFont("helvetica", "bold")
        doc.setFillColor(240, 248, 255)
        doc.rect(15, yPosition - 3, 180, 8, 'F')
        doc.text(column.label, 20, yPosition + 2)

        // Column value
        doc.setFont("helvetica", "normal")
        const value = voucher[column.key]
        let displayValue = 'N/A'

        if (value !== null && value !== undefined && value !== '') {
          if (column.key === 'columnA' && value) {
            displayValue = new Date(value).toLocaleString("en-IN")
          } else if (column.key === 'columnP' && value) {
            displayValue = `₹${Number.parseFloat(value).toLocaleString("en-IN")}`
          } else {
            displayValue = String(value)
          }
        }

        const valueLines = doc.splitTextToSize(displayValue, 160)
        doc.text(valueLines, 20, yPosition + 10)

        yPosition += Math.max(15, valueLines.length * 4 + 8)
      })

      // Footer on last page
      doc.setFontSize(8)
      doc.setFont("helvetica", "italic")
      doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 20, doc.internal.pageSize.height - 20)
      doc.text(`Voucher ID: ${voucher.id}`, 20, doc.internal.pageSize.height - 15)
      doc.text("Complete History Sheet Data Export", 20, doc.internal.pageSize.height - 10)

      // Save the PDF
      doc.save(`Complete_Payment_Voucher_${voucher.voucherNo}_${Date.now()}.pdf`)
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

  const getTotalAmount = () => {
    return filteredVouchers.reduce((sum, voucher) => sum + (Number.parseFloat(voucher.amount) || 0), 0)
  }

  const activeFiltersCount = [
    selectedCompany !== "all",
    selectedProject !== "all",
    selectedPurpose !== "all",
    selectedTransactionType !== "all",
    dateFrom,
    dateTo,
    amountFrom,
    amountTo,
  ].filter(Boolean).length

  const renderAllDetails = (voucher: VoucherData) => {
    const columnMapping = {
      'columnA': 'TIMESTAMP',
      'columnB': 'Voucher No.',
      'columnC': 'BANK AC FROM',
      'columnD': 'COMPANY NAME',
      'columnE': 'DATE OF PAYMENT/PROCESS',
      'columnF': 'PURPOSE OF PAYMENT',
      'columnG': 'Payment From Which Company',
      'columnH': 'TRANSACTION TYPE',
      'columnI': 'PROJECT',
      'columnJ': 'BENEFICIARY NAME (PAID TO)',
      'columnK': 'PO. NUMBER',
      'columnL': '(NAME OF AC HOLDER) BENEFICIARY A/C NAME',
      'columnM': 'BENEFICIARY A/C NUMBER',
      'columnN': 'BENEFICIARY BANK NAME',
      'columnO': 'BENEFICIARY BANK IFSC',
      'columnP': 'PARTICULARS',
      'columnQ': 'AMOUNT',
      'columnR': 'AMOUNT IN WORDS',
      'columnS': 'ENTRY DONE BY',
      'columnT': 'CHECKED BY',
      'columnU': 'APPROVED BY',
      'columnV': 'PDF Link',
      'columnW': 'Column W',
      'columnX': 'Column X'
    }

    return (
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-3">All Details from History Sheet (Columns A to X)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          {Object.entries(columnMapping).map(([key, label]) => (
            <div key={key} className="bg-white p-3 rounded border">
              <p className="text-gray-600 font-medium text-xs">{label}</p>
              <p className="text-gray-800 break-words mt-1">
                {voucher[key] === null || voucher[key] === undefined || voucher[key] === ''
                  ? 'N/A'
                  : key === 'columnA' && voucher[key]
                    ? (() => {
                      try {
                        return new Date(voucher[key]).toLocaleString("en-IN")
                      } catch {
                        return String(voucher[key])
                      }
                    })()
                    : key === 'columnQ' && voucher[key]
                      ? (() => {
                        try {
                          return `₹${Number.parseFloat(voucher[key]).toLocaleString("en-IN")}`
                        } catch {
                          return String(voucher[key])
                        }
                      })()
                      : key === 'columnV' && voucher[key] && voucher[key].includes('http')
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
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h5 className="font-semibold text-gray-800 mb-3">Main Fields Summary (as shown in table)</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p><strong>Voucher No:</strong> {voucher.voucherNo} (Column B)</p>
              <p><strong>Date:</strong> {voucher.dateOfPayment ? (() => {
                try {
                  return new Date(voucher.dateOfPayment).toLocaleDateString("en-IN")
                } catch {
                  return voucher.dateOfPayment
                }
              })() : 'N/A'} (Column A)</p>
              <p><strong>Company:</strong> {voucher.companyName} (Column D)</p>
              <p><strong>Beneficiary:</strong> {voucher.beneficiaryName} (Column J)</p>
            </div>
            <div className="space-y-2">
              <p><strong>Purpose:</strong> {voucher.purposeOfPayment} (Column F)</p>
              <p><strong>Project:</strong> {voucher.project} (Column I)</p>
              <p><strong>Amount:</strong> ₹{Number.parseFloat(voucher.amount || '0').toLocaleString("en-IN")} (Column Q)</p>
              <p><strong>Type:</strong> {voucher.transactionType} (Column H)</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Loading Payment History</h3>
            <p className="text-gray-500">Fetching data from Google Sheets...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => router.push("/voucher")}
                variant="outline"
                className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Voucher
              </Button>
              {userRole === "admin" && (
                <Button
                  onClick={() => router.push("/dashboard")}
                  variant="outline"
                  className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              )}
              <Badge variant="secondary" className="bg-green-100 text-green-800 px-3 py-1">
                {filteredVouchers.length} of {vouchers.length} Vouchers
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                Total: ₹{getTotalAmount().toLocaleString("en-IN")}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <Card className="mb-6 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Filter className="mr-2 h-5 w-5" />
                Search & Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">
                    {activeFiltersCount} active
                  </Badge>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <Button onClick={clearAllFilters} variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <X className="mr-1 h-4 w-4" />
                  Clear All
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by voucher number, beneficiary name, project, purpose, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 border-2 border-gray-200 focus:border-blue-500"
              />
            </div>

            {/* Filter Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Company</label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="All Companies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {getUniqueCompanies().map((company) => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Project</label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {getUniqueProjects().map((project) => (
                      <SelectItem key={project} value={project}>
                        {project}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Purpose</label>
                <Select value={selectedPurpose} onValueChange={setSelectedPurpose}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="All Purposes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Purposes</SelectItem>
                    {getUniquePurposes().map((purpose) => (
                      <SelectItem key={purpose} value={purpose}>
                        {purpose}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Transaction Type</label>
                <Select value={selectedTransactionType} onValueChange={setSelectedTransactionType}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {getUniqueTransactionTypes().map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Row 2 - Date and Amount Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Date From</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-10" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Date To</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-10" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Amount From (₹)</label>
                <Input
                  type="number"
                  placeholder="Min amount"
                  value={amountFrom}
                  onChange={(e) => setAmountFrom(e.target.value)}
                  className="h-10"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Amount To (₹)</label>
                <Input
                  type="number"
                  placeholder="Max amount"
                  value={amountTo}
                  onChange={(e) => setAmountTo(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vouchers Table */}
        {filteredVouchers.length === 0 ? (
          <Card className="text-center p-12">
            <CardContent>
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {vouchers.length === 0 ? "No Vouchers Found" : "No Matching Vouchers"}
              </h3>
              <p className="text-gray-500 mb-4">
                {vouchers.length === 0
                  ? "No payment vouchers found in the History sheet."
                  : "Try adjusting your search criteria or filters."}
              </p>
              {vouchers.length === 0 ? (
                <Button
                  onClick={() => router.push("/voucher")}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  Create First Voucher
                </Button>
              ) : (
                <Button
                  onClick={clearAllFilters}
                  variant="outline"
                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Payment Vouchers ({filteredVouchers.length})
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">
                    Filtered
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Voucher No.</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Company</TableHead>
                      <TableHead className="font-semibold">Beneficiary</TableHead>
                      <TableHead className="font-semibold">Purpose</TableHead>
                      <TableHead className="font-semibold">Project</TableHead>
                      <TableHead className="font-semibold text-right">Amount</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVouchers.map((voucher, index) => (
                      <TableRow key={voucher.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <TableCell className="font-medium text-blue-600">{voucher.voucherNo}</TableCell>
                        <TableCell>{new Date(voucher.dateOfPayment).toLocaleDateString("en-IN")}</TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          <Badge variant="outline" className="text-xs">
                            {voucher.companyName}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate">{voucher.beneficiaryName}</TableCell>
                        <TableCell className="max-w-[100px] truncate">{voucher.purposeOfPayment}</TableCell>
                        <TableCell className="max-w-[100px] truncate">{voucher.project}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          ₹{Number.parseFloat(voucher.amount).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={voucher.transactionType === "PAYMENT" ? "default" : "secondary"}
                            className={
                              voucher.transactionType === "PAYMENT"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }
                          >
                            {voucher.transactionType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedVoucher(voucher)
                                setShowFullDetails(false)
                              }}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            {/* <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadPDF(voucher)}
                              className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            {userRole === "admin" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteVoucher(voucher.id)}
                                className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button> */}

                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Voucher Detail Modal */}
        {selectedVoucher && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardTitle className="flex items-center justify-between">
                  <span>Voucher Details - {selectedVoucher.voucherNo}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedVoucher(null)}
                    className="text-white hover:bg-white/20"
                  >
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Company Header */}
                <div className="text-center border-b pb-4">
                  <h2 className="text-xl font-bold text-gray-800">{selectedVoucher.companyName}</h2>
                  <p className="text-gray-600">Bank Payment Voucher</p>
                </div>

                {/* Basic Details */}
                <div className="grid md:grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Voucher Number</p>
                    <p className="font-semibold">{selectedVoucher.voucherNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold">
                      {new Date(selectedVoucher.dateOfPayment).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Transaction Type</p>
                    <Badge className="bg-green-100 text-green-800">{selectedVoucher.transactionType}</Badge>
                  </div>
                </div>

                {/* Bank & Payment Details */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">Payment Details</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Company:</strong> {selectedVoucher.companyName}
                      </p>
                      <p>
                        <strong>Purpose:</strong> {selectedVoucher.purposeOfPayment}
                      </p>
                      <p>
                        <strong>Project:</strong> {selectedVoucher.project}
                      </p>
                      <p>
                        <strong>Transaction Type:</strong> {selectedVoucher.transactionType}
                      </p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">Beneficiary Information</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Name:</strong> {selectedVoucher.beneficiaryName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Amount Details */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Amount Details</h4>
                  <div className="grid md:grid-cols-1 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="text-2xl font-bold text-green-600">
                        ₹{Number.parseFloat(selectedVoucher.amount).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Toggle for full details */}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowFullDetails(!showFullDetails)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800"
                  >
                    {showFullDetails ? 'Hide Full Details' : 'Show All Details from History Sheet'}
                  </Button>
                </div>

                {/* Full details section */}
                {showFullDetails && renderAllDetails(selectedVoucher)}

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t text-sm text-gray-500">
                  <span>Data from Google Sheets</span>
                  {/* <Button
                    onClick={() => downloadPDF(selectedVoucher)}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button> */}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
