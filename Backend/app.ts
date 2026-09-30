import express = require("express");
import cors = require("cors");
import dotenv = require("dotenv");

import analisisRouter from "./routes/analisis.route";


dotenv.config();

const app = express();


/* =========================================================
   MIDDLEWARES
   ========================================================= */

app.use(cors());
app.use(express.json());


/* =========================================================
   ROUTES
   ========================================================= */

app.use(analisisRouter);


/* =========================================================
   SERVIDOR
   ========================================================= */

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});