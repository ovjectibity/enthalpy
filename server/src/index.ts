import express from "express";
import path from "path";
import { fileURLToPath } from "url"; // Import for ES Modules
// import cors from "cors"; // TODO: Add after installing dependency
// import { ComputerTool, Tool } fro../../computer-use-service/tools.js.js";
import hypothesesRoutes from "./routes/hypotheses.js";
import { threadsRouter } from "./routes/threads.js";
import contextRoutes from "./routes/context.js";
import metricsRoutes from "./routes/metrics.js";
import { MongoDBConnections } from "./services/mongoConnect.js";
import { MongoDBInitializer } from "./services/mongoInit.js";
import { Namespace, Server } from 'socket.io';
import { AgentService } from "./services/agent.js";
import { ThreadsService } from "./services/threadsService.js";
import { ProductContextService } from "./services/productContextService.js";
import {
  AgentClientToServerEvents,
  AgentServerToClientEvents,
  ThreadActivation,
  AppendMessageData,
  Contexts,
  Assets,
  ProductContextO,
  ObjectiveO,
  MetricO,
  Metric,
  ProductContext
} from "@enthalpy/shared";
import http from "http";
import { ObjectivesService } from "./services/objectivesService.js";
import { queryUtilities } from "./services/orm.js";

const app = express();
const port = process.env.APP_PORT;
const server = http.createServer(app);

const io = new Server(server,
  {
    cors: {
      origin: "http://localhost:3001",
      methods: ["GET", "POST"]
    }
  }); // attach socket.io to the server
const agentchat: Namespace<AgentClientToServerEvents,AgentServerToClientEvents> = io.of("/agent");
console.log("Running app at port", port);

// Initialize MongoDB connection
async function initializeMongoDB() {
  try {
    await MongoDBInitializer.initializeDatabase(
      process.env.SEED_MONGO_COLLECTION &&
      process.env.SEED_MONGO_COLLECTION === "1" ? true : false);
    console.log("MongoDB initialized successfully");
  } catch (error) {
    console.error("Failed to initialize MongoDB:", error);
    console.log("Continuing without MongoDB...");
  }
}

// Initialize MongoDB on startup
initializeMongoDB();

// Middleware
// app.use(cors()); // TODO: Enable after installing cors
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static client files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// app.use(express.static(path.join(__dirname, "client", "build"))); // Assuming client build output is in the 'client/dist' directory relative to the project root

// Routes
app.use("/api/hypotheses", hypothesesRoutes);
app.use("/api/threads", threadsRouter);
app.use("/api/context", contextRoutes);
app.use("/api/metrics", metricsRoutes);

app.use(express.static(path.join(__dirname, '../client_dist/build')));

// Error handling middleware
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  },
);

// 404 handler - This might be redundant with the '*' route above, but good to keep for explicit API 404s
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  try {
    await MongoDBConnections.closeConnection();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  try {
    await MongoDBConnections.closeConnection();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
  process.exit(0);
});

//Hierarchy here: User ID > Project ID > Agent
// Agent type to be handled via the event name
// TODO: Project ID to be handled via the event data json
// TODO: Handle thread ID via the event data json
// User ID to be handled via middleware
agentchat.use((socket, next) => {
  if(socket.handshake.auth.role === "user") {
    socket.data.userId = socket.handshake.auth.userId;
    next();
  }
  else next(new Error("Not a user"));
});

agentchat.on("connection", (socket) => {
  console.log("Client connected for agent chat:", socket.id);
  const aserv = new AgentService();
  const threadMap = new Map<number,string>();

  socket.on("activate_thread",async (msg: ThreadActivation) => {
    console.log("Got thread activation",msg);
    if(msg.agentName && threadMap.has(msg.threadId)) {
      //TODO: Handle threads via IDs rather than agent name.
      console.log(`Skipping thread activation for the ${msg.agentName} thread`);
      return;
    } else {
      threadMap.set(msg.threadId,msg.agentName);
    }
    let agentName = msg.agentName;
    let threadId = msg.threadId;
    //TODO: Handle projects & users here
    await ThreadsService.initializeActiveThreads(1,1);
    aserv.registerOutputCallback(agentName,
      async (msg: string) => {
          // console.log("Sending agent message: ",msg);
          let wrappedMsg = await ThreadsService.appendMessageToThread(threadId,
          {
            agentName: agentName,
            message: msg,
            role: "agent", //TODO: Handle other types here
            messageType: "static", //TODO: Handle other types here,
            threadId: threadId,
            projectId: 1 //TODO: Handle projectId here
          });
          if(wrappedMsg.data) {
            socket.emit("agent_message",wrappedMsg.data);
          } else {
            console.log("Error inserting agent thread message to mongo DB", wrappedMsg);
          }
      });
      aserv.registerModelProvidedObjectiveCallback(agentName, 
        async (objectiveContext: Contexts<ObjectiveO>): Promise<void> => {
          console.log("Storing objective context provided by the agent");
          objectiveContext.contexts.map(async (obj: ObjectiveO) => {
            await ObjectivesService.addObjective(1,1,"",obj.description);
          });
          socket.emit("update_state","contexts");
        }
      );
      aserv.registerModelProvidedProductContextCallback(agentName,
        async (productContexts: Contexts<ProductContextO>): Promise<void> => {
          console.log("Storing product context provided by the agent");
          let toAddContexts: ProductContext[] = 
          productContexts.contexts.map((ctx: ProductContextO) => {
            return {
              index: -1, //index will be ignore here anyway
              userId: 1,
              projectId: 1,
              createdAt: new Date(),
              type: ctx.type,
              content: ctx.content,
              description: ctx.description,
              format: ctx.format
            };
          });
          await ProductContextService.addProductContexts(toAddContexts);
          socket.emit("update_state","contexts");
        });
      aserv.registerModelProvidedMetricsCallback(agentName,
        async (metrics: Assets<MetricO>): Promise<void> => {
          console.log("Storing generated metrics provided by the agent");
          let toAddMetrics: Metric[] = 
          metrics.assets.map((metric: MetricO) => {
            return {
              id: -1, //index will be ignore here anyway
              userId: 1,
              projectId: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
              name: metric.name,
              formula: metric.formula,
              description: metric.description,
              metricTimeframe: metric.metricTimeframe,
              priority: metric.priority,
              retrievalPolicy: metric.retrievalPolicy
            };
          });
          await queryUtilities.addMetrics(toAddMetrics);
          socket.emit("update_state","metrics");
        });
      aserv.initAgentWorkflow(agentName);
  })

  socket.on("user_message", async (msg: AppendMessageData) => {
    console.log("Message received:", msg);
    let wrappedMsg = await ThreadsService.appendMessageToThread(msg.threadId,msg);
    if(wrappedMsg.data) {
      socket.emit("add_user_message",wrappedMsg.data);
      aserv.ingestUserInput(msg);
    } else {
      console.log("Error inserting user thread message to mongo DB", wrappedMsg);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    socket.disconnect();
  });
});

server.listen(process.env.AGENT_CHAT_PORT,
  () => console.log("Listening on http://localhost:${process.env.AGENT_CHAT_PORT}"));
