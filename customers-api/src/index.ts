import app from "./presentation/app.js";

const PORT = Number(process.env.PORT ?? 3001);
const server = app.listen(PORT, () => {
  console.log(`Customers API listening on port ${PORT}`);
});

export default server;
