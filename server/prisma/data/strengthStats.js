// Strength percentiles by lift, gender, and age range
// Data is approximate and should be updated with real statistics
module.exports = {
  bench_press: {
    male: {
      "18-29": {
        percentiles: {
          5: 95, // 5th percentile: 95 lbs
          25: 135, // 25th percentile: 135 lbs
          50: 175, // Median: 175 lbs
          75: 215, // 75th percentile: 215 lbs
          95: 285, // 95th percentile: 285 lbs
        },
      },
      // Add more age ranges as needed
    },
    female: {
      "18-29": {
        percentiles: {
          5: 45,
          25: 65,
          50: 85,
          75: 105,
          95: 145,
        },
      },
    },
  },
  squat: {
    male: {
      "18-29": {
        percentiles: {
          5: 125,
          25: 175,
          50: 225,
          75: 275,
          95: 365,
        },
      },
    },
    female: {
      "18-29": {
        percentiles: {
          5: 75,
          25: 95,
          50: 125,
          75: 155,
          95: 205,
        },
      },
    },
  },
  deadlift: {
    male: {
      "18-29": {
        percentiles: {
          5: 135,
          25: 185,
          50: 245,
          75: 305,
          95: 405,
        },
      },
    },
    female: {
      "18-29": {
        percentiles: {
          5: 85,
          25: 115,
          50: 145,
          75: 185,
          95: 245,
        },
      },
    },
  },
};
