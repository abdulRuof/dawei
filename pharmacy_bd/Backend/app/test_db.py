from sqlalchemy import text

from app.database.database import engine

try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("✅ تم الاتصال بقاعدة البيانات بنجاح")
        print("النتيجة:", result.scalar())

except Exception as e:
    print("❌ فشل الاتصال بقاعدة البيانات")
    print(e)