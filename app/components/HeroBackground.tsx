import { useEffect, useRef } from "react";

export default function HeroBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "100%");
      svg.setAttribute("viewBox", "0 0 1440 320");
      
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("fill", "#E5E7EB");
      path.setAttribute("fill-opacity", "0.1");
      path.setAttribute("d", "M0,64L48,80C96,96,192,128,288,133.3C384,139,480,117,576,106.7C672,96,768,96,864,112C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z");
      
      svg.appendChild(path);
      container.appendChild(svg);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-gradient-to-b from-blue-50/90 via-purple-50/60 to-white/30 backdrop-blur-sm"
    />
  );
}
