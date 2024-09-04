"use client";
import { useSocket } from "@/context/SocketContext";
import React from "react";
import Avatar from "./Avatar";
import { Button } from "./ui/button";
import { MdCall, MdCallEnd } from "react-icons/md";

const CallNotification = () => {
  const { onGoingCall, handleJoinCall, hangUpCall } = useSocket();
  if (!onGoingCall?.isRinging) return;
  return (
    <div className="absolute bg-slate-500 w-screen h-screen top-0 left-0 flex items-center justify-center  bg-opacity-70">
      <div className="bg-white min-w-[300px] min-h-[100] flex flex-col items-center justify-center rounded p-4">
        <div className="flex flex-col items-center">
          <Avatar src={onGoingCall.participants.caller.profile.imageUrl} />
          <h3>
            {onGoingCall.participants.caller.profile.fullName?.split(" ")[0]}
          </h3>
        </div>
        <p className="text-sm mb-2 font-bold">Incoming Call</p>
        <div className="flex gap-4">
          <Button
            onClick={() => handleJoinCall(onGoingCall)}
            className="bg-green-600 hover:bg-green-800"
          >
            <MdCall size={24} />
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-800"
            onClick={() => {
              hangUpCall({
                onGoingCall: onGoingCall ? onGoingCall : undefined,
                isEmitHangup: true,
              });
            }}
          >
            <MdCallEnd size={24} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CallNotification;
