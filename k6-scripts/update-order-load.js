import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 10,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<800"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const res = http.post(
    "http://localhost:3000/update-order/real-order-123",
    JSON.stringify({ action: "PATCH" }),
    { headers: { "Content-Type": "application/json" } },
  );

  check(res, { "status is 200": (r) => r.status === 200 });
  sleep(1);
}
