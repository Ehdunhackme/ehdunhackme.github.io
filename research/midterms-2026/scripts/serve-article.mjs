import http from "node:http";
import fs from "node:fs/promises";

const body = await fs.readFile(new URL("../site/index.html", import.meta.url));
const port = Number(process.env.PORT || 4173);
http
  .createServer((request, response) => {
    if (request.url !== "/" && request.url !== "/index.html") {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "content-length": body.length,
    });
    response.end(body);
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`Article preview: http://127.0.0.1:${port}`);
  });
