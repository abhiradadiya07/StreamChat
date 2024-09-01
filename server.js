import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
// import onCall from "./src/socket-events/onCall.js";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

export let io;
app.prepare().then(() => {
  const httpServer = createServer(handler);
  io = new Server(httpServer);
  let onlineUsers = [];
  io.on("connection", (socket) => {
    // ...

    // add new connected user
    socket.on("addNewUser", (clerkUser) => {
      clerkUser &&
        !onlineUsers.some((users) => users?.userId === clerkUser.id) &&
        onlineUsers.push({
          userId: clerkUser.id,
          socketId: socket.id,
          profile: clerkUser,
        });

      // send active users
      io.emit("getOnlineUsers", onlineUsers);
    });

    socket.on("disconnect", () => {
      onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
      // send active users
      io.emit("getOnlineUsers", onlineUsers);
    });

    // call events
    socket.on("call", (participants) => {
      if (participants.receiver.socketId) {
        io.to(participants.receiver.socketId).emit(
          "incomingCall",
          participants
        );
      }
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
