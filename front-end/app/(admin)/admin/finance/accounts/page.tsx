"use client"

import { useState } from "react"
import { Plus, Wallet, TrendingUp, TrendingDown, DollarSign, Eye, Edit, Trash2, Search } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount, useAccountTransactions } from "@/queries/account.queries"
import { type CreateAccountDto } from "@/services/account.service"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/lib/toast"

const ACCOUNT_TYPES = [
  { value: "DAKHAL", label: "Dakhal (Income)" },
  { value: "TAJIRI", label: "Tajiri (Business)" },
  { value: "BANK", label: "Bank Account" },
  { value: "CASH", label: "Cash" },
  { value: "OTHER", label: "Other" },
]

export default function AccountsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const { data: accounts, isLoading } = useAccounts()
  const createMutation = useCreateAccount()
  const updateMutation = useUpdateAccount()
  const deleteMutation = useDeleteAccount()
  const { data: transactions } = useAccountTransactions(selectedAccount?.id || 0)

  const [formData, setFormData] = useState<CreateAccountDto>({
    name: "",
    type: "DAKHAL",
    balance: 0,
    currency: "AFN",
    description: "",
  })

  const resetForm = () => {
    setFormData({ name: "", type: "DAKHAL", balance: 0, currency: "AFN", description: "" })
  }

  const handleCreate = () => {
    createMutation.mutate({
      ...formData,
      balance: Number(formData.balance) || 0
    } as CreateAccountDto, {
      onSuccess: () => {
        setCreateOpen(false)
        resetForm()
      },
    })
  }

  const handleEdit = () => {
    if (!selectedAccount) return
    updateMutation.mutate(
      { 
        id: selectedAccount.id, 
        data: {
          ...formData,
          balance: Number(formData.balance) || 0
        } as CreateAccountDto
      },
      {
        onSuccess: () => {
          setEditOpen(false)
          setSelectedAccount(null)
          resetForm()
        },
      }
    )
  }

  const openDeleteDialog = (account: any) => {
    setSelectedAccount(account)
    setDeleteDialogOpen(true)
  }

  const handleDelete = () => {
    if (!selectedAccount) return
    deleteMutation.mutate(selectedAccount.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false)
        setSelectedAccount(null)
      },
    })
  }

  const openEdit = (account: any) => {
    setSelectedAccount(account)
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency,
      description: account.description || "",
    })
    setEditOpen(true)
  }

  const openView = (account: any) => {
    setSelectedAccount(account)
    setViewOpen(true)
  }

  const totalBalance = accounts?.reduce((sum, acc) => sum + acc.balance, 0) || 0

  // Filter accounts based on search query
  const filteredAccounts = accounts?.filter((account) =>
    account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accounts Management</h1>
          <p className="text-muted-foreground mt-1">Manage your financial accounts</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBalance.toLocaleString()} AFN</div>
            <p className="text-xs text-muted-foreground">Across all accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts?.filter((a) => a.isActive).length || 0}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>All Accounts</CardTitle>
              <CardDescription>View and manage your financial accounts</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
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
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !filteredAccounts || filteredAccounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{searchQuery ? "No accounts found matching your search." : "No accounts found. Create your first account to get started."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{account.name}</p>
                          {account.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-md">{account.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{account.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.isActive ? "default" : "secondary"}>
                          {account.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="font-bold">{account.balance.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">{account.currency}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => openView(account)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openEdit(account)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openDeleteDialog(account)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Account Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
            <DialogDescription>Add a new financial account to your system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Account Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Dakhal Main Account"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Account Type *</Label>
              <Select value={formData.type || "DAKHAL"} onValueChange={(value) => value && setFormData({ ...formData, type: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="balance">Initial Balance</Label>
                <Input
                  id="balance"
                  type="number"
                  placeholder="0"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value || 'AFN' })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AFN">AFN</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                className="resize-none"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>Update account information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Account Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Account Type *</Label>
              <Select value={formData.type || "DAKHAL"} onValueChange={(value) => value && setFormData({ ...formData, type: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                className="resize-none"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Account Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Account Details</DialogTitle>
            <DialogDescription>View account information and recent transactions</DialogDescription>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Account Name</Label>
                  <p className="font-medium">{selectedAccount.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="font-medium">{selectedAccount.type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Balance</Label>
                  <p className="text-2xl font-bold">
                    {selectedAccount.balance.toLocaleString()} {selectedAccount.currency}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={selectedAccount.isActive ? "default" : "secondary"}>
                    {selectedAccount.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              {selectedAccount.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p>{selectedAccount.description}</p>
                </div>
              )}
              <div>
                <Label className="mb-2 block">Recent Transactions</Label>
                {transactions && transactions.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {transactions.slice(0, 10).map((txn) => (
                      <div key={txn.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <p className="text-sm font-medium">{txn.description || "Transaction"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(txn.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className={`font-bold ${txn.type === "CREDIT" ? "text-green-600" : "text-red-600"}`}>
                          {txn.type === "CREDIT" ? "+" : "-"}{txn.amount.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No transactions yet</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the account <strong>{selectedAccount?.name}</strong> and all associated transactions.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
