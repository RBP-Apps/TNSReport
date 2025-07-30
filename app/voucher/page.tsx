"use client"

import { useState, useEffect } from "react"

import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"

import { Textarea } from "@/components/ui/textarea"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { LogOut, History, Save, Building2, BarChart3 } from "lucide-react"

import jsPDF from "jspdf"

import autoTable from "jspdf-autotable"

import { Loader2 } from "lucide-react"

interface VoucherData {

  id: string

  voucherNo: string

  dateOfPayment: string

  bankAcFrom: string

  companyName: string

  bankAccount: string

  transactionType: string

  purposeOfPayment: string

  // paymentFromCompany: string

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

export default function VoucherPage() {

  const router = useRouter()

  const [username, setUsername] = useState("")

  const [userRole, setUserRole] = useState("")

  const [nextVoucherNumber, setNextVoucherNumber] = useState("")

  const [paymentFromCompanies, setPaymentFromCompanies] = useState([])

  const [bankAccounts, setBankAccounts] = useState([])

  const [companyNames, setCompanyNames] = useState<string[]>([]) // New state for company names

  const [transactionTypes, setTransactionTypes] = useState([]) // New state for transaction types

  const [projects, setProjects] = useState([]) // New state for projects

  const [filteredBankAccounts, setFilteredBankAccounts] = useState<any[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [voucherData, setVoucherData] = useState<VoucherData>({

    id: "",

    voucherNo: "",

    dateOfPayment: "",

    bankAcFrom: "",

    companyName: "",

    bankAccount: "AXIS BANK LTD- CC A/C 8711-TANAY",

    transactionType: "",

    purposeOfPayment: "",

    // paymentFromCompany: "",

    project: "",

    beneficiaryName: "",

    poNumber: "",

    beneficiaryAccountName: "",

    beneficiaryAccountNumber: "",

    beneficiaryBankName: "",

    beneficiaryBankIFSC: "",

    amount: "",

    amountInWords: "",

    particulars: "",

    entryDoneBy: "",

    checkedBy: "",

    approvedBy: "",

    submittedAt: "",

  })

  // Add loading states at the top with other state declarations

  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true)

  // Replace the existing fetch functions with these improved versions:

  const handleCompanySelection = (value: string) => {

    console.log("\n🏢 Company Selection Handler Called")

    console.log("Selected company:", value)

    console.log("Current bankAccounts state:", bankAccounts)

    handleInputChange("companyName", value)

    // Add a small delay to ensure state is updated

    setTimeout(() => {

      const filtered = filterBankAccountsByCompany(value, bankAccounts)

      console.log("Final filtered accounts:", filtered)

      setFilteredBankAccounts(filtered)

      // Reset bank account selection if current selection is not in filtered list

      if (voucherData.bankAcFrom && !filtered.includes(voucherData.bankAcFrom)) {

        console.log("Resetting bank account selection")

        handleInputChange("bankAcFrom", "")

      }

    }, 100)

  }

  const filterBankAccountsByCompany = (selectedCompany: string, allBankAccounts: any[]) => {

    console.log("=== FILTERING DEBUG ===")

    console.log("Selected Company:", selectedCompany)

    console.log("All Bank Accounts:", allBankAccounts)

    if (!selectedCompany || !allBankAccounts.length) {

      console.log("No company selected or no bank accounts available")

      return allBankAccounts

    }

    // More flexible keyword extraction

    const companyKeywords = selectedCompany.split(' ').filter(word => {

      const upperWord = word.toUpperCase()

      const isValidKeyword = word.length > 2 &&

        !['PVT', 'LTD', 'LIMITED', 'PRIVATE', 'INDIA', 'COMPANY', '(INDIA)'].includes(upperWord)

      console.log(`Word: "${word}" -> Valid: ${isValidKeyword}`)

      return isValidKeyword

    })

    console.log("Keywords to match:", companyKeywords)

    // Try different matching strategies

    const strategies = [

      // Strategy 1: All keywords must be present (strict)

      (account: string) => {

        const upperAccount = account.toUpperCase()

        const allMatch = companyKeywords.every(keyword =>

          upperAccount.includes(keyword.toUpperCase())

        )

        console.log(`Strategy 1 - Account: "${account}" -> Match all keywords: ${allMatch}`)

        return allMatch

      },

      // Strategy 2: At least 2 keywords must be present (moderate)

      (account: string) => {

        const upperAccount = account.toUpperCase()

        const matchCount = companyKeywords.filter(keyword =>

          upperAccount.includes(keyword.toUpperCase())

        ).length

        const matches = matchCount >= Math.min(2, companyKeywords.length)

        console.log(`Strategy 2 - Account: "${account}" -> Match count: ${matchCount}/${companyKeywords.length} -> Matches: ${matches}`)

        return matches

      },

      // Strategy 3: At least 1 keyword must be present (loose)

      (account: string) => {

        const upperAccount = account.toUpperCase()

        const anyMatch = companyKeywords.some(keyword =>

          upperAccount.includes(keyword.toUpperCase())

        )

        console.log(`Strategy 3 - Account: "${account}" -> Any match: ${anyMatch}`)

        return anyMatch

      }

    ]

    // Try strategies in order of preference

    for (let i = 0; i < strategies.length; i++) {

      console.log(`\n--- Trying Strategy ${i + 1} ---`)

      const filtered = allBankAccounts.filter(strategies[i])

      console.log(`Strategy ${i + 1} results:`, filtered)

      if (filtered.length > 0) {

        console.log(`✅ Strategy ${i + 1} found ${filtered.length} matches`)

        return filtered

      }

      console.log(`❌ Strategy ${i + 1} found no matches`)

    }

    console.log("⚠️ No strategy found matches, returning all accounts")

    return allBankAccounts

  }

  const fetchCompanyNamesFromMaster = async () => {

    try {

      console.log("Fetching company names...")

      const response = await fetch(

        "https://script.google.com/macros/s/AKfycbxxHogp4YBZ1VClZCdkEPyAddFUK6Y2grFmMrJHcqfIwufVG5ar9FACeVe_YIBb0PY9/exec",

        {

          method: "POST",

          headers: {

            "Content-Type": "application/x-www-form-urlencoded",

          },

          body: new URLSearchParams({

            action: "getCompanyNamesFromMaster",

            sheetName: "Master",

          }),

        },

      )

      const result = await response.json()

      console.log("Company names response:", result)

      if (result.success && result.companyNames) {

        // Remove duplicates using Set

        const uniqueCompanyNames = [...new Set(result.companyNames)]

        setCompanyNames(uniqueCompanyNames)

        console.log("Company names set:", uniqueCompanyNames.length)

      } else {

        console.error("Failed to fetch company names:", result)

      }

    } catch (error) {

      console.error("Error fetching company names from master:", error)

    }

  }

  // Fix 3: Update the fetchBankAccountsFromMaster function to properly set filtered accounts

  const fetchBankAccountsFromMaster = async () => {

    try {

      console.log("Fetching bank accounts...")

      const response = await fetch(

        "https://script.google.com/macros/s/AKfycbxxHogp4YBZ1VClZCdkEPyAddFUK6Y2grFmMrJHcqfIwufVG5ar9FACeVe_YIBb0PY9/exec",

        {

          method: "POST",

          headers: {

            "Content-Type": "application/x-www-form-urlencoded",

          },

          body: new URLSearchParams({

            action: "getBankAccountsFromMaster",

            sheetName: "Master",

          }),

        },

      )

      const result = await response.json()

      console.log("Bank accounts response:", result)

      if (result.success && result.bankAccounts) {

        setBankAccounts(result.bankAccounts)

        setFilteredBankAccounts(result.bankAccounts) // Set initial filtered accounts

        console.log("Bank accounts set:", result.bankAccounts.length)

      } else {

        console.error("Failed to fetch bank accounts:", result)

      }

    } catch (error) {

      console.error("Error fetching bank accounts from master:", error)

    }

  }

  const fetchTransactionTypesFromMaster = async () => {

    try {

      console.log("Fetching transaction types...")

      const response = await fetch(

        "https://script.google.com/macros/s/AKfycbxxHogp4YBZ1VClZCdkEPyAddFUK6Y2grFmMrJHcqfIwufVG5ar9FACeVe_YIBb0PY9/exec",

        {

          method: "POST",

          headers: {

            "Content-Type": "application/x-www-form-urlencoded",

          },

          body: new URLSearchParams({

            action: "getTransactionTypesFromMaster",

            sheetName: "Master",

          }),

        },

      )

      const result = await response.json()

      console.log("Transaction types response:", result)

      if (result.success && result.transactionTypes) {

        setTransactionTypes(result.transactionTypes)

        console.log("Transaction types set:", result.transactionTypes.length)

      } else {

        console.error("Failed to fetch transaction types:", result)

      }

    } catch (error) {

      console.error("Error fetching transaction types from master:", error)

    }

  }

  const fetchProjectsFromMaster = async () => {

    try {

      console.log("Fetching projects...")

      const response = await fetch(

        "https://script.google.com/macros/s/AKfycbxxHogp4YBZ1VClZCdkEPyAddFUK6Y2grFmMrJHcqfIwufVG5ar9FACeVe_YIBb0PY9/exec",

        {

          method: "POST",

          headers: {

            "Content-Type": "application/x-www-form-urlencoded",

          },

          body: new URLSearchParams({

            action: "getProjectsFromMaster",

            sheetName: "Master",

          }),

        },

      )

      const result = await response.json()

      console.log("Projects response:", result)

      if (result.success && result.projects) {

        setProjects(result.projects)

        console.log("Projects set:", result.projects.length)

      } else {

        console.error("Failed to fetch projects:", result)

      }

    } catch (error) {

      console.error("Error fetching projects from master:", error)

    }

  }

  const fetchPaymentFromCompaniesFromMaster = async () => {

    try {

      console.log("Fetching payment from companies...")

      const response = await fetch(

        "https://script.google.com/macros/s/AKfycbxxHogp4YBZ1VClZCdkEPyAddFUK6Y2grFmMrJHcqfIwufVG5ar9FACeVe_YIBb0PY9/exec",

        {

          method: "POST",

          headers: {

            "Content-Type": "application/x-www-form-urlencoded",

          },

          body: new URLSearchParams({

            action: "getPaymentFromCompaniesFromMaster",

            sheetName: "Master",

          }),

        },

      )

      const result = await response.json()

      console.log("Payment from companies response:", result)

      if (result.success && result.paymentFromCompanies) {

        setPaymentFromCompanies(result.paymentFromCompanies)

        console.log("Payment from companies set:", result.paymentFromCompanies.length)

      } else {

        console.error("Failed to fetch payment from companies:", result)

      }

    } catch (error) {

      console.error("Error fetching payment from companies from master:", error)

    }

  }

  const getNextVoucherNumber = async () => {

    try {

      const response = await fetch(

        "https://script.google.com/macros/s/AKfycbxxHogp4YBZ1VClZCdkEPyAddFUK6Y2grFmMrJHcqfIwufVG5ar9FACeVe_YIBb0PY9/exec",

        {

          method: "POST",

          headers: {

            "Content-Type": "application/x-www-form-urlencoded",

          },

          body: new URLSearchParams({

            action: "getNextVoucherNumber",

            sheetName: "History",

          }),

        },

      )

      const result = await response.json()

      if (result.success) {

        return result.nextVoucherNumber

      } else {

        return "TNS-01"

      }

    } catch (error) {

      console.error("Error getting next voucher number:", error)

      return "TNS-01"

    }

  }

  useEffect(() => {

    const initializeVoucher = async () => {

      const isLoggedIn = localStorage.getItem("tns_logged_in")

      const storedUsername = localStorage.getItem("tns_username")

      const storedUserRole = localStorage.getItem("tns_user_role")

      if (isLoggedIn !== "true") {

        router.push("/")

      } else {

        setUsername(storedUsername || "User")

        setUserRole(storedUserRole || "user")

        setIsLoadingDropdowns(true)

        try {

          // Get next voucher number from Google Sheets

          const nextVoucher = await getNextVoucherNumber()

          setNextVoucherNumber(nextVoucher)

          // Fetch all dropdown data from master sheet with proper sequencing

          console.log("Starting to fetch all dropdown data...")

          await Promise.all([

            fetchBankAccountsFromMaster(),

            fetchPaymentFromCompaniesFromMaster(),

            fetchCompanyNamesFromMaster(),

            fetchTransactionTypesFromMaster(),

            fetchProjectsFromMaster(),

          ])

          console.log("All dropdown data fetched successfully")

          const currentDate = new Date().toISOString().split("T")[0]

          setVoucherData((prev) => ({

            ...prev,

            id: "voucher_" + Date.now(),

            voucherNo: nextVoucher,

            dateOfPayment: currentDate,

            bankAcFrom: "",

            entryDoneBy: storedUsername || "User", // Auto-populate with logged-in user

          }))

        } catch (error) {

          console.error("Error fetching dropdown data:", error)

        } finally {

          setIsLoadingDropdowns(false)

        }

      }

    }

    initializeVoucher()

  }, [router])

  const handleLogout = () => {

    localStorage.removeItem("tns_logged_in")

    localStorage.removeItem("tns_username")

    localStorage.removeItem("tns_user_role")

    localStorage.removeItem("tns_user_id")

    router.push("/")

  }

  const handleInputChange = (field: keyof VoucherData, value: string) => {

    setVoucherData((prev) => ({

      ...prev,

      [field]: value,

    }))

  }

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

  const handleAmountChange = (value: string) => {

    handleInputChange("amount", value)

    const numValue = Number.parseFloat(value)

    if (!isNaN(numValue) && numValue > 0) {

      const words = convertNumberToWords(numValue) + " Rupees Only"

      handleInputChange("amountInWords", words)

    } else {

      handleInputChange("amountInWords", "")

    }

  }

  const generatePDFBlob = (voucherData: { submittedAt?: string; id?: string; voucherNo: any; dateOfPayment: any; bankAcFrom: any; companyName: any; bankAccount?: string; transactionType: any; purposeOfPayment: any; project: any; beneficiaryName: any; poNumber: any; beneficiaryAccountName: any; beneficiaryAccountNumber: any; beneficiaryBankName: any; beneficiaryBankIFSC: any; amount: any; amountInWords: any; particulars: any; entryDoneBy: any; checkedBy: any; approvedBy: any; paymentFromCompany?: any }) => {

    return new Promise((resolve, reject) => {

      try {

        // Portrait orientation for voucher

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

          }

        }

        const formatCurrency = (value: string) => {

          const numValue = parseFloat(value) || 0

          return "Rs. " + numValue.toLocaleString("en-US", {

            minimumFractionDigits: 2,

            maximumFractionDigits: 2

          })

        }

        const formatDate = (dateString: string | number | Date) => {

          return new Date(dateString).toLocaleDateString("en-IN", {

            day: "2-digit",

            month: "2-digit",

            year: "numeric",

          })

        }

        // Main container border

        doc.setDrawColor(...(colors.border.primary as [number, number, number]))

        doc.setLineWidth(2)

        doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin)

        // Header Section

        doc.setFillColor(...(colors.background.blue as [number, number, number]))

        doc.setDrawColor(...(colors.border.primary as [number, number, number]))

        doc.setLineWidth(1)

        doc.rect(margin + 3, currentY, pageWidth - 2 * margin - 6, 22, "FD")

        // Company Name

        doc.setFont("helvetica", "bold")

        doc.setFontSize(18)

        doc.setTextColor(...colors.primary)

        doc.text(voucherData.companyName || "COMPANY NAME", pageWidth / 2, currentY + 8, { align: "center" })

        // Voucher Title

        doc.setFontSize(12)

        doc.setTextColor(...colors.secondary)

        doc.text("BANK PAYMENT VOUCHER", pageWidth / 2, currentY + 16, { align: "center" })

        currentY += 28

        // Voucher Information Table - Better structured

        const voucherInfoData = [

          // Row 1

          [

            "VOUCHER NO:",

            voucherData.voucherNo || "",

            "DATE OF PAYMENT:",

            formatDate(voucherData.dateOfPayment),

            "TRANSACTION TYPE:",

            voucherData.transactionType || ""

          ],

          // Row 2

          [

            "BANK A/C FROM:",

            voucherData.bankAcFrom || "",

            "PURPOSE:",

            voucherData.purposeOfPayment || "",

            // "PAYMENT FROM COMPANY:",

            // voucherData.paymentFromCompany || ""

          ],

          // Row 3

          [

            "PROJECT:",

            { content: voucherData.project || "", styles: { fontStyle: 'bold' } },

            "BENEFICIARY NAME (PAYER):",

            { content: voucherData.beneficiaryName || "", colSpan: 3, styles: { fontStyle: 'bold' } }

          ],

          // Row 4

          [

            "PO NUMBER:",

            voucherData.poNumber || "N/A",

            "BENEFICIARY A/C NAME:",

            voucherData.beneficiaryAccountName || "",

            "BENEFICIARY A/C NUMBER:",

            voucherData.beneficiaryAccountNumber || ""

          ],

          // Row 5

          [

            "BENEFICIARY BANK NAME:",

            voucherData.beneficiaryBankName || "",

            // "BENEFICIARY BANK IFSC:",

            // { content: voucherData.beneficiaryBankIFSC || "", colSpan: 3 }

          ]

        ]

        autoTable(doc, {

          startY: currentY,

          body: voucherInfoData,

          margin: { left: margin + 3, right: margin + 3 },

          tableWidth: pageWidth - 2 * margin - 6,

          styles: {

            cellPadding: 3,

            lineColor: colors.border.primary,

            lineWidth: 0.5,

            textColor: colors.text.primary,

            font: 'helvetica',

            fontSize: 9,

            overflow: 'linebreak'

          },

          columnStyles: {

            0: {

              cellWidth: 30,

              fillColor: colors.background.light,

              fontStyle: 'bold',

              fontSize: 8,

              textColor: colors.primary

            },

            1: { cellWidth: 30 },

            2: {

              cellWidth: 30,

              fillColor: colors.background.light,

              fontStyle: 'bold',

              fontSize: 8,

              textColor: colors.primary

            },

            3: { cellWidth: 30 },

            4: {

              cellWidth: 30,

              fillColor: colors.background.light,

              fontStyle: 'bold',

              fontSize: 8,

              textColor: colors.primary

            },

            5: { cellWidth: 30 }

          },

          didDrawPage: (data) => {

            currentY = data.cursor.y

          }

        })

        currentY += 8

        // Particulars and Amount Section - Fixed Layout

        const particularsAmountData = [

          // Header row

          [

            {

              content: "PARTICULARS:",

              styles: {

                fontStyle: 'bold',

                fontSize: 10,

                fillColor: colors.background.light,

                textColor: colors.primary,

                halign: 'center'

              }

            },

            {

              content: "AMOUNT:",

              styles: {

                fontStyle: 'bold',

                fontSize: 10,

                fillColor: colors.background.yellow,

                textColor: colors.primary,

                halign: 'center'

              }

            }

          ],

          // Content row

          [

            {

              content: voucherData.particulars || "",

              styles: {

                fontSize: 10,

                minCellHeight: 20,

                valign: 'top',

                cellPadding: 5

              }

            },

            {

              content: "Rs. " + (parseFloat(voucherData.amount || 0)).toLocaleString("en-US", {

                minimumFractionDigits: 2,

                maximumFractionDigits: 2

              }),

              styles: {

                fontSize: 12,

                fontStyle: 'bold',

                fillColor: colors.background.amount,

                textColor: colors.success,

                halign: 'center',

                valign: 'middle',

                minCellHeight: 20,

                cellPadding: 6

              }

            }

          ]

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

            font: 'helvetica',

            overflow: 'linebreak'

          },

          columnStyles: {

            0: { cellWidth: (pageWidth - 2 * margin - 6) * 0.7 },

            1: { cellWidth: (pageWidth - 2 * margin - 6) * 0.3 }

          },

          didDrawPage: (data) => {

            currentY = data.cursor.y

          }

        })

