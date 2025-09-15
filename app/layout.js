export const metadata = {
  title: 'Multi-Tenant Notes SaaS',
  description: 'A secure multi-tenant notes application',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}