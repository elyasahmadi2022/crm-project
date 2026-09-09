import { api } from "@/lib/api"

export interface Employee {
  id: number
  name: string
  email: string
  role: string
  isActive: boolean
  salary: number | null
  salaryCurrency: string
  position: string | null
  department: string | null
  joinDate: string | null
  avatarUrl: string | null
  faceEmbedding: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateEmployeeDto {
  name: string
  email: string
  password: string
  role: string
  salary?: number
  salaryCurrency: string
  position?: string
  department?: string
  joinDate?: string
}

export interface UpdateEmployeeDto {
  name?: string
  email?: string
  role?: string
  isActive?: boolean
  salary?: number
  salaryCurrency?: string
  position?: string
  department?: string
  joinDate?: string
}

export const employeeService = {
  getAllEmployees: async (): Promise<Employee[]> => {
    const response = await api.get("/users")
    return response.data.data || response.data
  },

  getEmployeeById: async (id: number): Promise<Employee> => {
    const response = await api.get(`/users/${id}`)
    return response.data.data || response.data
  },

  createEmployee: async (data: CreateEmployeeDto): Promise<Employee> => {
    const response = await api.post("/users", data)
    return response.data.data || response.data
  },

  updateEmployee: async (id: number, data: UpdateEmployeeDto): Promise<Employee> => {
    const response = await api.put(`/users/${id}`, data)
    return response.data.data || response.data
  },

  deleteEmployee: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`)
  },

  uploadAvatar: async (id: number, file: File): Promise<Employee> => {
    const formData = new FormData()
    formData.append("avatar", file)
    const response = await api.post(`/users/${id}/avatar`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data.data || response.data
  },

  registerFace: async (id: number, imageBase64: string, faceDescriptor: number[]): Promise<Employee> => {
    const response = await api.post(`/users/${id}/register-face`, {
      image: imageBase64,
      faceDescriptor: faceDescriptor
    })
    return response.data.data || response.data
  },
}
