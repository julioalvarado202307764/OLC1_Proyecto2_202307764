import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

// Routes
import testRouter from "../routes/test.route";
dotenv.config();

export class Server {
  public app: Application;
  public port: number;

  // Rutas base
  private testPath = "/api/test"; 

  constructor() {
    this.app = express();
    this.port = Number(process.env.PORT) || 8082;

    this.middlewares();
    this.routes();
  }

  private middlewares() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private routes() {
    this.app.use(this.testPath, testRouter);
  }

  public async listen() {
    this.app.listen(this.port, async () => {
      console.log(`Server running on port ${this.port}`);
    });
  }
}