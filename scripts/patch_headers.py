with open("src/lib/storage.ts", "r") as f:
    content = f.read()

old_header = "export const EMPLOYEE_HEADERS = ['id', 'name', 'email', 'phone', 'role', 'department', 'baseSalary', 'joiningDate', 'status', 'seatNumber', 'onboarding', 'mentorId', 'certifications', 'profileImage', 'cnicFrontImage', 'cnicBackImage'];"
new_header = "export const EMPLOYEE_HEADERS = ['id', 'name', 'email', 'phone', 'role', 'department', 'baseSalary', 'joiningDate', 'status', 'seatNumber', 'onboarding', 'mentorId', 'certifications', 'profileImage', 'cnicFrontImage', 'cnicBackImage', 'statusHistory', 'currentStatusSince', 'leaveStartDate', 'leaveEndDate', 'leaveType', 'suspensionStartDate', 'suspensionEndDate', 'suspensionReason', 'probationStartDate', 'probationEndDate', 'resignationDate', 'lastWorkingDate', 'retirementDate', 'terminationDate', 'terminationReason'];"

content = content.replace(old_header, new_header)

with open("src/lib/storage.ts", "w") as f:
    f.write(content)
