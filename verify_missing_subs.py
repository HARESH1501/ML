import json

json_path = r"student-dashboard/public/dataset.json"
subs = ['EVS', 'Applied Physics', 'Python', 'Artificial Intelligence', 'LAML']

with open(json_path, 'r') as f:
    data = json.load(f)

missing_count = 0
for student in data:
    for sub in subs:
        if sub not in student:
            print(f"Student {student['roll']} ({student['name']}) is missing subject: {sub}")
            missing_count += 1

if missing_count == 0:
    print("All students have data for all subjects.")
else:
    print(f"Total missing subject entries: {missing_count}")
