import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
// import onCall from "./src/socket-events/onCall.js";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);
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

    socket.on("webRtcSignal", (data) => {
      // console.log(data.isCaller,"*********");

      if (data.isCaller) {
        // console.log(
        //   "receiver",
        //   data.onGoingCall.participants.receiver.socketId
        // );

        if (data.onGoingCall.participants.receiver.socketId) {
          io.to(data.onGoingCall.participants.receiver.socketId).emit(
            "webRtcSignal",
            data
          );
        }
      } else {
        if (data.onGoingCall.participants.caller.socketId) {
          // console.log("caller", data.onGoingCall.participants.caller.socketId);

          io.to(data.onGoingCall.participants.caller.socketId).emit(
            "webRtcSignal",
            data
          );
        }
      }
    });

    socket.on("hangup", (data) => {
      let socketIdToEmit;
      if (
        data.onGoingCall.participants.caller.userId === data.userHangingUpId
      ) {
        socketIdToEmit = data.onGoingCall.participants.receiver.socketId;
      } else {
        socketIdToEmit = data.onGoingCall.participants.caller.socketId;
      }

      if (socketIdToEmit) {
        io.to(socketIdToEmit).emit("hangup");
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
