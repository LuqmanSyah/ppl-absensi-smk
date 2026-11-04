import { redirect } from "next/navigation";

// Proxy sudah mengarahkan "/" ke halaman sesuai peran. Ini hanya cadangan.
export default function Home() {
  redirect("/login");
}
