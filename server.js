import app from "./index.js";

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running locally on port ${PORT}`);
  });
}
