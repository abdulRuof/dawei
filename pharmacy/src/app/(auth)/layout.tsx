export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main dir="rtl">
      {children}
    </main>
  );
}