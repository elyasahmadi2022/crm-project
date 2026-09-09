"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Calendar, Users, CheckCircle, XCircle, Clock, Eye, Search,
  Trash2, Camera, LogIn, LogOut, Loader2,
} from "lucide-react"
import Webcam from "react-webcam"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker, DateRangePicker } from "@/components/ui/date-picker"
import type { DateRange } from "react-day-picker"
import { toast } from "@/lib/toast"
import { attendanceService } from "@/services/attendance.service"
import { loadModels, detectFaceInVideo, getDescriptorFromVideo, captureSnapshot, toArray } from "@/lib/face-api"
import { useAttendance, useEmployees } from "@/queries/employee.queries"

const ATTENDANCE_STATUS = {
  PRESENT:  { label: "Present",  color: "default",     bgColor: "bg-green-50 border-green-200" },
  ABSENT:   { label: "Absent",   color: "destructive", bgColor: "bg-red-50 border-red-200" },
  HALF_DAY: { label: "Half Day", color: "secondary",   bgColor: "bg-orange-50 border-orange-200" },
  LEAVE:    { label: "Leave",    color: "secondary",   bgColor: "bg-blue-50 border-blue-200" },
  HOLIDAY:  { label: "Holiday",  color: "outline",     bgColor: "bg-gray-50 border-gray-200" },
}

