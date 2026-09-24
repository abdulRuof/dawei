import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
p = r"C:\Users\القبس\Desktop\dodo12\pharmacy_bd\Backend\app\routers\admin.py"
lines = open(p, encoding="utf-8").readlines()

# block A = lines 36..142 (1-indexed)
del lines[35:142]  # remove lines 36-142 inclusive

open(p, "w", encoding="utf-8").write("".join(lines))
print("deleted block A; new total lines:", len(lines))