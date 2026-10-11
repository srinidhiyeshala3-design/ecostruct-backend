
const http = require("http");
const fs = require("fs");


const path = require("path");

const PORT = Number(process.env.PORT) || 5000;

const allowedOrigins = (process.env.FRONTEND_ORIGINS || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

const server = http.createServer((req, res) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type"
    );
  }


  if (req.method === "OPTIONS") {
  if (origin && !allowedOrigins.includes(origin)) {
    res.writeHead(403, {
      "Content-Type": "application/json"
    });

    return res.end(JSON.stringify({
      error: "This website is not allowed to access the API."
    }));
  }

  res.writeHead(204);
  return res.end();
}

  // Open EcoStruct website
  if (req.url === "/" && req.method === "GET") {
    const filePath = path.join(__dirname, "public", "index.html");

    return fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, {
          "Content-Type": "text/plain"
        });
        return res.end("Error loading EcoStruct website.");
      }

      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8"
      });
      res.end(content);
    });
  }

  // Calculate construction and demolition waste
  if (req.method === "POST" && req.url === "/api/calculate") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        const area = Number(data.area);
        const floors = Number(data.floors);
        const age = Number(data.age);

        if (
          !Number.isFinite(area) ||
          !Number.isFinite(floors) ||
          !Number.isFinite(age) ||
          area <= 0 ||
          floors <= 0 ||
          age < 0
        ) {
          res.writeHead(400, {
            "Content-Type": "application/json"
          });

          return res.end(JSON.stringify({
            error: "Enter valid area, floors, and building age."
          }));
        }

        // Preliminary waste assumption
        const wasteRate = 0.0025;
        const estimatedWasteTonnes = area * wasteRate;

        // Preliminary product recovery assumptions
      const recoveryRates = [
  { name: "Recycled sand", rate: 0.15, pricePerTonne: 600 },
  { name: "Recycled dust", rate: 0.20, pricePerTonne: 250 },
  { name: "20 mm aggregate", rate: 0.20, pricePerTonne: 475 },
  { name: "40 mm aggregate", rate: 0.20, pricePerTonne: 375 },
  { name: "Recovered steel", rate: 0.05, pricePerTonne: 35000 },
  { name: "Recovered glass", rate: 0.02, pricePerTonne: 2500 }
];

        const products = recoveryRates.map((item) => {
          const quantityTonnes =
            estimatedWasteTonnes * item.rate;

          return {
            name: item.name,
            quantityTonnes: Number(quantityTonnes.toFixed(2)),
            pricePerTonne: item.pricePerTonne,
            estimatedValue: Number(
              (quantityTonnes * item.pricePerTonne).toFixed(2)
            )
          };
        });

        const totalEstimatedValue = products.reduce(
          (total, item) => total + item.estimatedValue,
          0
        );

        // Send response AFTER calculating products and value
        res.writeHead(200, {
          "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
          buildingAreaSqFt: area,
          floors: floors,
          buildingAgeYears: age,
          estimatedWasteTonnes: Number(
            estimatedWasteTonnes.toFixed(2)
          ),
          products: products,
          totalEstimatedValue: Number(
            totalEstimatedValue.toFixed(2)
          ),
          note: "Preliminary estimates only. Recovery rates and prices must be calibrated using local recycling plant data."
        }));

      } catch (error) {
        console.error("Calculation error:", error);

        if (!res.headersSent) {
          res.writeHead(400, {
            "Content-Type": "application/json"
          });
        }

        res.end(JSON.stringify({
          error: "Unable to calculate. Check the input and backend."
        }));
      }
    });

    return;
  }
  // Unknown route
  res.writeHead(404, {
    "Content-Type": "application/json"
  });

  res.end(JSON.stringify({
    message: "Route not found"
  }));
});
server.listen(PORT, "0.0.0.0", () => {
  console.log(`EcoStruct server listening on port ${PORT}`);
});