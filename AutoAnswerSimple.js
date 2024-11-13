const prompt = document.querySelector("legend").innerText

const table = document.querySelector("table")
const tbody = table.querySelector("tbody")

const model = "meta-llama/Llama-Vision-Free"
const password = "AI"

function getAllOptions() {
  var options = "Options: "
  tbody.querySelectorAll("tr").forEach((option) => {
    const problem = option.children[2]
    const text = problem.innerText
    console.log(text)
  })
}

getAllOptions()

const chatHistory = [
  {
    role: "server",
    content:
      "Only give the response, and thats it. Give the response exactly as the options.",
  },
]

async function main() {
  const response = await fetch(
    "https://llm-xoyr.onrender.com/api/generate-text",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        model,
        password: password,
        chatHistory: chatHistory,
      }),
    },
  )

  const { data } = await response.json()
  alert(data)
}

main();
