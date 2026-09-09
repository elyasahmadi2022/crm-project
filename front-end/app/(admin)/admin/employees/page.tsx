"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Plus, UserCheck, Camera, Trash2, Edit, Search, Loader2, CheckCircle2, XCircle } from "lucide-react"
import Webcam from "react-webcam"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DatePicker } from "@/components/ui/date-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee, useRegisterFace } from "@/queries/employee.queries"
import { type CreateEmployeeDto } from "@/services/employee.service"
import { toast } from "@/lib/toast"
import { loadModels, detectFaceInVideo, getDescriptorFromVideo, captureSnapshot, toArray } from "@/lib/face-api"

const USER_ROLES = [
  { value: "ADMIN", label: "Administrator" },
  { value: "DEVELOPER", label: "Developer" },
  { value: "DESIGNER", label: "Designer" },
  { value: "SALES", label: "Sales" },
  { value: "FINANCE", label: "Finance" },
  { value: "MARKETING", label: "Marketing" },
]

export default function EmployeesPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [faceRegisterOpen, setFaceRegisterOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Face registration states
  const [modelsReady, setModelsReady] = useState(false)
  const [modelsLoading, setModelsLoading] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [faceCentered, setFaceCentered] = useState(false)
  const [facePosition, setFacePosition] = useState("Loading face detection models...")
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)

  const webcamRef = useRef<Webcam>(null)
  const detectionLoopRef = useRef<number | null>(null)
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)

  const { data: employees, isLoading } = useEmployees()
  const createMutation = useCreateEmployee()
  const updateMutation = useUpdateEmployee()
  const deleteMutation = useDeleteEmployee()
  const registerFaceMutation = useRegisterFace()

  const [formData, setFormData] = useState<CreateEmployeeDto>({
    name: "",
    email: "",
    password: "admin123",
    role: "DEVELOPER",
    salary: 0,
    position: "",
    department: "",
    joinDate: new Date().toISOString().split("T")[0],
  })

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "admin123",
      role: "DEVELOPER",
      salary: 0,
      position: "",
      department: "",
      joinDate: new Date().toISOString().split("T")[0],
    })
  }

  // ─────────────────────────────────────────────
  // Face detection loop (runs every 400ms while dialog is open)
  // ─────────────────────────────────────────────
  const startDetectionLoop = useCallback(() => {
    if (detectionLoopRef.current) cancelAnimationFrame(detectionLoopRef.current)

    let lastRun = 0
    const INTERVAL = 400 // ms between detections

    const loop = async (now: number) => {
      if (now - lastRun >= INTERVAL) {
        lastRun = now
        const video = webcamRef.current?.video
        if (video && video.readyState === 4) {
          const result = await detectFaceInVideo(video)
          setFaceDetected(result.detected)
          setFaceCentered(result.centered)

          if (!result.detected) {
            setFacePosition("No face detected — look directly at the camera")
          } else if (!result.centered) {
            setFacePosition("Center your face in the oval guide")
          } else {
            setFacePosition("Perfect! Hold still...")
          }
        }
      }
      detectionLoopRef.current = requestAnimationFrame(loop)
    }

    detectionLoopRef.current = requestAnimationFrame(loop)
  }, [])

  const stopDetectionLoop = useCallback(() => {
    if (detectionLoopRef.current) {
      cancelAnimationFrame(detectionLoopRef.current)
      detectionLoopRef.current = null
    }
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    setAutoCountdown(null)
  }, [])

  // ─────────────────────────────────────────────
  // Auto-capture countdown when face is centered
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!faceRegisterOpen) return

    if (faceCentered && !isCapturing) {
      // Start 3-second countdown
      if (autoCountdown === null) {
        setAutoCountdown(3)
      }
    } else {
      // Reset countdown if face moves away
      if (autoCountdown !== null) {
        setAutoCountdown(null)
        if (countdownTimerRef.current) {
          clearTimeout(countdownTimerRef.current)
          countdownTimerRef.current = null
        }
      }
    }
  }, [faceCentered, faceRegisterOpen, isCapturing])

  // Tick the countdown down
  useEffect(() => {
    if (autoCountdown === null) return

    if (autoCountdown === 0) {
      handleCaptureFace()
      return
    }

    countdownTimerRef.current = setTimeout(() => {
      setAutoCountdown((prev) => (prev !== null ? prev - 1 : null))
    }, 1000)

    return () => {
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current)
    }
  }, [autoCountdown])

  // ─────────────────────────────────────────────
  // Capture & register face
  // ─────────────────────────────────────────────
  const handleCaptureFace = useCallback(async () => {
    if (isCapturing) return
    const video = webcamRef.current?.video
    if (!video || !selectedEmployee) return

    setIsCapturing(true)
    stopDetectionLoop()

    try {
      // Get real 128-dim descriptor from the live video frame
      const descriptor = await getDescriptorFromVideo(video)

      if (!descriptor || descriptor.length !== 128) {
        toast.error("No face detected", { description: "Please position your face clearly in the oval and try again." })
        setIsCapturing(false)
        startDetectionLoop()
        return
      }

      // Capture one JPEG snapshot
      const imageBase64 = captureSnapshot(video)

      registerFaceMutation.mutate(
        {
          id: selectedEmployee.id,
          imageBase64,
          faceDescriptor: toArray(descriptor),
        },
        {
          onSuccess: () => {
            toast.success(`Face registered for ${selectedEmployee.name}`, { description: "This employee can now use face recognition for attendance." })
            setFaceRegisterOpen(false)
          },
          onError: (err: any) => {
            toast.error("Registration failed", { description: err?.message ?? "Please try again." })
            setIsCapturing(false)
            startDetectionLoop()
          },
        }
      )
    } catch (err) {
      console.error(err)
      toast.error("Face capture failed", { description: "Please try again." })
      setIsCapturing(false)
      startDetectionLoop()
    }
  }, [isCapturing, selectedEmployee, registerFaceMutation, stopDetectionLoop, startDetectionLoop])

  // ─────────────────────────────────────────────
  // Open / close face dialog
  // ─────────────────────────────────────────────
  const openFaceRegister = async (employee: any) => {
    setSelectedEmployee(employee)
    setFaceDetected(false)
    setFaceCentered(false)
    setAutoCountdown(null)
    setIsCapturing(false)
    setFaceRegisterOpen(true)

    if (!modelsReady) {
      setModelsLoading(true)
      setFacePosition("Loading face detection models…")
      try {
        await loadModels()
        setModelsReady(true)
        setFacePosition("Models ready — position your face in the oval")
      } catch {
        toast.error("Failed to load face recognition models", { description: "Please refresh the page and try again." })
      } finally {
        setModelsLoading(false)
      }
    } else {
      setFacePosition("Position your face in the oval guide")
    }
  }

  const handleFaceDialogClose = (open: boolean) => {
    if (!open) {
      stopDetectionLoop()
      setFaceDetected(false)
      setFaceCentered(false)
      setAutoCountdown(null)
      setIsCapturing(false)
    }
    setFaceRegisterOpen(open)
  }

  // Start detection loop once webcam is ready and dialog is open
  useEffect(() => {
    if (!faceRegisterOpen || !modelsReady) return

    // Small delay to let webcam initialise
    const t = setTimeout(() => startDetectionLoop(), 1200)
    return () => {
      clearTimeout(t)
      stopDetectionLoop()
    }
  }, [faceRegisterOpen, modelsReady])

  // Cleanup on unmount
  useEffect(() => () => stopDetectionLoop(), [])

  // ─────────────────────────────────────────────
  // CRUD handlers
  // ─────────────────────────────────────────────
  const handleCreate = () => {
    createMutation.mutate(formData, {
      onSuccess: () => { setCreateOpen(false); resetForm() },
    })
  }

  const handleEdit = () => {
    if (!selectedEmployee) return
    const { password, ...updateData } = formData
    updateMutation.mutate(
      { id: selectedEmployee.id, data: updateData },
      {
        onSuccess: () => { setEditOpen(false); setSelectedEmployee(null); resetForm() },
      }
    )
  }

  const handleDelete = () => {
    if (!selectedEmployee) return
    deleteMutation.mutate(selectedEmployee.id, {
      onSuccess: () => { setDeleteDialogOpen(false); setSelectedEmployee(null) },
    })
  }

  const openEdit = (employee: any) => {
    setSelectedEmployee(employee)
    // Set form data synchronously before opening — no race condition
    setFormData({
      name: employee.name || "",
      email: employee.email || "",
      password: "",
      role: employee.role && typeof employee.role === "string" ? employee.role : "DEVELOPER",
      salary: Number(employee.salary) || 0,
      position: employee.position || "",
      department: employee.department || "",
      joinDate: employee.joinDate?.split("T")[0] || new Date().toISOString().split("T")[0],
    })
    // Open after setting data — React batches these in React 18 so they render together
    setEditOpen(true)
  }

  // Repopulate form if the same dialog re-opens with a different employee
  // (covers edge case where editOpen stays true between clicks)
  useEffect(() => {
    if (!editOpen) return
    if (!selectedEmployee) return
    setFormData({
      name: selectedEmployee.name || "",
      email: selectedEmployee.email || "",
      password: "",
      role: selectedEmployee.role && typeof selectedEmployee.role === "string" ? selectedEmployee.role : "DEVELOPER",
      salary: Number(selectedEmployee.salary) || 0,
      position: selectedEmployee.position || "",
      department: selectedEmployee.department || "",
      joinDate: selectedEmployee.joinDate?.split("T")[0] || new Date().toISOString().split("T")[0],
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployee?.id, editOpen])

  const openDeleteDialog = (employee: any) => {
    setSelectedEmployee(employee)
    setDeleteDialogOpen(true)
  }

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  const filteredEmployees = employees?.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.department?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ─────────────────────────────────────────────
  // Derived UI state
  // ─────────────────────────────────────────────
  const statusColor = !faceDetected
    ? "border-red-500"
    : !faceCentered
    ? "border-yellow-400"
    : "border-green-500"

  const statusLabel = !faceDetected
    ? "No face detected"
    : !faceCentered
    ? "Centering..."
    : autoCountdown !== null && autoCountdown > 0
    ? `Auto-capture in ${autoCountdown}s`
    : "Perfect!"

  const statusBg = !faceDetected
    ? "bg-red-500"
    : !faceCentered
    ? "bg-yellow-500"
    : "bg-green-500"

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Employee Management</h1>
          <p className="text-muted-foreground mt-1">Manage employees and register face for attendance</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Face Registered</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employees?.filter((e) => e.faceEmbedding).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Ready for attendance</p>
          </CardContent>
        </Card>
      </div>

      {/* Employees List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>All Employees</CardTitle>
              <CardDescription>View and manage employee information</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : !filteredEmployees || filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{searchQuery ? "No employees match your search." : "No employees found. Add your first employee."}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={employee.avatarUrl || undefined} />
                      <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold truncate">{employee.name}</h3>
                        <Badge variant="outline" className="shrink-0">{employee.role}</Badge>
                        {employee.faceEmbedding ? (
                          <Badge className="bg-green-600 shrink-0 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Face ID Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="shrink-0 gap-1 text-muted-foreground border-dashed">
                            <XCircle className="h-3 w-3" />
                            No Face ID
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{employee.email}</p>
                      <div className="flex gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                        {employee.position && <span>Position: {employee.position}</span>}
                        {employee.department && <span>Dept: {employee.department}</span>}
                        {employee.salary && <span>Salary: {Number(employee.salary).toLocaleString()} AFN</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-2">
                    <Button size="sm" variant="outline" onClick={() => openFaceRegister(employee)}>
                      <Camera className="h-4 w-4 mr-1" />
                      {employee.faceEmbedding ? "Re-register" : "Register Face"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(employee)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openDeleteDialog(employee)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Face Registration Dialog ── */}
      <Dialog open={faceRegisterOpen} onOpenChange={handleFaceDialogClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Register Face — {selectedEmployee?.name}</DialogTitle>
            <DialogDescription>
              One face photo is captured and stored as a secure 128-dimension embedding.
              {selectedEmployee?.faceEmbedding && " This will replace the existing registration."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Camera view */}
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
                mirrored={true}
                className="w-full h-full object-cover"
              />

              {/* Oval guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className={`w-48 h-60 border-4 rounded-full transition-all duration-300 ${statusColor}`}
                  style={{ boxShadow: faceCentered ? "0 0 0 4px rgba(34,197,94,0.3)" : undefined }}
                />
              </div>

              {/* Status pill */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
                <span className={`px-4 py-1.5 rounded-full text-white text-sm font-semibold shadow ${statusBg} transition-colors`}>
                  {modelsLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" /> Loading models…
                    </span>
                  ) : (
                    statusLabel
                  )}
                </span>
              </div>

              {/* Bottom guidance */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[90%] z-10">
                <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-center text-sm">
                  {isCapturing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing face…
                    </span>
                  ) : facePosition}
                </div>
              </div>

              {/* Capturing overlay */}
              {isCapturing && (
                <div className="absolute inset-0 bg-white/20 flex items-center justify-center z-20">
                  <div className="bg-black/80 text-white px-6 py-4 rounded-xl flex items-center gap-3 text-lg font-semibold">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Registering face…
                  </div>
                </div>
              )}
            </div>

            {/* Manual capture button */}
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setFaceRegisterOpen(false)} disabled={isCapturing}>
                Cancel
              </Button>
              <Button
                onClick={handleCaptureFace}
                disabled={!faceDetected || isCapturing || modelsLoading}
                className="min-w-[180px]"
              >
                {isCapturing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…</>
                ) : (
                  <><Camera className="h-4 w-4 mr-2" /> Capture Now</>
                )}
              </Button>
            </div>

            {/* Instructions
            <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3 space-y-1">
              <p className="font-semibold">Instructions for best accuracy:</p>
              <ul className="list-disc list-inside ml-2 space-y-0.5">
                <li>Centre your face inside the oval — auto-capture triggers after 3 seconds</li>
                <li>Remove glasses if possible</li>
                <li>Ensure even lighting — avoid strong backlighting</li>
                <li>Look directly at the camera with a neutral expression</li>
                <li>Only one face photo is stored per employee</li>
              </ul>
            </div> */}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Create Employee Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>Create a new employee account</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Role *</Label>
              <Select value={formData.role} onValueChange={(v) => v && setFormData({ ...formData, role: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} placeholder="Software Engineer" />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="Engineering" />
            </div>
            <div className="space-y-2">
              <Label>Monthly Salary (AFN)</Label>
              <Input type="number" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Join Date</Label>
              <DatePicker
                value={formData.joinDate ? new Date(formData.joinDate) : undefined}
                onChange={(d) => setFormData({ ...formData, joinDate: d?.toISOString().split("T")[0] || "" })}
                placeholder="Select join date"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Employee Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update employee information</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Role</Label>
              <Select value={formData.role} onValueChange={(v) => v && setFormData({ ...formData, role: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Monthly Salary (AFN)</Label>
              <Input type="number" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating…" : "Update Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{selectedEmployee?.name}</strong> and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
