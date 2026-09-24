import './style.css'

const hours = [
  "12ص",
  "3ص",
  "6ص",
  "9ص",
  "12ظ",
  "3ظ",
  "6ظ",
  "9ظ",
];

const loadData = [
  22,
  18,
  15,
  38,
  55,
  71,
  62,
  42,
];

const logs = [
  {
    tag: "نجاح",
    cls: "",
    text: "تم نسخ قاعدة البيانات احتياطيًا بنجاح",
    time: "قبل 12 دقيقة",
  },
  {
    tag: "تحذير",
    cls: "warn",
    text: "بطء ملحوظ في استجابة خادم الصور",
    time: "قبل 40 دقيقة",
  },
  {
    tag: "خطأ",
    cls: "error",
    text: "فشل إرسال إشعار لعدد 4 مستخدمين",
    time: "قبل ساعة",
  },
  {
    tag: "نجاح",
    cls: "",
    text: "تم تحديث النظام إلى الإصدار 2.4.1",
    time: "قبل 3 ساعات",
  },
  {
    tag: "نجاح",
    cls: "",
    text: "تسجيل دخول ناجح للوحة تحكم المدير",
    time: "قبل 5 ساعات",
  },
];

export default function SystemMonitoring() {
  const maxLoad = 100;

  return (
    <section>

      <div className="kpi-grid">

        <div className="kpi-card">
          <span className="kpi-card__label">
            وقت التشغيل
          </span>

          <strong className="kpi-card__value">
            99.97%
          </strong>
        </div>

        <div className="kpi-card">
          <span className="kpi-card__label">
            زمن الاستجابة
          </span>

          <strong className="kpi-card__value">
            128ms
          </strong>
        </div>

        <div className="kpi-card">
          <span className="kpi-card__label">
            حمل الخادم
          </span>

          <strong className="kpi-card__value">
            42%
          </strong>
        </div>

        <div className="kpi-card">
          <span className="kpi-card__label">
            الجلسات النشطة الآن
          </span>

          <strong className="kpi-card__value">
            312
          </strong>
        </div>

      </div>

      <div className="panel">

        <div className="panel__head">
          <h3>
            حمل الخادم خلال 24 ساعة
          </h3>

          <span className="panel__note">
            نسبة الاستخدام %
          </span>
        </div>

        <div className="bar-chart">

          {loadData.map((value, index) => (
            <div
              className="bar-chart__col"
              key={hours[index]}
            >

              <span className="bar-chart__value">
                {value}%
              </span>

              <div
                className="bar-chart__bar"
                style={{
                  height: `${
                    (value / maxLoad) * 100
                  }%`,
                }}
              />

              <span className="bar-chart__label">
                {hours[index]}
              </span>

            </div>
          ))}

        </div>

      </div>

      <div className="panel">

        <div className="panel__head">
          <h3>
            سجل أحداث النظام
          </h3>
        </div>

        <ul className="log-list">

          {logs.map((log, index) => (
            <li key={index}>

              <span
                className={`log-tag ${log.cls}`}
              >
                {log.tag}
              </span>

              <span className="log-text">
                {log.text}
              </span>

              <span className="log-time">
                {log.time}
              </span>

            </li>
          ))}

        </ul>

      </div>

    </section>
  );
}