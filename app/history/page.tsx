"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Download, Search, FileText, Building2, Eye, Trash2, BarChart3, Filter, X } from "lucide-react"

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

export default function HistoryPage() {
  const router = useRouter()
  const [vouchers, setVouchers] = useState<VoucherData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherData | null>(null)
  const [userRole, setUserRole] = useState("")
  const [username, setUsername] = useState("")

  // Filter states
  const [selectedCompany, setSelectedCompany] = useState("all")
  const [selectedProject, setSelectedProject] = useState("all")
  const [selectedPurpose, setSelectedPurpose] = useState("all")
  const [selectedTransactionType, setSelectedTransactionType] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [amountFrom, setAmountFrom] = useState("")
  const [amountTo, setAmountTo] = useState("")

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("tns_logged_in")
    const storedUserRole = localStorage.getItem("tns_user_role")
    const storedUsername = localStorage.getItem("tns_username")

    if (isLoggedIn !== "true") {
      router.push("/")
    } else {
      setUserRole(storedUserRole || "user")
      setUsername(storedUsername || "User")
      // Load vouchers from localStorage
      const storedVouchers = JSON.parse(localStorage.getItem("tns_vouchers") || "[]")
      setVouchers(storedVouchers.reverse()) // Show newest first
    }
  }, [router])

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
    // Text search
    const matchesSearch =
      voucher.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.purposeOfPayment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.companyName.toLowerCase().includes(searchTerm.toLowerCase())

    // Company filter
    const matchesCompany = selectedCompany === "all" || voucher.companyName === selectedCompany

    // Project filter
    const matchesProject = selectedProject === "all" || voucher.project === selectedProject

    // Purpose filter
    const matchesPurpose = selectedPurpose === "all" || voucher.purposeOfPayment === selectedPurpose

    // Transaction type filter
    const matchesTransactionType =
      selectedTransactionType === "all" || voucher.transactionType === selectedTransactionType

    // Date range filter
    const voucherDate = new Date(voucher.dateOfPayment)
    const matchesDateFrom = !dateFrom || voucherDate >= new Date(dateFrom)
    const matchesDateTo = !dateTo || voucherDate <= new Date(dateTo)

    // Amount range filter
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
    // Dynamic import of jsPDF
    const { jsPDF } = await import("jspdf")

    const doc = new jsPDF()

    // Set font
    doc.setFont("helvetica")

    // Company Header
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text(voucher.companyName || "COMPANY NAME", 105, 20, { align: "center" })

    // Draw border around the voucher
    doc.rect(15, 30, 180, 220)

    // Row 1: Bank AC From, Date, Purpose
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.text("BANK AC FROM", 20, 45)
    doc.text("DATE OF PAYMENT/PROCESS", 75, 45)
    doc.text("PURPOSE OF PAYMENT", 140, 45)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(voucher.bankAccount, 20, 52)
    doc.text(new Date(voucher.dateOfPayment).toLocaleDateString("en-IN"), 75, 52)
    doc.text(voucher.purposeOfPayment, 140, 52)

    // Row 2: Transaction Type, Voucher No, Project
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.text("TRANSACTION TYPE", 20, 65)
    doc.text("VOUCHER NO.", 75, 65)
    doc.text("PROJECT", 140, 65)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(voucher.transactionType, 20, 72)
    doc.text(voucher.voucherNo, 75, 72)
    doc.text(voucher.project, 140, 72)

    // Row 3: Beneficiary Name, PO Number
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.text("BENEFICIARY NAME (PAID TO)", 20, 85)
    doc.text("PO. NUMBER", 140, 85)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(voucher.beneficiaryName, 20, 92)
    doc.text(voucher.poNumber || "", 140, 92)

    // Row 4: Beneficiary Account Details
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.text("(NAME OF AC HOLDER) BENEFICIARY A/C NAME", 20, 105)
    doc.text("BENEFICIARY A/C NUMBER", 120, 105)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(voucher.beneficiaryAccountName, 20, 112)
    doc.text(voucher.beneficiaryAccountNumber, 120, 112)

    // Row 5: Bank Name and IFSC
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.text("BENEFICIARY BANK NAME", 20, 125)
    doc.text("BENEFICIARY BANK IFSC", 120, 125)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(voucher.beneficiaryBankName, 20, 132)
    doc.text(voucher.beneficiaryBankIFSC, 120, 132)

    // Row 6: Particulars and Amount
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.text("PARTICULARS", 20, 145)
    doc.text("AMOUNT", 140, 145)
    doc.text("TOTAL", 170, 145)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    // Split particulars into multiple lines if needed
    const particularsLines = doc.splitTextToSize(voucher.particulars, 110)
    doc.text(particularsLines, 20, 152)

    doc.text(voucher.amount, 140, 152)
    doc.text(`₹${Number.parseFloat(voucher.amount).toLocaleString("en-IN")}`, 170, 152)

    // Row 7: Amount in Words
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.text("AMOUNT IN WORDS :", 20, 175)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    const amountWordsLines = doc.splitTextToSize(voucher.amountInWords, 170)
    doc.text(amountWordsLines, 20, 182)

    // Row 8: Approval Signatures
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.text("ENTRY DONE BY", 30, 210)
    doc.text("CHECKED BY", 90, 210)
    doc.text("APPROVED BY", 150, 210)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(voucher.entryDoneBy, 30, 220)
    doc.text(voucher.checkedBy, 90, 220)
    doc.text(voucher.approvedBy, 150, 220)

    // Draw lines for signatures
    doc.line(20, 225, 70, 225) // Entry Done By line
    doc.line(80, 225, 130, 225) // Checked By line
    doc.line(140, 225, 190, 225) // Approved By line

    // Footer
    doc.setFontSize(8)
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 20, 240)
    doc.text(`Submitted: ${new Date(voucher.submittedAt).toLocaleString("en-IN")}`, 120, 240)

    // Save the PDF
    doc.save(`Payment_Voucher_${voucher.voucherNo}.pdf`)
  }

  const deleteVoucher = (voucherId: string) => {
    if (confirm("Are you sure you want to delete this voucher?")) {
      const updatedVouchers = vouchers.filter((voucher) => voucher.id !== voucherId)
      setVouchers(updatedVouchers)
      localStorage.setItem("tns_vouchers", JSON.stringify(updatedVouchers.reverse()))
    }
  }

  const getTotalAmount = () => {
    return filteredVouchers.reduce((sum, voucher) => sum + (Number.parseFloat(voucher.amount) || 0), 0)
  }

  const handleLogout = () => {
    localStorage.removeItem("tns_logged_in")
    localStorage.removeItem("tns_username")
    localStorage.removeItem("tns_user_role")
    localStorage.removeItem("tns_user_id")
    router.push("/")
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
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Payment History</h1>
                  <p className="text-sm text-gray-600">
                    Welcome, {username} ({userRole})
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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
                  ? "Start by creating your first payment voucher."
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
                              onClick={() => setSelectedVoucher(voucher)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
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
                              </Button>
                            )}
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
                    <h4 className="font-semibold text-gray-800 mb-3">Bank & Payment Details</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Company:</strong> {selectedVoucher.companyName}
                      </p>
                      <p>
                        <strong>Bank Account:</strong> {selectedVoucher.bankAccount}
                      </p>
                      <p>
                        <strong>Purpose:</strong> {selectedVoucher.purposeOfPayment}
                      </p>
                      <p>
                        <strong>Project:</strong> {selectedVoucher.project}
                      </p>
                      {selectedVoucher.poNumber && (
                        <p>
                          <strong>PO Number:</strong> {selectedVoucher.poNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">Beneficiary Information</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Name:</strong> {selectedVoucher.beneficiaryName}
                      </p>
                      <p>
                        <strong>Account Name:</strong> {selectedVoucher.beneficiaryAccountName}
                      </p>
                      <p>
                        <strong>Account Number:</strong> {selectedVoucher.beneficiaryAccountNumber}
                      </p>
                      <p>
                        <strong>Bank:</strong> {selectedVoucher.beneficiaryBankName}
                      </p>
                      <p>
                        <strong>IFSC:</strong> {selectedVoucher.beneficiaryBankIFSC}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Amount Details */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Amount Details</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="text-2xl font-bold text-green-600">
                        ₹{Number.parseFloat(selectedVoucher.amount).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Amount in Words</p>
                      <p className="font-medium">{selectedVoucher.amountInWords}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">Particulars</p>
                    <p className="font-medium">{selectedVoucher.particulars}</p>
                  </div>
                </div>

                {/* Approvals */}
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Approvals</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Entry Done By</p>
                      <p className="font-medium">{selectedVoucher.entryDoneBy}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Checked By</p>
                      <p className="font-medium">{selectedVoucher.checkedBy}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Approved By</p>
                      <p className="font-medium">{selectedVoucher.approvedBy}</p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t text-sm text-gray-500">
                  <span>Submitted: {new Date(selectedVoucher.submittedAt).toLocaleString("en-IN")}</span>
                  <Button
                    onClick={() => downloadPDF(selectedVoucher)}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
