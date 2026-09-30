import { useState } from "react";
import { KeyRound, ShieldAlert } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { HubStore } from "~/lib/hub/use-hub-store";

/** Tela de entrada: o CMS só grava dados para o administrador (ADMIN_TOKEN do Worker). */
export function LoginGate({ store }: { store: HubStore }) {
	const [token, setToken] = useState("");
	const [sending, setSending] = useState(false);
	const forbidden = store.mode === "forbidden";

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSending(true);
		const ok = await store.login(token);
		setSending(false);
		if (ok) setToken("");
	};

	return (
		<main className="flex min-h-dvh items-center justify-center bg-background p-4 sm:p-6">
			<form
				onSubmit={submit}
				className="w-full max-w-sm space-y-5 rounded-xl border bg-card p-5 shadow-sm sm:p-6"
			>
				<div className="flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
					RC
				</div>
				<div className="space-y-1">
					<h1 className="text-xl">CMS · Hub Editorial</h1>
					<p className="text-sm text-muted-foreground">Risco Cognitivo · Programa EXECUTAR</p>
				</div>
				{forbidden && (
					<p role="alert" className="flex gap-2 text-sm text-[var(--color-critical-default)]">
						<ShieldAlert className="mt-0.5 size-4 shrink-0" />
						Sessão sem acesso de administrador.
					</p>
				)}
				<div className="space-y-2">
					<Label htmlFor="admin-token">Token de administrador</Label>
					<Input
						id="admin-token"
						type="password"
						autoComplete="current-password"
						value={token}
						onChange={(e) => setToken(e.target.value)}
						placeholder="ADMIN_TOKEN"
						className="h-11 sm:h-9"
					/>
					{store.error && (
						<p role="alert" className="text-sm text-[var(--color-critical-default)]">
							{store.error}
						</p>
					)}
				</div>
				<div className="flex flex-col gap-2">
					<Button type="submit" disabled={!token || sending} className="h-11 sm:h-9">
						<KeyRound /> {sending ? "Entrando…" : "Entrar"}
					</Button>
					<Button type="button" variant="outline" onClick={store.startLocal} className="h-11 sm:h-9">
						Usar modo local (só neste navegador)
					</Button>
					<Button type="button" variant="ghost" asChild className="h-11 sm:h-9">
						<a href="/">Voltar ao Workflow EXECUTAR</a>
					</Button>
				</div>
			</form>
		</main>
	);
}
