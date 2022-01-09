import opensea from "./../images/opensea.svg";
import discord from "./../images/discord.svg";
import twitter from "./../images/twitter.svg";

import github from "./../images/github.png";

interface Props {}

function classNames(...classes: Array<string>) {
  return classes.filter(Boolean).join(" ");
}

const Info = (props: Props) => {
  return (
    <div className="ml-0 lg:flex lg:items-center lg:justify-between">
      <div className="flex-1 min-w-0">
        <h2 className="ml-3 text-2xl font-bold leading-7 text-white sm:text-3xl sm:truncate">
          SURREAL APES
        </h2>
        <h2 className="ml-3 text-lg font-bold leading-7 text-white sm:truncate">
          Phase 1
        </h2>
        <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
          <a
            href="https://opensea.io/collection/surreal-mint-pass"
            target="_blank"
            className={classNames(
              "text-gray-300 hover:bg-gray-700 hover:text-white mt-2",
              "px-3 py-2 rounded-md text-sm font-medium"
            )}
            aria-current={"page"}
          >
            <div className="flex items-center text-sm text-gray-300">
              <img
                className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500"
                aria-hidden="true"
                src={opensea}
              />
              Mint Pass
            </div>
          </a>
          <a
            href="https://opensea.io/collection/surrealapes"
            target="_blank"
            className={classNames(
              "text-gray-300 hover:bg-gray-700 hover:text-white mt-2",
              "px-3 py-2 rounded-md text-sm font-medium"
            )}
            aria-current={"page"}
          >
            <div className="flex items-center text-sm text-gray-300">
              <img
                className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500"
                aria-hidden="true"
                src={opensea}
              />
              SURREAL APES
            </div>
          </a>
          <a
            href="https://discord.gg/ccY5kQvK"
            target="_blank"
            className={classNames(
              "text-gray-300 hover:bg-gray-700 hover:text-white mt-2",
              "px-3 py-2 rounded-md text-sm font-medium"
            )}
            aria-current={"page"}
          >
            <div className="flex items-center text-sm text-gray-300">
              <img
                className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500"
                aria-hidden="true"
                src={discord}
              />
              Discord
            </div>
          </a>
          <a
            href="https://twitter.com/SurrealApes"
            target="_blank"
            className={classNames(
              "text-gray-300 hover:bg-gray-700 hover:text-white mt-2",
              "px-3 py-2 rounded-md text-sm font-medium"
            )}
            aria-current={"page"}
          >
            <div className="flex items-center text-sm text-gray-300">
              <img
                className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500"
                aria-hidden="true"
                src={twitter}
              />
              Twitter
            </div>
          </a>
          <a
            href="https://github.com/fancyrats/surreal.network"
            target="_blank"
            className={classNames(
              "text-gray-300 hover:bg-gray-700 hover:text-white mt-2",
              "px-3 py-2 rounded-md text-sm font-medium"
            )}
            aria-current={"page"}
          >
            <div className="flex items-center text-sm text-gray-300">
              <img
                className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500"
                aria-hidden="true"
                src={github}
              />
              Github
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Info;
