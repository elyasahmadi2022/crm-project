// Accounts have moved to /admin/finance/accounts
import { redirect } from "next/navigation"

export default function AccountsRedirect() {
  redirect("/admin/finance/accounts")
}
