import { setUserActive } from "@/app/admin/actions/account";
import { ConfirmActionButton } from "@/components/form/confirm-button";
import { StatusBadge } from "@/components/data-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Kartu status akun dengan tombol nonaktifkan/aktifkan (S1-10). */
export function AccountStatusCard({
  userId,
  username,
  isActive,
}: {
  userId: number;
  username: string;
  isActive: boolean;
}) {
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          Status akun <StatusBadge active={isActive} />
        </CardTitle>
        <CardDescription>
          Username: <span className="font-mono">{username}</span>.{" "}
          {isActive
            ? "Akun yang dinonaktifkan tidak bisa login, tetapi riwayat datanya tetap tersimpan."
            : "Akun ini tidak bisa login sampai diaktifkan kembali."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ConfirmActionButton
          action={setUserActive.bind(null, userId, !isActive)}
          label={isActive ? "Nonaktifkan akun" : "Aktifkan kembali"}
          confirmLabel={isActive ? "Nonaktifkan akun ini?" : undefined}
          variant={isActive ? "destructive" : "default"}
        />
      </CardContent>
    </Card>
  );
}
