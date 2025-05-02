class Chat {
  static API_URL = "http://172.20.48.1:8000"

  static render() {
    const messages = this.getCommentStorage()

    messages.forEach(message => {
      this.insertChatItem(
        message.comment,
        message.sender,
        message.isResponse,
        message.moment
      )
    })
  }

  /**
   * @param {Event} event
   */
  static sendWithEnter(event) {
    if (event.key !== "Enter") {
      return
    }

    this.submit()
  }

  static submit() {
    const input = this.getMessageInput()
    const button = this.getSubmitButton()

    let value = null

    if (input) {
      value = input.value.toString().trim().toLowerCase()
    }

    if (!value || !button) {
      return
    }

    button.disabled = true
    input.disabled = true

    const userMessage = this.insertChatItem(input.value, 'Você')
    const botMessage = this.insertChatItem('Verificando comentário...', 'Asker', true)

    this.scrollChatToBottom()

    this.sendContent(input.value)
      .then(response => response.json())
      .then(response => {
        botMessage.querySelector(".content").textContent = response.emotion

        button.disabled = false
        input.disabled = false
        input.value = null
      })
      .catch(error => {
        console.log(error)

        button.disabled = false
        input.disabled = false
        botMessage.querySelector(".content").textContent = 'Ocorreu um erro e não foi possível enviar o comentário.'
      })
      .finally(() => {
        const userMessageContent = this.getContentFromMessage(userMessage)
        const botMessageContent = this.getContentFromMessage(botMessage)

        this.setCommentStorage(
          userMessageContent.comment,
          userMessageContent.sender,
          userMessageContent.moment,
          userMessageContent.isResponse
        )
        this.setCommentStorage(
          botMessageContent.comment,
          botMessageContent.sender,
          botMessageContent.moment,
          botMessageContent.isResponse
        )

        this.scrollChatToBottom()
        input.focus()
      })
  }

  static getMessageInput() {
    return document.querySelector('#chat-page article .question input')
  }

  static getSubmitButton() {
    return document.querySelector('#chat-page article .question button')
  }

  /**
   * @param {string} comment
   */
  static sendContent(comment) {
    return fetch(this.API_URL + "/ask", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment })
    })
  }

  static getSampleMessage() {
    const message = document.createElement("div")

    message.classList.add("message")

    const info = document.createElement("div")

    info.classList.add("info")

    info.appendChild(document.createElement("span"))
    info.appendChild(document.createElement("span"))

    const content = document.createElement("div")

    content.classList.add("content")

    message.appendChild(info)
    message.appendChild(content)

    return message
  }

  /**
   * @param {string} comment
   * @param {string} sender
   * @param {boolean} isResponse
   * @param {?string} moment
   */
  static insertChatItem(comment, sender, isResponse = false, moment = null) {
    const newMessage = this.getSampleMessage()

    if (isResponse) {
      newMessage.classList.add("left")
    } else {
      newMessage.classList.add("right")
    }

    newMessage.querySelector(".info span:nth-child(1)")
      .appendChild(document.createTextNode(sender))
    newMessage.querySelector(".info span:nth-child(2)")
      .appendChild(document.createTextNode(moment || this.getNowText()))

    newMessage.querySelector(".content")
      .appendChild(document.createTextNode(comment))

    document.querySelector("#chat-page article .chat").appendChild(newMessage)

    return newMessage
  }

  /**
   * @param {HTMLDivElement} messageElement
   * @return {{
   *   comment: string,
   *   sender: string,
   *   isResponse: boolean,
   *   moment: string
   * }}
   */
  static getContentFromMessage(messageElement) {
    const sender = messageElement.querySelector(".info span:nth-child(1)").textContent
    const moment = messageElement.querySelector(".info span:nth-child(2)").textContent
    const comment = messageElement.querySelector(".content").textContent
    const isResponse = messageElement.classList.contains('left')

    return { sender, moment, comment, isResponse }
  }

  static getNowText() {
    const now = new Date()

    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, "0")
    const day = now.getDate().toString().padStart(2, "0")
    const hour = now.getHours().toString().padStart(2, "0")
    const minutes = now.getMinutes().toString().padStart(2, "0")
    const seconds = now.getSeconds().toString().padStart(2, "0")

    return `${day}/${month}/${year} ${hour}:${minutes}:${seconds}`
  }

  /**
   * @returns {{
   *   comment: string,
   *   sender: string,
   *   isResponse: boolean,
   *   moment: string
   * }[]}
   */
  static getCommentStorage() {
    const messages = localStorage.getItem("@emotioner:messages")
    let content = []

    if (messages) {
      content = JSON.parse(messages)
    }

    return content
  }

  /**
   * @param {string} comment
   * @param {string} sender
   * @param {string} moment
   * @param {boolean} isResponse
   */
  static setCommentStorage(comment, sender, moment, isResponse = false) {
    let storage = this.getCommentStorage()

    if (!storage) {
      storage = []
    }

    storage.push({ comment, sender, isResponse, moment })
    localStorage.setItem("@emotioner:messages", JSON.stringify(storage))
  }

  static scrollChatToBottom() {
    const chat = document.querySelector("#chat-page article .chat")

    chat.scrollTop = chat.scrollHeight
  }

  static getReport() {
    fetch(this.API_URL + "/stats")
      .then(response => response.json())
      .then(response => {
        let content = {};

        if (response.metrics) {
          content = response.metrics
        }

        this.downloadJson(content)
      })
  }

  static getReportAll() {
    fetch(this.API_URL + "/stats_all")
      .then(response => response.json())
      .then(response => {
        let content = {};

        if (response.metrics) {
          content = response.metrics
        }

        this.downloadJson(content)
      })
  }

  static downloadJson(content) {
    const jsonString = JSON.stringify(content, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'stats.json';

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

Chat.render()