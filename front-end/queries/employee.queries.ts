import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { employeeService, type CreateEmployeeDto, type UpdateEmployeeDto } from "@/services/employee.service"
import { toast } from "@/lib/toast"

export const useEmployees = () => {
  return useQuery({
    queryKey: ["employees"],
    queryFn: employeeService.getAllEmployees,
  })
}

export const useEmployee = (id: number) => {
  return useQuery({
    queryKey: ["employees", id],
    queryFn: () => employeeService.getEmployeeById(id),
    enabled: !!id,
  })
}

export const useCreateEmployee = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateEmployeeDto) => employeeService.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      toast.success("Employee created successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create employee")
    },
  })
}

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEmployeeDto }) =>
      employeeService.updateEmployee(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      queryClient.invalidateQueries({ queryKey: ["employees", variables.id] })
      toast.success("Employee updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update employee")
    },
  })
}

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => employeeService.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      toast.success("Employee deleted successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete employee")
    },
  })
}

export const useUploadAvatar = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => employeeService.uploadAvatar(id, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      queryClient.invalidateQueries({ queryKey: ["employees", variables.id] })
      toast.success("Avatar uploaded successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to upload avatar")
    },
  })
}

export const useRegisterFace = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, imageBase64, faceDescriptor }: { id: number; imageBase64: string; faceDescriptor: number[] }) =>
      employeeService.registerFace(id, imageBase64, faceDescriptor),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      queryClient.invalidateQueries({ queryKey: ["employees", variables.id] })
      // Toast is handled by the calling page
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to register face")
    },
  })
}

// ── Attendance queries ──────────────────────────────────────────────────────
import { attendanceService } from "@/services/attendance.service"

export const useAttendance = (date: Date) => {
  const dateStr = date.toISOString().split("T")[0]
  return useQuery({
    queryKey: ["attendance", dateStr],
    queryFn: () => attendanceService.getAttendanceByDate(dateStr),
  })
}
