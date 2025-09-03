// app/routes.js
import { index } from "@react-router/dev/routes";

export default [
  index("routes/home.jsx"),
  { path: "test", file: "routes/test.jsx" }, // <-- register /test
];
