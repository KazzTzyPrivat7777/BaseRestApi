const axios = require("axios");

async function llmProxy(q) {
  try {
    const history = [
      { role: "system", content: "Jawablah menggunakan Bahasa Indonesia yang baik dan benar." },
      { role: "user", content: q }
    ];

    const response = await axios({
      method: "post",
      url: "https://llmproxy.org/api/chat.php",
      data: {
        messages: history,
        model: "v3",
        cost: 1,
        stream: true,
        web_search: false
      },
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
        "Accept": "text/event-stream"
      },
      responseType: "stream"
    });

    return new Promise((resolve, reject) => {
      let fullText = "";

      response.data.on("data", (chunk) => {
        const lines = chunk.toString().split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataRaw = line.replace("data: ", "").trim();
            if (dataRaw === "[DONE]") continue;
            try {
              const json = JSON.parse(dataRaw);
              const content = json.choices?.[0]?.delta?.content || "";
              fullText += content;
            } catch (e) {}
          }
        }
      });

      response.data.on("end", () => resolve(fullText.trim()));
      response.data.on("error", (err) => reject(err));
    });
  } catch (e) {
    return null;
  }
}

module.exports = async function handler(req, res) {
  const q = req.query.q;
  if (!q) return res.status(400).json({ status: false, message: "q required" });

  try {
    const result = await llmProxy(q);
    if (!result) throw new Error("Gagal mendapatkan respon dari server.");
    res.json({ status: true, model: "deepseek-v3", result });
  } catch (e) {
    res.status(500).json({ status: false, message: e.message });
  }
};
