import { JSDOM } from "jsdom";
JSDOM.fromURL("http://localhost:3000/liveadmin", {
  runScripts: "dangerously",
  resources: "usable"
}).then(dom => {
  dom.window.console.error = (...args) => console.log("ERROR:", ...args);
  setTimeout(() => {
    console.log("Done. HTML:", dom.serialize().substring(0, 500));
  }, 3000);
}).catch(console.error);
