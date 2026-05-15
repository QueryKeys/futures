export default function AboutPage() {
  return (
    <div className="min-h-screen pb-20 md:pb-8 max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-fg mb-1">אודות פוליראדאר</h1>
      <p className="text-fg-subtle text-sm mb-8">מודיעין שוקי חיזוי לסוחרים ישראלים</p>

      <section className="mb-8 space-y-3">
        <h2 className="text-base font-semibold text-fg">מה זה פוליראדאר?</h2>
        <p className="text-sm text-fg-muted leading-relaxed">
          פוליראדאר הוא כלי ניתוח בזמן אמת לשוקי חיזוי של Polymarket.
          הפלטפורמה מספקת סורק שלוש-רמות, מעקב אחר עסקאות גדולות, וסקירת אירועים פעילים —
          כולם בממשק עברי מותאם.
        </p>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-base font-semibold text-fg">כלי הניתוח</h2>
        <div className="grid gap-3">
          {[
            {
              title: "סורק שלוש-רמות",
              desc: "כסף חכם · קונצנזוס · הצלף — סיווג אוטומטי של שוקים לפי מאפיינים",
            },
            {
              title: "ראדאר כרישים",
              desc: "מעקב אחר עסקאות גדולות בזמן אמת לזיהוי תנועת כסף מוסדי",
            },
            {
              title: "אירועים",
              desc: "טבלת כל אירועי Polymarket הפעילים ממוינת לפי מחזור",
            },
          ].map(({ title, desc }) => (
            <div
              key={title}
              className="rounded-lg border border-border bg-bg-raised p-3"
            >
              <p className="text-sm font-medium text-fg mb-0.5">{title}</p>
              <p className="text-xs text-fg-subtle">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-base font-semibold text-fg">הגבלות שיפוט</h2>
        <div className="rounded-xl border border-border bg-bg-raised p-4">
          <p className="text-sm text-fg-muted leading-relaxed">
            השימוש ב-Polymarket עשוי להיות מוגבל בתחומי שיפוט מסויימים, כולל ישראל.
            פוליראדאר מספק מידע ניתוחי בלבד ואינו מאפשר מסחר ישיר.
            ודא את חוקי המדינה שלך לפני השימוש בפלטפורמת המסחר.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-danger/20 bg-danger/5 p-4">
        <p className="text-xs text-fg-muted leading-relaxed">
          <span className="font-semibold text-danger">אזהרה:</span>{" "}
          אין לראות בכל מידע המוצג באתר זה ייעוץ השקעות, המלצה לרכישה או מכירה של כל
          נכס. המידע מוצג לצרכי לימוד ומחקר בלבד. כל החלטת השקעה היא באחריות
          המשתמש בלבד.
        </p>
      </section>
    </div>
  );
}
