import { User } from "@clerk/nextjs/server";

export type SocketUser = {
  userId: string;
  socketId: string;
  profile: User;
};
