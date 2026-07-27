import type { ExerciseTemplate } from "./types";

export const EXERCISE_TEMPLATES: ExerciseTemplate[] = [
  {
    id: "login-post",
    label: "POST /login",
    description: "Auth JSON + Bearer attendu, status 200",
    title: "POST /api/login",
    expected: {
      method: "POST",
      urlIncludes: "/login",
      requiredHeaders: ["Content-Type", "Accept"],
      expectedStatus: 200,
      requireAuthorization: false,
      requireJsonBody: true,
    },
    snapshot: {
      method: "POST",
      url: "https://api.example.com/api/login",
      status: 401,
      statusText: "Unauthorized",
      durationMs: 90,
      requestHeaders: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      responseHeaders: { "content-type": "application/json" },
      requestBody: '{\n  "email": "lea@mail.com",\n  "password": "secret"\n}',
      responseBody: '{\n  "error": "invalid credentials"\n}',
      note: "",
    },
  },
  {
    id: "users-get",
    label: "GET /users (protégé)",
    description: "Authorization Bearer obligatoire",
    title: "GET /api/users",
    expected: {
      method: "GET",
      urlIncludes: "/users",
      requiredHeaders: ["Authorization"],
      expectedStatus: 200,
      requireAuthorization: true,
      requireJsonBody: false,
    },
    snapshot: {
      method: "GET",
      url: "https://api.example.com/api/users",
      status: 401,
      statusText: "Unauthorized",
      durationMs: 40,
      requestHeaders: {
        Accept: "application/json",
      },
      responseHeaders: { "content-type": "application/json" },
      requestBody: "",
      responseBody: '{\n  "error": "missing token"\n}',
      note: "",
    },
  },
  {
    id: "create-resource",
    label: "POST ressource",
    description: "JSON body + Content-Type + 201",
    title: "POST /api/items",
    expected: {
      method: "POST",
      urlIncludes: "/items",
      requiredHeaders: ["Content-Type"],
      expectedStatus: 201,
      requireAuthorization: true,
      requireJsonBody: true,
    },
    snapshot: {
      method: "POST",
      url: "https://api.example.com/api/items",
      status: 400,
      statusText: "Bad Request",
      durationMs: 55,
      requestHeaders: {
        "Content-Type": "text/plain",
        Authorization: "Bearer demo-token",
      },
      responseHeaders: { "content-type": "application/json" },
      requestBody: "name=cadeau",
      responseBody: '{\n  "error": "expected json"\n}',
      note: "",
    },
  },
];

export function getTemplate(id: string) {
  return EXERCISE_TEMPLATES.find((item) => item.id === id) || null;
}
