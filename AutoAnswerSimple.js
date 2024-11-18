class QuizHandler {
  constructor() {
    this.form = document.getElementById("quiz-form")
    this.tbody = this.form.querySelector("tbody")
    this.model = "meta-llama/Meta-Llama-3-8B-Instruct-Lite"
    this.password = "AI"
    this.question = document.querySelector("legend").innerText
    this.chatHistory = [
      {
        role: "system",
        content:
          `You're a helpful assistant that helps solves problems, your response should only be like this: "Option 1", "Example 1"`,
      },
    ]
  }

  showNotification(message, isSuccess = true) {
    alert(message)
  }

  getAllOptions() {
    return Array.from(this.tbody.querySelectorAll("tr"))
      .map((option) => option.children[2].innerText)
      .join("; ")
  }

  handleResponse(response) {
    if (response) {
      this.showNotification(`Answer received: ${response}`)
    } else {
      this.showNotification("⚠ No answer received", false)
    }
  }

  async send() {
    const prompt = `These are the options: ${this.getAllOptions()}. To this problem: ${this.question}. I only need the answer, nothing else. For example option 1.`

    try {
      const response = await fetch(
        "https://llm-xoyr.onrender.com/api/generate-text",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            model: this.model,
            password: this.password,
            chatHistory: this.chatHistory,
          }),
        },
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const { data } = await response.json()
      this.handleResponse(data)
    } catch (error) {
      this.showNotification(`⚠ Error: ${error.message}`, false)
    }
  }
}

const quizHandler = new QuizHandler()
quizHandler.send()
