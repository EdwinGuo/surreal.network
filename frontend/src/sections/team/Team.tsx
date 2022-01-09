import React from "react";
import dave from "./../images/dave.png";
import dejen from "./../images/dejen.png";
import gerry from "./../images/gerry.png";
import asherah from "./../images/asherah.png";

interface Props {}

const people = [
  {
    name: "Ξ GERRY Ξ",
    role: "Artist",
    imageUrl: gerry,
    twitterUrl: "https://twitter.com/nftgerry",
  },
  {
    name: "Dave | fancyrats.eth",
    role: "Dev",
    imageUrl: dave,
    twitterUrl: "https://twitter.com/fancyrats_eth",
  },
  {
    name: "dejen.eth",
    role: "Operations",
    imageUrl: dejen,
    twitterUrl: "https://twitter.com/dejen_art",
  },
  {
    name: "asherah.eth",
    role: "Advisor",
    imageUrl: asherah,
    twitterUrl: "https://twitter.com/AsherahEth",
  },
];

const Team = (props: Props) => {
  return (
    <div className="bg-gray-900" id="Team">
      <div className="mx-auto py-12 px-4 max-w-7xl sm:px-6 lg:px-8 lg:py-24">
        <div className="space-y-12">
          <div className="space-y-5 sm:space-y-4 md:max-w-xl lg:max-w-3xl xl:max-w-none">
            <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              The Surreal Team
            </h2>
          </div>
          <ul
            role="list"
            className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-6 sm:space-y-0 lg:grid-cols-3 lg:gap-8"
          >
            {people.map((person) => (
              <li
                key={person.name}
                className="py-10 px-6 bg-gray-800 text-center rounded-lg xl:px-10 xl:text-left"
              >
                <div className="space-y-6 xl:space-y-10">
                  <img
                    className="mx-auto h-40 w-40 rounded-full xl:w-56 xl:h-56"
                    src={person.imageUrl}
                    alt=""
                  />
                  <div className="space-y-2 xl:flex xl:items-center xl:justify-between">
                    <div className="font-medium text-lg leading-6 space-y-1">
                      <h3 className="text-white">{person.name}</h3>
                      <p className="text-indigo-400">{person.role}</p>
                    </div>

                    <ul role="list" className="flex justify-center space-x-5">
                      <li>
                        <a
                          href={person.twitterUrl}
                          className="text-gray-400 hover:text-gray-300"
                          target="_blank"
                        >
                          <span className="sr-only">Twitter</span>
                          <svg
                            className="w-5 h-5"
                            aria-hidden="true"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                          </svg>
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Team;
