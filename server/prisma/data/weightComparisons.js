// Weight comparisons for visualizing total volume lifted
module.exports = {
  ranges: [
    {
      min_weight: 0,
      max_weight: 1000,
      objects: [
        {
          name: "Adult Lion",
          weight: 400,
          image_url: "/images/comparisons/lion.png",
          fun_fact: "You've lifted the equivalent of a male African lion!",
        },
        {
          name: "Grand Piano",
          weight: 700,
          image_url: "/images/comparisons/piano.png",
          fun_fact: "That's as heavy as a concert grand piano!",
        },
      ],
    },
    {
      min_weight: 1001,
      max_weight: 5000,
      objects: [
        {
          name: "Car",
          weight: 3000,
          image_url: "/images/comparisons/car.png",
          fun_fact: "You've lifted the weight of an average car!",
        },
        {
          name: "Adult Male Elephant",
          weight: 4000,
          image_url: "/images/comparisons/elephant.png",
          fun_fact: "That's like lifting an adult male African elephant!",
        },
      ],
    },
    {
      min_weight: 5001,
      max_weight: 20000,
      objects: [
        {
          name: "T-Rex",
          weight: 15000,
          image_url: "/images/comparisons/trex.png",
          fun_fact: "You've lifted as much as an adult T-Rex weighed!",
        },
        {
          name: "School Bus",
          weight: 12000,
          image_url: "/images/comparisons/bus.png",
          fun_fact: "That's the weight of a full school bus!",
        },
      ],
    },
    {
      min_weight: 20001,
      max_weight: 100000,
      objects: [
        {
          name: "SpaceX Falcon 9",
          weight: 50000,
          image_url: "/images/comparisons/falcon9.png",
          fun_fact: "You've lifted the equivalent of a SpaceX Falcon 9 rocket!",
        },
      ],
    },
    {
      min_weight: 100001,
      max_weight: Number.MAX_SAFE_INTEGER,
      objects: [
        {
          name: "Boeing 747",
          weight: 400000,
          image_url: "/images/comparisons/747.png",
          fun_fact: "You've lifted more than a Boeing 747 jumbo jet!",
        },
        {
          name: "Blue Whale",
          weight: 300000,
          image_url: "/images/comparisons/whale.png",
          fun_fact:
            "That's heavier than the largest animal ever known - the Blue Whale!",
        },
      ],
    },
  ],

  // Find the most appropriate comparison for a given weight
  findComparison: function (weight) {
    const range = this.ranges.find(
      (r) => weight >= r.min_weight && weight <= r.max_weight
    );
    if (!range) return null;

    // Find the closest object by weight
    return range.objects.reduce((closest, current) => {
      if (!closest) return current;
      return Math.abs(current.weight - weight) <
        Math.abs(closest.weight - weight)
        ? current
        : closest;
    }, null);
  },
};
