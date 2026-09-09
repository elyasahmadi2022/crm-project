"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { projectService } from "@/services/project.service"
import { getApiErrorMessage } from "@/lib/api"
import { toast } from "@/components/ui/toast"
import type {
  CreateProjectDto, UpdateProjectDto, ChangeStageDto,
  CreateMilestoneDto, UpdateMilestoneDto,
  AssignTeamMemberDto, ListProjectsQuery,
} from "@/services/project.service"

const show = (opts: Parameters<typeof toast.add>[0]) => toast.add(opts)

export const projectKeys = {
  all:    ["projects"] as const,
  lists:  () => [...projectKeys.all, "list"] as const,
  list:   (q: ListProjectsQuery) => [...projectKeys.lists(), q] as const,
  detail: (id: number) => [...projectKeys.all, "detail", id] as const,
}

export function useListProjectsQuery(params?: ListProjectsQuery) {
  return useQuery({
    queryKey: projectKeys.list(params ?? {}),
    queryFn:  () => projectService.getAll(params),
    staleTime: 30_000,
  })
}

export function useProjectQuery(id: number | null) {
  return useQuery({
    queryKey: projectKeys.detail(id!),
    queryFn:  () => projectService.getById(id!),
    enabled:  id !== null,
    staleTime: 30_000,
  })
}

export function useCreateProjectMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateProjectDto) => projectService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.lists() })
      show({ title: "Project created", type: "success" })
    },
    onError: (err) => show({ title: "Failed to create project", description: getApiErrorMessage(err), type: "error" }),
  })
}

export function useUpdateProjectMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateProjectDto }) =>
      projectService.update(id, dto),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: projectKeys.lists() })
      qc.setQueryData(projectKeys.detail(data.id), data)
      show({ title: "Project updated", type: "success" })
    },
    onError: (err) => show({ title: "Failed to update project", description: getApiErrorMessage(err), type: "error" }),
  })
}

export function useChangeStageMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ChangeStageDto }) =>
      projectService.changeStage(id, dto),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: projectKeys.lists() })
      qc.setQueryData(projectKeys.detail(data.id), data)
      show({ title: "Stage updated", type: "success" })
    },
    onError: (err) => show({ title: "Failed to change stage", description: getApiErrorMessage(err), type: "error" }),
  })
}

export function useAddMilestoneMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: CreateMilestoneDto }) =>
      projectService.addMilestone(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: projectKeys.detail(id) })
      qc.invalidateQueries({ queryKey: projectKeys.lists() })
      show({ title: "Milestone added", type: "success" })
    },
    onError: (err) => show({ title: "Failed to add milestone", description: getApiErrorMessage(err), type: "error" }),
  })
}

export function useUpdateMilestoneMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ milestoneId, dto }: { milestoneId: number; dto: UpdateMilestoneDto }) =>
      projectService.updateMilestone(milestoneId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.lists() })
      show({ title: "Milestone updated", type: "success" })
    },
    onError: (err) => show({ title: "Failed to update milestone", description: getApiErrorMessage(err), type: "error" }),
  })
}

export function useAssignTeamMemberMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: AssignTeamMemberDto }) =>
      projectService.assignTeamMember(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: projectKeys.detail(id) })
      qc.invalidateQueries({ queryKey: projectKeys.lists() })
      show({ title: "Team member assigned", type: "success" })
    },
    onError: (err) => show({ title: "Failed to assign member", description: getApiErrorMessage(err), type: "error" }),
  })
}

export function useUnassignTeamMemberMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, employeeId }: { id: number; employeeId: number }) =>
      projectService.unassignTeamMember(id, employeeId),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: projectKeys.detail(id) })
      qc.invalidateQueries({ queryKey: projectKeys.lists() })
      show({ title: "Team member removed", type: "success" })
    },
    onError: (err) => show({ title: "Failed to remove member", description: getApiErrorMessage(err), type: "error" }),
  })
}

export function useDeleteProjectMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => projectService.deleteProject(id),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: projectKeys.detail(id) })
      qc.invalidateQueries({ queryKey: projectKeys.lists() })
      show({ title: "Project deleted", type: "success" })
    },
    onError: (err) => show({ title: "Failed to delete project", description: getApiErrorMessage(err), type: "error" }),
  })
}
