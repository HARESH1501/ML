import os
import re

txt_dir = r"c:\Users\Haresh\OneDrive\Desktop\ml"
txt_files = [f for f in os.listdir(txt_dir) if f.endswith(".txt") and "output" not in f]

roll_pattern = re.compile(r"^\d{2}[A-Z]{2}\d{3}$")

all_students = {}

for txt_file in txt_files:
    print(f"Analyzing {txt_file}...")
    with open(os.path.join(txt_dir, txt_file), "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f.readlines()]
    
    for i in range(len(lines)):
        if roll_pattern.match(lines[i]):
            roll = lines[i]
            # Try to find a name which is usually the next line
            name = lines[i+1] if i+1 < len(lines) else "UNKNOWN"
            # Try to find a mark which is usually 4 lines ahead
            mark = "UNKNOWN"
            if i+4 < len(lines):
                mark = lines[i+4]
            
            if roll not in all_students:
                all_students[roll] = {"name": name, "appearances": []}
            
            all_students[roll]["appearances"].append({
                "file": txt_file,
                "name": name,
                "mark": mark,
                "line": i+1
            })

# Check for name inconsistencies
for roll, data in all_students.items():
    names = set(a["name"] for a in data["appearances"])
    if len(names) > 1:
        print(f"Inconsistent names for {roll}: {names}")
        for a in data["appearances"]:
            print(f"  {a['file']} (line {a['line']}): {a['name']}")

# Check for students missing from some files
all_txt_files = set(txt_files)
for roll, data in all_students.items():
    found_files = set(a["file"] for a in data["appearances"])
    if found_files != all_txt_files:
        missing = all_txt_files - found_files
        print(f"Student {roll} ({data['name']}) missing from {missing}")

print("Analysis complete.")
