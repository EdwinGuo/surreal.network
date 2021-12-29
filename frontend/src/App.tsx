/* This example requires Tailwind CSS v2.0+ */

import preview from "./images/preview.jpg";

import Footer from "./footer/Footer";
import Redeem from "./redeem/Redeem";
import Team from "./team/Team";
import Mintpass from "./mintpass/Mintpass";
import Info from "./header/Info";
import NavigationBar from "./navigationbar/NavigationBar";
import { RootState } from "./app/store";
import { useSelector } from "react-redux";
import Admin from "./admin/Admin";

export default function Example() {
  const { userInfo } = useSelector((state: RootState) => state.wallet);
  return (
    <>
      <div className="min-h-full">
        <nav>
          <NavigationBar></NavigationBar>
        </nav>
        <header className="bg-gray-600 shadow">
          <img src={preview} alt="Preview" />
        </header>
        <main>
          <div className="bg-gray-900 mx-auto py-6 sm:px-6 lg:px-8">
            <Info></Info>
            <Mintpass></Mintpass>
            <Redeem></Redeem>
            {userInfo?.isAdmin ?? false ? <Admin></Admin> : ""}
            <Team></Team>
          </div>
        </main>
        <Footer></Footer>
      </div>
    </>
  );
}
