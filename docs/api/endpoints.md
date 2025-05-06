# API Endpoints

## Authentication

- **POST /api/auth/register**
  - Body: `{ email: string, username: string, password: string }`
  - Response: `201`, `{ userId: number, email: string, username: string }`
- **POST /api/auth/login**
  - Body: `{ email: string, password: string }`
  - Response: `200`, `{ token: string, userId: number, email: string, username: string }`
- **POST /api/auth/logout**
  - Response: `200`, `{ message: "Logged out successfully" }`

## Plans

- **GET /api/plans**
  - Headers: `Authorization: Bearer <token>`
  - Response: `200`, `[Plan]`
- **POST /api/plans**
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ name: string, categories: string[], description: string, duration_weeks: number, difficulty: string, goal: string }`
  - Response: `201`, `Plan`

## Workouts

- **GET /api/workouts?plan_id=:id**
  - Headers: `Authorization: Bearer <token>`
  - Response: `200`, `[Workout]`
- **POST /api/workouts/:id/complete**
  - Headers: `Authorization: Bearer <token>`
  - Response: `200`, `{ message: string, workoutId: number }`

## Lifts

- **POST /api/lifts**
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ workout_id: number, base_lift_id: number, name: string, sets: number, reps: string[], ... }`
  - Response: `201`, `Lift`
