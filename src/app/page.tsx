import CallNotification from "@/components/CallNotification";
import ListOnlineUsers from "@/components/ListOnlineUsers";
import { Button } from "@/components/ui/button";
import VideoCall from "@/components/VideoCall";
import Image from "next/image";

export default function Home() {
  return (
    <main className="">
      <ListOnlineUsers />
      <CallNotification />
      <VideoCall />
    </main>
  );
}
