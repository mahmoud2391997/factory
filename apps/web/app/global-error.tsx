'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
          <h2>حدث خطأ غير متوقع</h2>
          <button
            type="button"
            onClick={() => reset()}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer', borderRadius: '4px' }}
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  )
}
