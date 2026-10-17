import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { target: 5, duration: "5s" },
    { target: 100, duration: "5s" },
    { target: 100, duration: "10s" },
    { target: 5, duration: "5s" },
  ],
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<800"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const res = http.get("http://localhost:3000/product-catalog/Mobility");

  check(res, { "status is 200": (r) => r.status === 200 });
  sleep(1);
}
