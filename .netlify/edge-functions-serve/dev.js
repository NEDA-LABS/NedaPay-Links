import { boot } from "https://v2-12-0--edge.netlify.com/bootstrap/index-combined.ts";

const functions = {}; const metadata = { functions: {} };


      try {
        const { default: func } = await import("file:///home/commendatore-baraka/Desktop/NEDA/NedaPay/merchant-portal/.netlify/edge-functions/___netlify-edge-handler-middleware/___netlify-edge-handler-middleware.js");

        if (typeof func === "function") {
          functions["___netlify-edge-handler-middleware"] = func;
          metadata.functions["___netlify-edge-handler-middleware"] = {"url":"file:///home/commendatore-baraka/Desktop/NEDA/NedaPay/merchant-portal/.netlify/edge-functions/___netlify-edge-handler-middleware/___netlify-edge-handler-middleware.js"}
        } else {
          console.log("\u001b[91m⬥\u001b[39m \u001b[31mFailed\u001b[39m to load Edge Function \u001b[33m___netlify-edge-handler-middleware\u001b[39m. The file does not seem to have a function as the default export.");
        }
      } catch (error) {
        console.log("\u001b[91m⬥\u001b[39m \u001b[31mFailed\u001b[39m to run Edge Function \u001b[33m___netlify-edge-handler-middleware\u001b[39m:");
        console.error(error);
      }
      

boot(functions, metadata);