export default function AdminAttendancePage() {
  const [selectedDate, setSelectedDate]     = useState<Date>(new Date())
  const [dateRange, setDateRange]           = useState<DateRange | undefined>()
  const [viewOpen, setViewOpen]             = useState(false)
  const [manualOpen, setManualOpen]         = useState(false)
  const [attendanceOpen, setAttendanceOpen] = useState(false)
  const [attendanceType, setAttendanceType] = useState<"check-in" | "check-out">("check-in")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null)
  const [searchQuery, setSearchQuery]       = useState("")

  // Face detection state
  const [modelsReady, setModelsReady]       = useState(false)
  const [modelsLoading, setModelsLoading]   = useState(false)
  const [faceDetected, setFaceDetected]     = useState(false)
  const [faceCentered, setFaceCentered]     = useState(false)
  const [faceMsg, setFaceMsg]               = useState("Loading models…")
  const [countdown, setCountdown]           = useState<number | null>(null)
  const [isVerifying, setIsVerifying]       = useState(false)

  const webcamRef        = useRef<Webcam>(null)
  const detectionLoopRef = useRef<number | null>(null)
  const countdownTimerRef= useRef<NodeJS.Timeout | null>(null)

  const [manualData, setManualData] = useState({
    employeeId: "",
    date: new Date(),
    checkIn: "09:00",
    checkOut: "17:00",
    status: "PRESENT",
    notes: "",
  })

  const { data: employees } = useEmployees()
  const { data: todayAttendance, isLoading, refetch } = useAttendance(selectedDate)

  // ─────────────────────────────────────────────
  // Face detection RAF loop (400 ms cadence)
  // ─────────────────────────────────────────────
  const startLoop = useCallback(() => {
    if (detectionLoopRef.current) cancelAnimationFrame(detectionLoopRef.current)
    let lastRun = 0
    const INTERVAL = 400

    const tick = async (now: number) => {
      if (now - lastRun >= INTERVAL) {
        lastRun = now
        const video = webcamRef.current?.video
        if (video && video.readyState === 4) {
          const res = await detectFaceInVideo(video)
          setFaceDetected(res.detected)
          setFaceCentered(res.centered)
          if (!res.detected)       setFaceMsg("No face detected — look at the camera")
          else if (!res.centered)  setFaceMsg("Center your face in the oval")
          else                     setFaceMsg("Perfect! Hold still…")
        }
      }
      detectionLoopRef.current = requestAnimationFrame(tick)
    }
    detectionLoopRef.current = requestAnimationFrame(tick)
  }, [])

  const stopLoop = useCallback(() => {
    if (detectionLoopRef.current) { cancelAnimationFrame(detectionLoopRef.current); detectionLoopRef.current = null }
    if (countdownTimerRef.current) { clearTimeout(countdownTimerRef.current); countdownTimerRef.current = null }
    setCountdown(null)
  }, [])

  // Countdown when face is centered
  useEffect(() => {
    if (!attendanceOpen) return
    if (faceCentered && !isVerifying) {
      if (countdown === null) setCountdown(3)
    } else {
      if (countdown !== null) {
        setCountdown(null)
        if (countdownTimerRef.current) { clearTimeout(countdownTimerRef.current); countdownTimerRef.current = null }
      }
    }
  }, [faceCentered, attendanceOpen, isVerifying])

  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) { captureAndVerify(); return }
    countdownTimerRef.current = setTimeout(() => setCountdown(c => c !== null ? c - 1 : null), 1000)
    return () => { if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current) }
  }, [countdown])

  // ─────────────────────────────────────────────
  // Capture & verify
  // ─────────────────────────────────────────────
  const captureAndVerify = useCallback(async () => {
    if (isVerifying) return
    const video = webcamRef.current?.video
    if (!video) return

    setIsVerifying(true)
    stopLoop()

    try {
      const descriptor = await getDescriptorFromVideo(video)
      if (!descriptor || descriptor.length !== 128) {
        toast.error("No face detected", { description: "Please position your face clearly in the oval and try again." })
        setIsVerifying(false)
        startLoop()
        return
      }

      const imageBase64 = captureSnapshot(video)
      const descriptorArr = toArray(descriptor)

      // Step 1: identify who this face belongs to
      const verifyResult = await attendanceService.publicVerifyFace({
        faceImageBase64: imageBase64,
        faceDescriptor: descriptorArr,
      })

      if (!verifyResult.verified || !verifyResult.employeeId) {
        toast.error("Face not recognized", {
          description: "Ensure you are registered in the system.",
        })
        setIsVerifying(false)
        startLoop()
        return
      }

      const name = verifyResult.employeeName ?? "Employee"

      // Step 2: check in or out
      if (attendanceType === "check-in") {
        try {
          await attendanceService.publicCheckIn(verifyResult.employeeId, imageBase64, descriptorArr)
          toast.success(`Welcome, ${name}!`, { description: `${name} is now present today.` })
        } catch (err: any) {
          const msg: string = err?.response?.data?.message || err?.message || ""
          if (msg.toLowerCase().includes("already checked in")) {
            toast.info(`${name} is already present today`, { description: "Check-in was already recorded for today." })
          } else {
            throw err
          }
        }
      } else {
        try {
          await attendanceService.publicCheckOut(verifyResult.employeeId, imageBase64, descriptorArr)
          toast.success(`${name} is leaving now`, { description: `Check-out recorded. Goodbye, ${name}!` })
        } catch (err: any) {
          const msg: string = err?.response?.data?.message || err?.message || ""
          if (msg.toLowerCase().includes("already checked out")) {
            toast.info(`${name} already checked out`, { description: "Check-out was already recorded for today." })
          } else {
            throw err
          }
        }
      }

      refetch()
      setAttendanceOpen(false)
    } catch (err: any) {
      toast.error("Attendance failed", {
        description: err?.response?.data?.message || err?.message || "Please try again.",
      })
      setIsVerifying(false)
      startLoop()
    }  }, [isVerifying, attendanceType, stopLoop, startLoop, refetch])

  // Open dialog — load models once
  const openAttendanceDialog = async (type: "check-in" | "check-out") => {
    setAttendanceType(type)
    setFaceDetected(false)
    setFaceCentered(false)
    setCountdown(null)
    setIsVerifying(false)
    setAttendanceOpen(true)

    if (!modelsReady) {
      setModelsLoading(true)
      setFaceMsg("Loading face detection models…")
      try {
        await loadModels()
        setModelsReady(true)
        setFaceMsg("Models ready — position your face in the oval")
      } catch {
        toast.error("Failed to load face recognition models", { description: "Please refresh and try again." })
      } finally {
        setModelsLoading(false)
      }
    } else {
      setFaceMsg("Position your face in the oval")
    }
  }

  const handleAttendanceClose = (open: boolean) => {
    if (!open) { stopLoop(); setIsVerifying(false); setCountdown(null) }
    setAttendanceOpen(open)
  }

  // Start loop once dialog + models ready
  useEffect(() => {
    if (!attendanceOpen || !modelsReady) return
    const t = setTimeout(() => startLoop(), 1200)
    return () => { clearTimeout(t); stopLoop() }
  }, [attendanceOpen, modelsReady])

  useEffect(() => () => stopLoop(), [])

  // ─────────────────────────────────────────────
  // Manual entry
  // ─────────────────────────────────────────────
  const handleManualEntry = async () => {
    if (!manualData.employeeId) { toast.error("No employee selected", { description: "Please select an employee first." }); return }
    try {
      await attendanceService.manualEntry({
        employeeId: manualData.employeeId,
        date: manualData.date.toISOString().split("T")[0],
        checkIn: manualData.checkIn,
        checkOut: manualData.checkOut,
        status: manualData.status,
        notes: manualData.notes,
      })
      toast.success("Attendance entry created")
      refetch()
      setManualOpen(false)
    } catch (err: any) {
      toast.error("Failed to create entry", { description: err?.response?.data?.message })
    }
  }

  const handleDelete = async () => {
    if (!selectedAttendance) return
    try {
      await attendanceService.deleteAttendance(selectedAttendance.id)
      toast.success("Attendance record deleted")
      refetch()
    } catch {
      toast.error("Failed to delete record")
    }    setDeleteDialogOpen(false)
  }

  // ─────────────────────────────────────────────
  // Derived UI
  // ─────────────────────────────────────────────
  const ovalColor  = !faceDetected ? "border-red-500" : !faceCentered ? "border-yellow-400" : "border-green-500"
  const pillBg     = !faceDetected ? "bg-red-500"     : !faceCentered ? "bg-yellow-500"     : "bg-green-500"
  const pillLabel  = modelsLoading
    ? "Loading models…"
    : !faceDetected
    ? "No Face"
    : !faceCentered
    ? "Centering…"
    : countdown !== null && countdown > 0
    ? `Auto-capturing in ${countdown}s`
    : "Perfect!"

  const filteredAttendance = (todayAttendance ?? []).filter((a: any) =>
    a.employee?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const presentCount = (todayAttendance ?? []).filter((a: any) => a.status === "PRESENT").length
  const absentCount  = (employees?.length ?? 0) - presentCount
  const rate         = employees?.length ? Math.round((presentCount / employees.length) * 100) : 0

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Attendance Dashboard</h1>
          <p className="text-muted-foreground mt-1">Face-recognition attendance tracking</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openAttendanceDialog("check-in")} className="gap-2">
            <LogIn className="h-4 w-4" /> Check In
          </Button>
          <Button onClick={() => openAttendanceDialog("check-out")} variant="secondary" className="gap-2">
            <LogOut className="h-4 w-4" /> Check Out
          </Button>
          <Button onClick={() => setManualOpen(true)} variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" /> Manual Entry
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">Active employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{presentCount}</div>
            <p className="text-xs text-muted-foreground">Checked in</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{absentCount < 0 ? 0 : absentCount}</div>
            <p className="text-xs text-muted-foreground">Not checked in</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rate}%</div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>
      </div>

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Attendance</CardTitle>
          <CardDescription>Select date or date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-[1fr_2fr_auto] gap-4 items-end">
            <div className="space-y-2">
              <Label>Single Date</Label>
              <DatePicker value={selectedDate} onChange={(d) => d && setSelectedDate(d)} placeholder="Select date" />
            </div>
            <div className="space-y-2">
              <Label>Date Range (Optional)</Label>
              <DateRangePicker value={dateRange} onChange={setDateRange} placeholder="Select date range" />
            </div>
            <Button onClick={() => refetch()}>View Attendance</Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {selectedDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </CardTitle>
              <CardDescription>Employee check-in / check-out records</CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search employees…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : filteredAttendance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No attendance records for this date.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAttendance.map((a: any) => {
                const statusInfo = ATTENDANCE_STATUS[a.status as keyof typeof ATTENDANCE_STATUS]
                return (
                  <div key={a.id} className={`flex items-center justify-between p-4 border rounded-lg ${statusInfo?.bgColor}`}>
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold">{a.employee?.name}</h3>
                          <Badge variant={statusInfo?.color as any}>{statusInfo?.label}</Badge>
                          {a.faceVerified && <Badge className="bg-green-600 text-white text-xs">✓ Face Verified</Badge>}
                        </div>
                        <div className="flex gap-3 text-sm text-muted-foreground">
                          {a.employee?.position && <span>{a.employee.position}</span>}
                          {a.employee?.department && <span>• {a.employee.department}</span>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Check In</p>
                          <p className="font-semibold">
                            {a.checkIn ? new Date(a.checkIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Check Out</p>
                          <p className="font-semibold">
                            {a.checkOut ? new Date(a.checkOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedAttendance(a); setViewOpen(true) }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedAttendance(a); setDeleteDialogOpen(true) }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Face Attendance Dialog ── */}
      <Dialog open={attendanceOpen} onOpenChange={handleAttendanceClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Face Verification — {attendanceType === "check-in" ? "Check In" : "Check Out"}
            </DialogTitle>
            <DialogDescription>
              Look at the camera. Attendance is captured automatically once your face is recognised.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
                mirrored={true}
                className="w-full h-full object-cover"
              />

              {/* Oval guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className={`w-48 h-60 border-4 rounded-full transition-all duration-300 ${ovalColor}`}
                  style={{ boxShadow: faceCentered ? "0 0 0 4px rgba(34,197,94,0.3)" : undefined }}
                />
              </div>

              {/* Status pill */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
                <span className={`px-4 py-1.5 rounded-full text-white text-sm font-semibold shadow ${pillBg} transition-colors`}>
                  {modelsLoading
                    ? <span className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Loading…</span>
                    : pillLabel
                  }
                </span>
              </div>

              {/* Bottom guidance */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[90%] z-10">
                <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-center text-sm">
                  {isVerifying
                    ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Verifying identity…</span>
                    : faceMsg
                  }
                </div>
              </div>

              {/* Verifying overlay */}
              {isVerifying && (
                <div className="absolute inset-0 bg-white/10 flex items-center justify-center z-20">
                  <div className="bg-black/80 text-white px-6 py-4 rounded-xl flex items-center gap-3 text-lg font-semibold">
                    <Loader2 className="h-5 w-5 animate-spin" /> Verifying identity…
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setAttendanceOpen(false)} disabled={isVerifying}>
                Cancel
              </Button>
              <Button onClick={captureAndVerify} disabled={!faceDetected || isVerifying || modelsLoading} className="min-w-[180px]">
                {isVerifying
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying…</>
                  : <><Camera className="h-4 w-4 mr-2" /> Verify Now</>
                }
              </Button>
            </div>

            <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3 space-y-1">
              <p className="font-semibold">Instructions:</p>
              <ul className="list-disc list-inside ml-2 space-y-0.5">
                <li>Centre your face in the oval — auto-capture fires after 3 s</li>
                <li>Look directly at the camera, neutral expression</li>
                <li>Ensure good even lighting, avoid strong backlighting</li>
                <li>You must be registered in the system first (Employees page)</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── View Attendance Dialog ── */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Attendance Details</DialogTitle>
            <DialogDescription>
              {selectedAttendance && `${selectedAttendance.employee?.name} — ${new Date(selectedAttendance.date).toLocaleDateString()}`}
            </DialogDescription>
          </DialogHeader>
          {selectedAttendance && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-muted-foreground">Employee</Label><p className="font-medium">{selectedAttendance.employee?.name}</p></div>
                <div><Label className="text-muted-foreground">Date</Label><p className="font-medium">{new Date(selectedAttendance.date).toLocaleDateString()}</p></div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={ATTENDANCE_STATUS[selectedAttendance.status as keyof typeof ATTENDANCE_STATUS]?.color as any}>
                    {ATTENDANCE_STATUS[selectedAttendance.status as keyof typeof ATTENDANCE_STATUS]?.label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Face Verified</Label>
                  <Badge variant={selectedAttendance.faceVerified ? "default" : "outline"}>
                    {selectedAttendance.faceVerified ? "✓ Verified" : "Not Verified"}
                  </Badge>
                </div>
                <div><Label className="text-muted-foreground">Check In</Label><p className="font-medium">{selectedAttendance.checkIn ? new Date(selectedAttendance.checkIn).toLocaleTimeString() : "—"}</p></div>
                <div><Label className="text-muted-foreground">Check Out</Label><p className="font-medium">{selectedAttendance.checkOut ? new Date(selectedAttendance.checkOut).toLocaleTimeString() : "—"}</p></div>
              </div>
              {selectedAttendance.notes && <div><Label className="text-muted-foreground">Notes</Label><p className="mt-1">{selectedAttendance.notes}</p></div>}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Manual Entry Dialog ── */}
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manual Attendance Entry</DialogTitle>
            <DialogDescription>Create or update attendance record manually</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-2">
              <Label>Employee *</Label>
              <Select value={manualData.employeeId || undefined} onValueChange={(v) => v && setManualData({ ...manualData, employeeId: v })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees?.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <DatePicker value={manualData.date} onChange={(d) => d && setManualData({ ...manualData, date: d })} placeholder="Select date" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Check In</Label>
                <Input type="time" value={manualData.checkIn} onChange={(e) => setManualData({ ...manualData, checkIn: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Check Out</Label>
                <Input type="time" value={manualData.checkOut} onChange={(e) => setManualData({ ...manualData, checkOut: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select value={manualData.status || "PRESENT"} onValueChange={(v) => v && setManualData({ ...manualData, status: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ATTENDANCE_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={manualData.notes} onChange={(e) => setManualData({ ...manualData, notes: e.target.value })} placeholder="Optional notes…" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualOpen(false)}>Cancel</Button>
            <Button onClick={handleManualEntry}>Create Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attendance Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the record for <strong>{selectedAttendance?.employee?.name}</strong>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
