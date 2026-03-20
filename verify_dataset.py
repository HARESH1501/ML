import json
import os

json_path = r"student-dashboard/public/dataset.json"

with open(json_path, 'r') as f:
    data = json.load(f)

subjects = {
    "EVS": {"threshold": 15},
    "Applied Physics": {"threshold": 30},
    "Python": {"threshold": 30},
    "Artificial Intelligence": {"threshold": 30},
    "LAML": {"threshold": 30}
}

print(f"{'Subject':<25} | {'Pass':<5} | {'Fail':<5} | {'Absent':<6}")
print("-" * 50)

for sub, config in subjects.items():
    pass_count = 0
    fail_count = 0
    absent_count = 0
    
    threshold = config["threshold"]
    
    for student in data:
        mark = student.get(sub)
        if mark is None:
            continue
            
        if isinstance(mark, (int, float)):
            if mark >= threshold:
                pass_count += 1
            else:
                fail_count += 1
        else: # Special marks like "AB", "UA", "U"
            if mark == "U":
                # U mark is usually fail? Let's check.
                # In the PDF, U Grade is fail.
                fail_count += 1
            else:
                absent_count += 1
                
    print(f"{sub:<25} | {pass_count:<5} | {fail_count:<5} | {absent_count:<6}")

print(f"\nTotal students: {len(data)}")
