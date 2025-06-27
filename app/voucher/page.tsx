"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LogOut, History, Save, Building2, BarChart3 } from "lucide-react"

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

export default function VoucherPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [userRole, setUserRole] = useState("")
  const [voucherData, setVoucherData] = useState<VoucherData>({
    id: "",
    voucherNo: "",
    dateOfPayment: "",
    companyName: "",
    bankAccount: "AXIS BANK LTD- CC A/C 8711-TANAY",
    transactionType: "PAYMENT",
    purposeOfPayment: "",
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

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("tns_logged_in")
    const storedUsername = localStorage.getItem("tns_username")
    const storedUserRole = localStorage.getItem("tns_user_role")

    if (isLoggedIn !== "true") {
      router.push("/")
    } else {
      setUsername(storedUsername || "User")
      setUserRole(storedUserRole || "user")
      // Generate unique voucher number and set current date
      const voucherNumber = "TNS" + Date.now().toString().slice(-6)
      const currentDate = new Date().toISOString().split("T")[0]

      setVoucherData((prev) => ({
        ...prev,
        id: "voucher_" + Date.now(),
        voucherNo: voucherNumber,
        dateOfPayment: currentDate,
      }))
    }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const submissionData = {
      ...voucherData,
      submittedAt: new Date().toISOString(),
    }

    // Save to localStorage
    const existingVouchers = JSON.parse(localStorage.getItem("tns_vouchers") || "[]")
    existingVouchers.push(submissionData)
    localStorage.setItem("tns_vouchers", JSON.stringify(existingVouchers))

    alert("Voucher submitted successfully!")

    // Reset form for new voucher
    const newVoucherNumber = "TNS" + Date.now().toString().slice(-6)
    setVoucherData((prev) => ({
      ...prev,
      id: "voucher_" + Date.now(),
      voucherNo: newVoucherNumber,
      purposeOfPayment: "",
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
    }))
  }

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
                <h1 className="text-xl font-bold text-gray-800">TNS Payment System</h1>
                <p className="text-sm text-gray-600">
                  Welcome, {username} ({userRole})
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
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
              <Button
                onClick={() => router.push("/history")}
                variant="outline"
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit}>
          <Card className="shadow-xl border-0 bg-white">
            {/* Voucher Header */}
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <div className="text-center space-y-2">
                <CardTitle className="text-2xl font-bold">{voucherData.companyName || "SELECT COMPANY"}</CardTitle>
                <p className="text-blue-100 text-lg font-semibold">BANK PAYMENT VOUCHER</p>
                <div className="flex justify-between items-center mt-4 bg-white/10 rounded-lg p-3">
                  <div>
                    <p className="text-sm text-blue-100">Voucher No.</p>
                    <p className="text-lg font-bold">{voucherData.voucherNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-100">Date</p>
                    <p className="text-lg font-bold">
                      {new Date(voucherData.dateOfPayment).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-100">Type</p>
                    <p className="text-lg font-bold">{voucherData.transactionType}</p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-8">
              {/* Traditional Voucher Layout */}
              <div className="bg-white border-2 border-gray-800 p-6">
                {/* Company Header */}
                <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
                  <h1 className="text-2xl font-bold text-gray-800">{voucherData.companyName || "SELECT COMPANY"}</h1>
                </div>

                {/* Main Voucher Grid */}
                <div className="space-y-4">
                  {/* Row 1: Bank AC From, Date, Purpose */}
                  <div className="grid grid-cols-12 gap-2 border-b border-gray-400 pb-2">
                    <div className="col-span-4">
                      <Label className="text-xs font-bold text-gray-700 uppercase">COMPANY NAME</Label>
                      <Select
                        value={voucherData.companyName}
                        onValueChange={(value) => handleInputChange("companyName", value)}
                      >
                        <SelectTrigger className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600">
                          <SelectValue placeholder="Select Company" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HAMAR ENERGY (INDIA) PVT LTD">RBPENERGY (INDIA)PVT LTD</SelectItem>
                          <SelectItem value="HAMAR CONSTRUCTION PVT LTD">OM RENEWABLE (INDIA)PVT LTD</SelectItem>
                          <SelectItem value="HAMAR TRADING COMPANY">RAISONI ENERGY (INDIA)PVT LTD</SelectItem>
                          <SelectItem value="HAMAR LOGISTICS PVT LTD">TANAY VIDHYUT (INDIA)PVT LTD</SelectItem>
                          <SelectItem value="HAMAR TECH SOLUTIONS">HAMAR VIDHYUT (INDIA)PVT LTD</SelectItem>
                          <SelectItem value="HAMAR INFRASTRUCTURE LTD">RBP POWER (INDIA) PVT LTD</SelectItem>
                          <SelectItem value="HAMAR INFRASTRUCTURE LTD">ATHARV BUSSINESS</SelectItem>
                          <SelectItem value="HAMAR INFRASTRUCTURE LTD">CORPORATION</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-4">
                      <Label className="text-xs font-bold text-gray-700 uppercase">DATE OF PAYMENT/PROCESS</Label>
                      <Input
                        type="date"
                        value={voucherData.dateOfPayment}
                        onChange={(e) => handleInputChange("dateOfPayment", e.target.value)}
                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"
                        required
                      />
                    </div>
                    <div className="col-span-4">
                      <Label className="text-xs font-bold text-gray-700 uppercase">PURPOSE OF PAYMENT</Label>
                      <Input
                        value={voucherData.purposeOfPayment}
                        onChange={(e) => handleInputChange("purposeOfPayment", e.target.value)}
                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"
                        placeholder="Labour"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 2: Transaction Type, Voucher No, Project */}
                  <div className="grid grid-cols-12 gap-2 border-b border-gray-400 pb-2">
                    <div className="col-span-3">
                      <Label className="text-xs font-bold text-gray-700 uppercase">TRANSACTION TYPE</Label>
                      <Select
                        value={voucherData.transactionType}
                        onValueChange={(value) => handleInputChange("transactionType", value)}
                      >
                        <SelectTrigger className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PAYMENT">PAYMENT</SelectItem>
                          <SelectItem value="TRANSFER">TRANSFER</SelectItem>
                          <SelectItem value="REFUND">REFUND</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs font-bold text-gray-700 uppercase">VOUCHER NO.</Label>
                      <Input
                        value={voucherData.voucherNo}
                        onChange={(e) => handleInputChange("voucherNo", e.target.value)}
                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"
                        required
                      />
                    </div>
                    <div className="col-span-6">
                      <Label className="text-xs font-bold text-gray-700 uppercase">PROJECT</Label>
                      <Input
                        value={voucherData.project}
                        onChange={(e) => handleInputChange("project", e.target.value)}
                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"
                        placeholder="UPAD-ROTOMAG"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 3: Beneficiary Name, PO Number */}
                  <div className="grid grid-cols-12 gap-2 border-b border-gray-400 pb-2">
                    <div className="col-span-8">
                      <Label className="text-xs font-bold text-gray-700 uppercase">BENEFICIARY NAME (PAID TO)</Label>
                      <Input
                        value={voucherData.beneficiaryName}
                        onChange={(e) => handleInputChange("beneficiaryName", e.target.value)}
                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"
                        placeholder="Gopal"
                        required
                      />
                    </div>
                    <div className="col-span-4">
                      <Label className="text-xs font-bold text-gray-700 uppercase">PO. NUMBER</Label>
                      <Input
                        value={voucherData.poNumber}
                        onChange={(e) => handleInputChange("poNumber", e.target.value)}
                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"
                      />
                    </div>
                  </div>

                  {/* Row 4: Beneficiary Account Details */}
                  <div className="grid grid-cols-12 gap-2 border-b border-gray-400 pb-2">
                    <div className="col-span-6">
                      <Label className="text-xs font-bold text-gray-700 uppercase">
                        (NAME OF AC HOLDER) BENEFICIARY A/C NAME
                      </Label>
                      <Input
                        value={voucherData.beneficiaryAccountName}
                        onChange={(e) => handleInputChange("beneficiaryAccountName", e.target.value)}
                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"
                        placeholder="BOB100"
                        required
                      />
                    </div>
                    <div className="col-span-6">
                      <Label className="text-xs font-bold text-gray-700 uppercase">BENEFICIARY A/C NUMBER</Label>
                      <Input
                        value={voucherData.beneficiaryAccountNumber}
                        onChange={(e) => handleInputChange("beneficiaryAccountNumber", e.target.value)}
                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"
                        placeholder="34342"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 5: Bank Name and IFSC */}
                  <div className="grid grid-cols-12 gap-2 border-b border-gray-400 pb-2">
                    <div className="col-span-6">
                      <Label className="text-xs font-bold text-gray-700 uppercase">BENEFICIARY BANK NAME</Label>
                      <Input
                        value={voucherData.beneficiaryBankName}
                        onChange={(e) => handleInputChange("beneficiaryBankName", e.target.value)}
                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"
                        placeholder="sdskdfbksf"
                        required
                      />
                    </div>
                    <div className="col-span-6">
                      <Label className="text-xs font-bold text-gray-700 uppercase">BENEFICIARY BANK IFSC</Label>
                      <Input
                        value={voucherData.beneficiaryBankIFSC}
                        onChange={(e) => handleInputChange("beneficiaryBankIFSC", e.target.value)}
                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"
                        placeholder="b3442"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 6: Particulars and Amount */}
                  <div className="grid grid-cols-12 gap-2 border-b border-gray-400 pb-2">
                    <div className="col-span-8">
                      <Label className="text-xs font-bold text-gray-700 uppercase">PARTICULARS</Label>
                      <Textarea
                        value={voucherData.particulars}
                        onChange={(e) => handleInputChange("particulars", e.target.value)}
                        className="border-0 border-b border-gray-400 rounded-none px-1 py-1 min-h-[60px] text-sm focus:border-gray-600 resize-none"
                        placeholder="lfncnlsnldsfjsdfjfj"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs font-bold text-gray-700 uppercase">AMOUNT</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={voucherData.amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600 text-right font-bold"
                        placeholder="100"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs font-bold text-gray-700 uppercase">TOTAL</Label>
                      <div className="border-0 border-b border-gray-400 px-1 py-0 h-8 text-sm font-bold text-right flex items-center">
                        ₹{voucherData.amount ? Number.parseFloat(voucherData.amount).toLocaleString("en-IN") : "0"}
                      </div>
                    </div>
                  </div>

                  {/* Row 7: Amount in Words */}
                  <div className="border-b border-gray-400 pb-2">
                    <Label className="text-xs font-bold text-gray-700 uppercase">AMOUNT IN WORDS :</Label>
                    <Input
                      value={voucherData.amountInWords}
                      onChange={(e) => handleInputChange("amountInWords", e.target.value)}
                      className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"
                      placeholder="One Hundred Rupees Only"
                      required
                    />
                  </div>

                  {/* Row 8: Approval Signatures */}
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center">
                      <Label className="text-xs font-bold text-gray-700 uppercase block mb-2">ENTRY DONE BY</Label>
                      <Input
                        value={voucherData.entryDoneBy}
                        onChange={(e) => handleInputChange("entryDoneBy", e.target.value)}
                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600 text-center"
                        required
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
                <div className="flex justify-center pt-8 mt-8 border-t-2 border-gray-800">
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-12 py-3 text-lg font-semibold shadow-lg"
                  >
                    <Save className="mr-2 h-5 w-5" />
                    Submit Voucher
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
