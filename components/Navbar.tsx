import Image from "next/image";
import logo from "../img/Asset 3.png";
import man from "../img/man.png";
import { Bell } from "lucide-react";

const Navbar = () => {
  const userName = "Badache mahdi";
  return (
    <div className="bg-white h-[9vh] py-2 px-20 flex justify-between border-b border-gray-400 shadow-md   ">
      <Image className="w-45 h-16 pt-2" src={logo} alt="bwtools" />
      <div className="flex items-center gap-4">
        {/* Notification Icon */}
        <button className="relative">
          <Bell className="w-6 h-6" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Avatar and User Name */}
        <p className="text-sm font-medium ml-2 text-[#0B1DFF]">{userName}</p>
        <div className="flex items-center w-10 h-10 rounded-full overflow-hidden bg-gray-300">

          <Image src={man} alt="bwtools" width={150} />

        </div>

      </div>
    </div>
  );
};

export default Navbar;
