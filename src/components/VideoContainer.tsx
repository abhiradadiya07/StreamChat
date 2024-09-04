import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import React, { useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface iVideoCantainer {
  stream: MediaStream | null;
  isLocalStream: boolean;
  isOnCall: boolean;
  //   isVideoOn: boolean;
}
const VideoContainer = ({
  stream,
  isLocalStream,
  isOnCall,
}: //   isVideoOn,
iVideoCantainer) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  //   const { user } = useUser();
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      console.log();
    }
  }, [stream]);

  return (
    <>
      <video
        className={cn(
          "rounded border w-[800px]",
          isLocalStream &&
            isOnCall &&
            "w-[200px] h-auto absolute border-purple-500 border-2 mt-2 ml-2"
        )}
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocalStream}
      />
      {/* <div>
        {isLocalStream ? <Button>Hello</Button> : <Button>World</Button>}
      </div> */}
    </>
  );
};

export default VideoContainer;
