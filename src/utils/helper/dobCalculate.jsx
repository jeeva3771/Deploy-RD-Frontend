export function calculateAge(dob) {
  if (!dob) return null;

  // dob format: "YYYY-MM-DD"
  const [year, month, day] = dob.split("-").map(Number);

  // Create date in local timezone (month is 0-based)
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }
  return age;
}
