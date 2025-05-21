const userLifts = [
  {
    name: "Bench Press", // BB Bench
    max_weights: [185, 200, 215, 225, 240, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Dumbbell Bench Press",
    max_weights: [0, 75, 0, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Barbell Incline Press",
    max_weights: [0, 135, 165, 155, 175, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Incline Dumbbell Press",
    max_weights: [0, 65, 70, 75, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Machine Incline Press",
    max_weights: [0, 110, 120, 130, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Barbell Decline Press",
    max_weights: [0, 0, 0, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Dumbbell Decline Press",
    max_weights: [0, 75, 70, 75, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Machine Decline Press",
    max_weights: [0, 180, 0, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Barbell Shoulder Press",
    max_weights: [0, 100, 115, 130, 125, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Dumbbell Shoulder Press",
    max_weights: [0, 0, 60, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Arnold Press",
    max_weights: [0, 45, 50, 55, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Tricep Dips",
    max_weights: [0, 0, 0, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Machine Dips",
    max_weights: [0, 180, 180, 190, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Front Raise",
    max_weights: [25, 30, 0, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Machine Fly",
    max_weights: [107.5, 115, 122.5, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Dumbbell Pullover",
    max_weights: [0, 75, 80, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Tricep Extensions",
    max_weights: [50, 60, 70, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Barbell Row",
    max_weights: [175, 195, 215, 225, 215, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Dumbbell Row",
    max_weights: [95, 100, 105, 110, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Pull-Up",
    max_weights: [0, 0, 0, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "T-Bar Row",
    max_weights: [0, 115, 135, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Cable Row",
    max_weights: [145, 160, 175, 185, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Cable Pullup",
    max_weights: [0, 160, 175, 175, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Rear Delt Fly",
    max_weights: [25, 30, 0, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Lat Pushdown",
    max_weights: [100, 110, 120, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Back Extensions",
    max_weights: [0, 25, 35, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Good Mornings",
    max_weights: [0, 165, 155, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Face Pull",
    max_weights: [120, 135, 0, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Dumbbell Bicep Curl",
    max_weights: [0, 30, 35, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Squat",
    max_weights: [265, 275, 305, 325, 335, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Deadlift",
    max_weights: [0, 0, 285, 305, 325, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Barbell Lunge",
    max_weights: [0, 0, 145, 145, 150, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Dumbbell Lunge",
    max_weights: [0, 0, 60, 55, 60, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Leg Press",
    max_weights: [0, 370, 410, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Hack Squat",
    max_weights: [0, 270, 270, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Belt Squat",
    max_weights: [0, 320, 345, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Romanian Deadlift",
    max_weights: [0, 225, 245, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Bulgarian Split Squat",
    max_weights: [0, 50, 65, 60, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Glute Ham Raise",
    max_weights: [0, 0, 0, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Kickbacks",
    max_weights: [60, 85, 80, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Glute Swings",
    max_weights: [0, 80, 90, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Hip Thrust",
    max_weights: [0, 70, 80, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Leg Extension",
    max_weights: [90, 110, 0, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
  {
    name: "Leg Curl",
    max_weights: [70, 70, 80, 0, 0, 0, 0],
    rep_ranges: [12, 10, 8, 6, 5, 3, 1],
  },
];

module.exports = userLifts;
