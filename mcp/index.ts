import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { fileURLToPath } from "node:url";
import { createServer } from "./server.js";

const kgDir = process.env.DESIGN_KG_DIR ?? fileURLToPath(new URL("../kg", import.meta.url));
const server = createServer(kgDir);
await server.connect(new StdioServerTransport());
