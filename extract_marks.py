import fitz
import json
import re
import os

pdf_dir = r"c:\Users\Haresh\OneDrive\Desktop\ml\new_Dataset"
output_json = r"c:\Users\Haresh\OneDrive\Desktop\ml\student-dashboard\public\dataset.json"

subject_mapping = {
    "AIML B - CIAT 1 _ Marks - EVS.pdf": "EVS",
    "Applied Physics_AIML_B.pdf": "Applied Physics",
    "COMPUTATIONAL PROBLEM SOLVING USING PYTHON CIAT 1 B MARK STATEMENT.pdf": "Python",
    "Foundations of Artificial Intelligence.pdf": "Artificial Intelligence",
    "CIAT I Mark Statement LAML AM B.pdf": "LAML"
}

students = {}

# Marks that indicate absence or failure
SPECIAL_MARKS = ["AB", "UA", "U"]

for pdf_name, subject_name in subject_mapping.items():
    pdf_path = os.path.join(pdf_dir, pdf_name)
    print(f"Processing {pdf_name}...")
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"Failed to open {pdf_name}: {e}")
        continue
    
    # Extract all text and split into lines
    text_lines = []
    for page in doc:
        text_lines.extend(page.get_text().split("\n"))
    
    # Clean lines
    text_lines = [line.strip() for line in text_lines if line.strip()]
    
    # We only care about the first occurrence of the student list (the main list)
    # Stop processing when we reach "Consolidated" or grade-specific lists
    stop_words = ["Consolidated", "Grade: O", "Grade: A+", "Grade: A", "Grade: B+", "Grade: B", "Grade: C", "Grade: U", "Grade: UA"]
    
    in_main_list = False
    for i in range(len(text_lines)):
        line = text_lines[i]
        
        if "List of Students and Internal Marks" in line:
            in_main_list = True
            continue
            
        if any(stop in line for stop in stop_words):
            if in_main_list: # If we were in the list and hit a stop word, we are done with the main list
                break
        
        if not in_main_list:
            continue

        # Match Roll Number (e.g., 25AM064)
        if re.match(r"^\d{2}[A-Z]{2}\d{3}$", line):
            roll = line
            
            # Find the semester (it's always '2' and comes after the name)
            # This helps us identify where the name ends and the marks begin
            semester_idx = -1
            for offset in range(1, 5):
                if i + offset >= len(text_lines):
                    break
                if text_lines[i+offset] == "2":
                    semester_idx = i + offset
                    break
            
            if semester_idx != -1:
                # Name is everything between Roll No and Semester
                name = " ".join(text_lines[i+1 : semester_idx])
                # Clean name from footer garbage
                name = re.split(r"\s{2,}|l to be valid|computer generated|Page \d", name)[0].strip()
                
                # Mark is two lines after semester (Semester -> Attendance -> Mark)
                if semester_idx + 2 < len(text_lines):
                    mark_line = text_lines[semester_idx + 2]
                    mark = 0
                    if mark_line.isdigit():
                        mark = int(mark_line)
                    elif mark_line in SPECIAL_MARKS:
                        mark = mark_line
                    else:
                        # Fallback: maybe special character in attendance pushed mark?
                        # Or attendance was empty and mark is at semester_idx + 1?
                        # Let's check semester_idx + 1 just in case
                        potential_mark = text_lines[semester_idx + 1]
                        if potential_mark.isdigit() or potential_mark in SPECIAL_MARKS:
                            mark = int(potential_mark) if potential_mark.isdigit() else potential_mark
                        else:
                            # Try one more offset
                            potential_mark = text_lines[semester_idx + 3] if semester_idx + 3 < len(text_lines) else ""
                            if potential_mark.isdigit() or potential_mark in SPECIAL_MARKS:
                                mark = int(potential_mark) if potential_mark.isdigit() else potential_mark
                    
                    if roll not in students:
                        students[roll] = {"roll": roll, "name": name}
                    students[roll][subject_name] = mark

student_list = list(students.values())
# Sort by roll number for consistency
student_list.sort(key=lambda x: x['roll'])

with open(output_json, "w") as f:
    json.dump(student_list, f, indent=2)

print(f"Generated dataset with {len(student_list)} students")
