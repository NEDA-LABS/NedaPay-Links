import { stablecoins } from '../data/stablecoins';

const HeroFlags = () => {
  return (
    <div className="flex items-center gap-6 pt-4 w-full pl-5">
      <div className="flex flex-col items-start gap-2">
        <div className="flex -space-x-2">
          {stablecoins.map((coin, index) => (
            <div
              key={index}
              className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-2xl bg-gradient-to-br from-blue-500 to-indigo-500 to-purple-500"
            >
              {coin.flag}
            </div>
          ))}
        </div>
        <span className="text-sm text-gray-600">Accept different stablecoins across different regions</span>
      </div>
    </div>
  );
};

export default HeroFlags;