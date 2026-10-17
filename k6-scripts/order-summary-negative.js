import http from "k6/http";
import { check, sleep } from "k6";

const scenarios = [
  "real-order-123",
  "real-order-123",
  "real-order-123",
  "real-order-123",
  "real-order-123",
  "real-order-123",
  "real-order-123",
  "quote-404",
  "quote-400",
  "quote-500",
];

export const options = {
  vus: 10,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<800"],
    http_req_failed: ["rate<0.40"],
  },
};

export default function () {
  const randomId = scenarios[Math.floor(Math.random() * scenarios.length)];

  const res = http.get(
    `http://localhost:3000/order-summary/${randomId}`,
  );

  check(res, {
    "status is expected": (r) => [200, 404, 400, 500].includes(r.status),
  });

  sleep(1);
}
