import Image from "next/image";
import React from "react";
import { FaUserCircle } from "react-icons/fa";

const Avatar = ({ src }: { src?: string }) => {
  if (src) {
    return (
      <div>
        <Image
          src={src}
          alt="Avatar"
          className="rounded-full"
          height={40}
          width={40}
        />
      </div>
    );
  }
  return <FaUserCircle size={24} />;
};

export default Avatar;
