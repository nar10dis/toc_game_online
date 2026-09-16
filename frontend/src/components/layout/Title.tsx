export function Title({ children }: { children: React.ReactNode }) {
	return <h1 className="font-heading text-3xl font-bold">{children}</h1>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
	return <p className="mt-2 font-body text-sm font-normal text-muted-foreground">{children}</p>;
}