        currentY += 3

        // Amount in Words Section

        const amountWordsData = [

          [

            {

              content: `AMOUNT IN WORDS: ${voucherData.amountInWords || ""}`,

              styles: {

                fontSize: 10,

                fontStyle: 'bold',

                fillColor: colors.background.blue,

                textColor: colors.primary,

                cellPadding: 6

              }

            }

          ]

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

            font: 'helvetica'

          },

          didDrawPage: (data) => {

            currentY = data.cursor.y

          }

        })

        currentY += 15

        // Signature Section - Properly aligned

        const signatureData = [

          // Header row

          [

            {

              content: "ENTRY DONE BY",

              styles: {

                fontStyle: 'bold',

                fontSize: 10,

                fillColor: colors.background.light,

                textColor: colors.primary,

                halign: 'center',

                cellPadding: 4

              }

            },

            {

              content: "CHECKED BY",

              styles: {

                fontStyle: 'bold',

                fontSize: 10,

                fillColor: colors.background.light,

                textColor: colors.primary,

                halign: 'center',

                cellPadding: 4

              }

            },

            {

              content: "APPROVED BY",

              styles: {

                fontStyle: 'bold',

                fontSize: 10,

                fillColor: colors.background.light,

                textColor: colors.primary,

                halign: 'center',

                cellPadding: 4

              }

            }

          ],

          // Empty signature space

          [

            { content: "", styles: { minCellHeight: 15 } },

            { content: "", styles: { minCellHeight: 15 } },

            { content: "", styles: { minCellHeight: 15 } }

          ],

          // Names row

          [

            {

              content: voucherData.entryDoneBy || "",

              styles: {

                fontStyle: 'bold',

                fontSize: 9,

                halign: 'center',

                fillColor: colors.background.light,

                textColor: colors.text.primary

              }

            },

            {

              content: voucherData.checkedBy || "",

              styles: {

                fontStyle: 'bold',

                fontSize: 9,

                halign: 'center',

                fillColor: colors.background.light,

                textColor: colors.text.primary

              }

            },

            {

              content: voucherData.approvedBy || "",

              styles: {

                fontStyle: 'bold',

                fontSize: 9,

                halign: 'center',

                fillColor: colors.background.light,

                textColor: colors.text.primary

              }

            }

          ]

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

            font: 'helvetica'

          },

          columnStyles: {

            0: { cellWidth: (pageWidth - 2 * margin - 6) / 3 },

            1: { cellWidth: (pageWidth - 2 * margin - 6) / 3 },

            2: { cellWidth: (pageWidth - 2 * margin - 6) / 3 }

          },

          didDrawCell: function (data) {

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

          }

        })

        currentY += 15

        // Footer

        doc.setFillColor(...colors.background.light)

        doc.setDrawColor(...colors.border.secondary)

        doc.setLineWidth(0.3)

        doc.rect(margin + 3, currentY, pageWidth - 2 * margin - 6, 12, "FD")

        doc.setFont("helvetica", "bold")

        doc.setFontSize(8)

        doc.setTextColor(...colors.primary)

        doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, pageWidth / 2, currentY + 5, { align: "center" })

        doc.setFont("helvetica", "normal")

        doc.setFontSize(7)

        doc.setTextColor(...colors.text.secondary)

        doc.text("This is a computer generated voucher", pageWidth / 2, currentY + 9, { align: "center" })

        // Return base64 string

        const base64Data = doc.output("datauristring").split(",")[1]

        resolve(base64Data)

      } catch (error) {

        reject(error)

      }

    })

  }

  const handleSubmit = async (e) => {

    e.preventDefault()

    setIsSubmitting(true) // Start loading

    try {

      const currentTimestamp = new Date().toISOString()

      const submissionData = {

        ...voucherData,

        submittedAt: currentTimestamp,

      }

      // Save to localStorage (keep existing functionality)

      const existingVouchers = JSON.parse(localStorage.getItem("tns_vouchers") || "[]")

      existingVouchers.push(submissionData)

      localStorage.setItem("tns_vouchers", JSON.stringify(existingVouchers))

      // Generate PDF

      const pdfBase64 = await generatePDFBlob(submissionData)

      const fileName = `Voucher_${submissionData.voucherNo}_${new Date().toISOString().split("T")[0]}.pdf`

      // Prepare data for Google Sheets - Added username to column X

      const sheetData = [

        currentTimestamp,

        submissionData.voucherNo,

        submissionData.bankAcFrom,

        submissionData.companyName,

        submissionData.dateOfPayment,

        submissionData.purposeOfPayment,

        // submissionData.paymentFromCompany,

        submissionData.transactionType,

        submissionData.project,

        submissionData.beneficiaryName,

        submissionData.poNumber,

        submissionData.beneficiaryAccountName,

        submissionData.beneficiaryAccountNumber,

        submissionData.beneficiaryBankName,

        submissionData.beneficiaryBankIFSC,

        submissionData.particulars,

        submissionData.amount,

        submissionData.amountInWords,

        submissionData.entryDoneBy,

        submissionData.checkedBy,

        submissionData.approvedBy,

        "",

        "",

        "",

        username, // Column X (Name) - Currently logged-in username

      ]

      // Submit to Google Sheets with PDF upload

      const response = await fetch(

        "https://script.google.com/macros/s/AKfycbxxHogp4YBZ1VClZCdkEPyAddFUK6Y2grFmMrJHcqfIwufVG5ar9FACeVe_YIBb0PY9/exec",

        {

          method: "POST",

          headers: {

            "Content-Type": "application/x-www-form-urlencoded",

          },

          body: new URLSearchParams({

            sheetName: "History",

            action: "insertWithPDF",

            rowData: JSON.stringify(sheetData),

            pdfData: pdfBase64,

            fileName: fileName,

            folderId: "1fnjCwWiu16-RBPNqjUGkKRVrf3o3Hwoo",

          }),

        },

      )

      const result = await response.json()

      if (result.success) {

        alert(`Voucher submitted successfully! PDF uploaded to Google Drive: ${result.pdfUrl}`)

        // Get next voucher number for the new form

        const nextVoucher = await getNextVoucherNumber()

        setNextVoucherNumber(nextVoucher)

        // Reset form for new voucher

        setVoucherData((prev) => ({

          ...prev,

          id: "voucher_" + Date.now(),

          voucherNo: nextVoucher,

          bankAcFrom: "",

          companyName: "",

          transactionType: "",

          purposeOfPayment: "",

          // paymentFromCompany: "",

          project: "",

          beneficiaryName: "",

          poNumber: "",

          beneficiaryAccountName: "",

          beneficiaryAccountNumber: "",

          beneficiaryBankName: "",

          beneficiaryBankIFSC: "",

          amount: "",

          amountInWords: "",

          particulars: "",

          entryDoneBy: username, // Keep the logged-in user for the next voucher

          checkedBy: "",

          approvedBy: "",

        }))

      } else {

        throw new Error(result.error || "Failed to submit to Google Sheets")

      }

    } catch (error) {

      console.error("Error submitting voucher:", error)

      alert("Error submitting voucher: " + error.message)

    } finally {

      setIsSubmitting(false) // Stop loading

    }

  }

  return (

    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50">

      {/* Header */}

      <div className="bg-white shadow-sm border-b">

        <div className="container mx-auto px-4 py-4">

          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">

            <div className="flex items-center space-x-3">

              <div className="bg-blue-600 p-2 rounded-lg">

                <Building2 className="h-6 w-6 text-white" />

              </div>

              <div>

                <h1 className="text-xl font-bold text-gray-800">TNS Payment System</h1>

                <p className="text-sm text-gray-600">

                  Welcome, {username} ({userRole})

                </p>

              </div>

            </div>

            <div className="flex flex-wrap justify-center gap-2">

              {userRole === "admin" && (

                <Button

                  onClick={() => router.push("/dashboard")}

                  variant="outline"

                  className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 text-sm md:text-base"

                >

                  <BarChart3 className="mr-2 h-4 w-4" />

                  Dashboard

                </Button>

              )}

              <Button

                onClick={() => router.push("/history")}

                variant="outline"

                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 text-sm md:text-base"

              >

                <History className="mr-2 h-4 w-4" />

                History

              </Button>

              <Button

                onClick={handleLogout}

                variant="outline"

                className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 text-sm md:text-base"

              >

                <LogOut className="mr-2 h-4 w-4" />

                Logout

              </Button>

            </div>

          </div>

        </div>

      </div>

      {/* Main Content */}

      <div className="container mx-auto px-2 sm:px-4 py-4 md:py-8 max-w-4xl">

        <form onSubmit={handleSubmit}>

          <Card className="shadow-xl border-0 bg-white">

            {/* Voucher Header */}

            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">

              <div className="text-center space-y-2">

                <CardTitle className="text-xl md:text-2xl font-bold">{voucherData.companyName || "SELECT COMPANY"}</CardTitle>

                <p className="text-blue-100 text-base md:text-lg font-semibold">BANK PAYMENT VOUCHER</p>

                <div className="flex flex-col sm:flex-row justify-between items-center mt-2 sm:mt-4 bg-white/10 rounded-lg p-2 sm:p-3 space-y-2 sm:space-y-0">

                  <div>

                    <p className="text-xs sm:text-sm text-blue-100">Voucher No.</p>

                    <p className="text-base sm:text-lg font-bold">{voucherData.voucherNo}</p>

                  </div>

                  <div>

                    <p className="text-xs sm:text-sm text-blue-100">Date</p>

                    <p className="text-base sm:text-lg font-bold">

                      {new Date(voucherData.dateOfPayment).toLocaleDateString("en-IN")}

                    </p>

                  </div>

                  <div>

                    <p className="text-xs sm:text-sm text-blue-100">Type</p>

                    <p className="text-base sm:text-lg font-bold">{voucherData.transactionType}</p>

                  </div>

                </div>

              </div>

            </CardHeader>

            {isLoadingDropdowns && (

              <div className="p-4 bg-blue-50 text-blue-700 text-center">Loading dropdown data...</div>

            )}

            {!isLoadingDropdowns && (

              <div className="p-2 bg-gray-50 text-xs text-gray-600 text-center">

                Loaded: {bankAccounts.length} banks, {companyNames.length} companies, {transactionTypes.length}{" "}

                transaction types, {projects.length} projects,

                {/* {paymentFromCompanies.length} payment companies */}

              </div>

            )}

            <CardContent className="p-2 sm:p-4 md:p-6 lg:p-8">

              {/* Traditional Voucher Layout */}

              <div className="bg-white border-2 border-gray-800 p-2 sm:p-4 md:p-6">

                {/* Company Header */}

                <div className="text-center mb-4 sm:mb-6 border-b-2 border-gray-800 pb-2 sm:pb-4">

                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{voucherData.companyName || "SELECT COMPANY"}</h1>

                </div>

                {/* Main Voucher Grid */}

                <div className="space-y-2 sm:space-y-4">

                  {/* Row 1: Bank AC From, Company Name, Date */}

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 border-b border-gray-400 pb-2">

                    <div className="sm:col-span-4">

                      <Label className="text-xs font-bold text-gray-700 uppercase">Company Name</Label>

                      <Select

                        value={voucherData.companyName}

                        onValueChange={handleCompanySelection}

                      >

                        <SelectTrigger className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600">

                          <SelectValue placeholder="Select Company" />

                        </SelectTrigger>

                        <SelectContent>

                          {companyNames.map((company, index) => (

                            <SelectItem key={`company-name-${index}-${company.replace(/\s+/g, "-")}`} value={company}>

                              {company}

                            </SelectItem>

                          ))}

                        </SelectContent>

                      </Select>

                    </div>

                    <div className="sm:col-span-4">

                      <Label className="text-xs font-bold text-gray-700 uppercase">BANK AC FROM</Label>

                      <Select

                        value={voucherData.bankAcFrom}

                        onValueChange={(value) => {

                          console.log("Bank account selected:", value)

                          handleInputChange("bankAcFrom", value)

                        }}

                      >

                        <SelectTrigger className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600">

                          <SelectValue placeholder={`Select Bank Account (${filteredBankAccounts.length} available)`} />

                        </SelectTrigger>

                        <SelectContent>

                          {(filteredBankAccounts.length > 0 ? filteredBankAccounts : bankAccounts).map((account, index) => (

                            <SelectItem key={`bank-account-${index}-${account}`} value={account}>

                              {account}

                            </SelectItem>

                          ))}

                        </SelectContent>

                      </Select>

                    </div>

                    <div className="sm:col-span-4">

                      <Label className="text-xs font-bold text-gray-700 uppercase">DATE</Label>

                      <Input

                        type="date"

                        value={voucherData.dateOfPayment}

                        onChange={(e) => handleInputChange("dateOfPayment", e.target.value)}

                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"

                        required

                      />

                    </div>

                  </div>

                  {/* Row 2: Purpose, Payment From Company, Transaction Type */}

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 border-b border-gray-400 pb-2">

                    <div className="sm:col-span-4">

                      <Label className="text-xs font-bold text-gray-700 uppercase">PURPOSE</Label>

                      <Input

                        value={voucherData.purposeOfPayment}

                        onChange={(e) => handleInputChange("purposeOfPayment", e.target.value)}

                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600 text-center font-bold"

                        placeholder=""

                        required

                      />

                    </div>

                    {/* <div className="sm:col-span-4">

                      <Label className="text-xs font-bold text-gray-700 uppercase">PAYMENT FROM COMPANY</Label>

                      <Select

                        value={voucherData.paymentFromCompany}

                        onValueChange={(value) => handleInputChange("paymentFromCompany", value)}

                      >

                        <SelectTrigger className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600">

                          <SelectValue placeholder="Select Payment From Company" />

                        </SelectTrigger>

                        <SelectContent>

                          {paymentFromCompanies.map((company, index) => (

                            <SelectItem key={`payment-from-${index}-${company.replace(/\s+/g, "-")}`} value={company}>

                              {company}

                            </SelectItem>

                          ))}

                        </SelectContent>

                      </Select>

                    </div> */}

                    <div className="sm:col-span-4">

                      <Label className="text-xs font-bold text-gray-700 uppercase">TRANSACTION TYPE</Label>

                      <Select

                        value={voucherData.transactionType}

                        onValueChange={(value) => handleInputChange("transactionType", value)}

                      >

                        <SelectTrigger className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600">

                          <SelectValue placeholder="Select Transaction Type" />

                        </SelectTrigger>

                        <SelectContent>

                          {transactionTypes.map((type, index) => (

                            <SelectItem key={`transaction-type-${index}-${type.replace(/\s+/g, "-")}`} value={type}>

                              {type}

                            </SelectItem>

                          ))}

                        </SelectContent>

                      </Select>

                    </div>

                  </div>

                  {/* Row 3: Voucher No and Project */}

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 border-b border-gray-400 pb-2">

                    <div className="sm:col-span-6">

                      <Label className="text-xs font-bold text-gray-700 uppercase">VOUCHER NO.</Label>

                      <Input

                        value={voucherData.voucherNo}

                        onChange={(e) => handleInputChange("voucherNo", e.target.value)}

                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"

                        required

                        readOnly

                      />

                    </div>

                    <div className="sm:col-span-6">

                      <Label className="text-xs font-bold text-gray-700 uppercase">PROJECT</Label>

                      <Select

                        value={voucherData.project}

                        onValueChange={(value) => handleInputChange("project", value)}

                      >

                        <SelectTrigger className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600 text-center font-bold">

                          <SelectValue placeholder="Select Project" />

                        </SelectTrigger>

                        <SelectContent>

                          {projects.map((project, index) => (

                            <SelectItem key={`project-${index}-${project.replace(/\s+/g, "-")}`} value={project}>

                              {project}

                            </SelectItem>

                          ))}

                        </SelectContent>

                      </Select>

                    </div>

                  </div>

                  {/* Row 4: Beneficiary Name, PO Number */}

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 border-b border-gray-400 pb-2">

                    <div className="sm:col-span-8">

                      <Label className="text-xs font-bold text-gray-700 uppercase">BENEFICIARY NAME (PAYER)</Label>

                      <Input

                        value={voucherData.beneficiaryName}

                        onChange={(e) => handleInputChange("beneficiaryName", e.target.value)}

                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"

                        placeholder=""

                        required

                      />

                    </div>

                    <div className="sm:col-span-4">

                      <Label className="text-xs font-bold text-gray-700 uppercase">PO. NUMBER</Label>

                      <Input

                        value={voucherData.poNumber}

                        onChange={(e) => handleInputChange("poNumber", e.target.value)}

                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"

                      />

                    </div>

                  </div>

                  {/* Row 5: Beneficiary Account Details */}

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 border-b border-gray-400 pb-2">

                    <div className="sm:col-span-6">

                      <Label className="text-xs font-bold text-gray-700 uppercase">

                        (NAME OF AC HOLDER) BENEFICIARY A/C NAME

                      </Label>

                      <Input

                        value={voucherData.beneficiaryAccountName}

                        onChange={(e) => handleInputChange("beneficiaryAccountName", e.target.value)}

                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"

                        placeholder=""

                        required

                      />

                    </div>

                    <div className="sm:col-span-6">

                      <Label className="text-xs font-bold text-gray-700 uppercase">BENEFICIARY A/C NUMBER</Label>

                      <Input

                        value={voucherData.beneficiaryAccountNumber}

                        onChange={(e) => handleInputChange("beneficiaryAccountNumber", e.target.value)}

                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"

                        placeholder=""

                        required

                      />

                    </div>

                  </div>

                  {/* Row 6: Bank Name and IFSC */}

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 border-b border-gray-400 pb-2">

                    <div className="sm:col-span-6">

                      <Label className="text-xs font-bold text-gray-700 uppercase">BENEFICIARY BANK NAME</Label>

                      <Input

                        value={voucherData.beneficiaryBankName}

                        onChange={(e) => handleInputChange("beneficiaryBankName", e.target.value)}

                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"

                        placeholder=""

                        required

                      />

                    </div>

                    <div className="sm:col-span-6">

                      <Label className="text-xs font-bold text-gray-700 uppercase">BENEFICIARY BANK IFSC</Label>

                      <Input

                        value={voucherData.beneficiaryBankIFSC}

                        onChange={(e) => handleInputChange("beneficiaryBankIFSC", e.target.value)}

                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"

                        placeholder=""

                        required

                      />

                    </div>

                  </div>

                  {/* Row 7: Particulars and Amount */}

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 border-b border-gray-400 pb-2">

                    <div className="sm:col-span-8">

                      <Label className="text-xs font-bold text-gray-700 uppercase">PARTICULARS</Label>

                      <Textarea

                        value={voucherData.particulars}

                        onChange={(e) => handleInputChange("particulars", e.target.value)}

                        className="border-0 border-b border-gray-400 rounded-none px-1 py-1 min-h-[60px] text-sm focus:border-gray-600 resize-none"

                        placeholder=""

                        required

                      />

                    </div>

                    <div className="sm:col-span-2">

                      <Label className="text-xs font-bold text-gray-700 uppercase">AMOUNT</Label>

                      <Input

                        type="number"

                        step="0.01"

                        value={voucherData.amount}

                        onChange={(e) => handleAmountChange(e.target.value)}

                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600 text-right font-bold"

                        placeholder=""

                        required

                      />

                    </div>

                    <div className="sm:col-span-2">

                      <Label className="text-xs font-bold text-gray-700 uppercase">TOTAL</Label>

                      <div className="border-0 border-b border-gray-400 px-1 py-0 h-8 text-sm font-bold text-right flex items-center">

                        ₹{voucherData.amount ? Number.parseFloat(voucherData.amount).toLocaleString("en-IN") : "0"}

                      </div>

                    </div>

                  </div>

                  {/* Row 8: Amount in Words */}

                  <div className="border-b border-gray-400 pb-2">

                    <Label className="text-xs font-bold text-gray-700 uppercase">AMOUNT IN WORDS :</Label>

                    <Input

                      value={voucherData.amountInWords}

                      onChange={(e) => handleInputChange("amountInWords", e.target.value)}

                      className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"

                      placeholder=""

                      required

                    />

                  </div>

                  {/* Row 9: Approval Signatures */}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 pt-4">

                    <div className="text-center">

                      <Label className="text-xs font-bold text-gray-700 uppercase block mb-2">ENTRY DONE BY</Label>

                      <Input
                        value={voucherData.entryDoneBy}
                        onChange={(e) => handleInputChange("entryDoneBy", e.target.value)}
                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600 text-center"
                        required
                        readOnly
                      />


                    </div>

                    <div className="text-center">

                      <Label className="text-xs font-bold text-gray-700 uppercase block mb-2">CHECKED BY</Label>

                      <Input

                        value={voucherData.checkedBy}

                        onChange={(e) => handleInputChange("checkedBy", e.target.value)}

                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600 text-center"

                        required

                      />

                    </div>

                    <div className="text-center">

                      <Label className="text-xs font-bold text-gray-700 uppercase block mb-2">APPROVED BY</Label>

                      <Input

                        value={voucherData.approvedBy}

                        onChange={(e) => handleInputChange("approvedBy", e.target.value)}

                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600 text-center"

                        required

                      />

                    </div>

                  </div>

                </div>

                {/* Submit Button */}

                <div className="flex justify-center pt-4 sm:pt-8 mt-4 sm:mt-8 border-t-2 border-gray-800">

                  <Button

                    type="submit"

                    disabled={isSubmitting}

                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 sm:px-12 py-2 sm:py-3 text-base sm:text-lg font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"

                  >

                    {isSubmitting ? (

                      <>

                        <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />

                        Submitting...

                      </>

                    ) : (

                      <>

                        <Save className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />

                        Submit Voucher

                      </>

                    )}

                  </Button>

                </div>

              </div>

            </CardContent>

          </Card>

        </form>

      </div>

    </div>

  )

}
