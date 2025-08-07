import Image from "next/image";

export default function ChainsWidget() {
  const avatars = [
    { id: 1, color: "bg-yellow-400", image: "/base.svg" },
    { id: 2, color: "bg-blue-400", image: "/polygon.svg" },
    { id: 3, color: "bg-pink-400", image: "/scroll.svg" },
    { id: 4, color: "bg-purple-400", image: "/arbitrum.svg" },
    { id: 5, color: "bg-orange-400", image: "/bnb.svg" },
    { id: 6, color: "bg-green-400", image: "/celo.svg" },
    { id: 7, color: "bg-teal-400", image: "/optimism.svg" },
  ];

  return (
    <div className="flex flex-col items-center mb-6 mx-auto items-center justify-center">
      <div className="flex -space-x-2 md:-space-x-10 mx-auto">
        {avatars.map((avatar, index) => (
          <div
            key={avatar.id}
            className={`w-8 h-8 md:w-20 md:h-20 rounded-full aspect-square flex items-center justify-center text-white font-semibold text-sm relative z-${10 - index}`}
            style={{ zIndex: 10 - index }}
          >
            <Image
              src={avatar.image}
              alt={avatar.id.toString()}
              width={50}
              height={50}
              className="rounded-full bg-white"
            />
          </div>
        ))}
      </div>
      <div className="flex ml-6 items-center justify-center">
        <div className="text-white text-sm md:text-2xl font-bold items-center justify-center pl-2">
          5+ Chains
        </div>
      </div>
    </div>
  );
}
