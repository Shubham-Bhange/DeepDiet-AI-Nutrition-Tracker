function bmi(weightKg, heightCm) {
  const h = heightCm / 100;
  return weightKg / (h * h);
}

function bmiCategory(b) {
  if (b < 18.5) return "Underweight";
  if (b < 25) return "Normal";
  if (b < 30) return "Overweight";
  return "Obese";
}

// Mifflin-St Jeor formula
function bmr({ gender, weightKg, heightCm, age }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "female" ? base - 161 : base + 5;
}

function activityFactor(level) {
  // standard factors
  if (level === "sedentary") return 1.2;
  if (level === "light") return 1.375;
  if (level === "moderate") return 1.55;
  if (level === "active") return 1.725;
  if (level === "very_active") return 1.9;
  return 1.2;
}

function recommendedCalories(profile) {
  const BMR = bmr(profile);
  return Math.round(BMR * activityFactor(profile.activity));
}

function recommendedMacros(calories) {
  // Simple balanced split: Protein 25%, Carbs 50%, Fat 25%
  const proteinCals = calories * 0.25;
  const carbsCals = calories * 0.50;
  const fatCals = calories * 0.25;

  return {
    protein_g: Math.round(proteinCals / 4),
    carbs_g: Math.round(carbsCals / 4),
    fat_g: Math.round(fatCals / 9)
  };
}
