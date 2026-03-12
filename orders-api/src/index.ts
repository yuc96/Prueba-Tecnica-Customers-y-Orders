import app from "./presentation/app.js";

const PORT = Number(process.env.PORT ?? 3002);
const server = app.listen(PORT, () => {
  console.log(`Orders API listening on port ${PORT}`);
});

export default server;
