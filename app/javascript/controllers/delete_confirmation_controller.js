import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["modal", "deleteUrl"]

  show(event) {
    event.preventDefault()
    this.deleteUrlTarget.value = event.currentTarget.href
    this.modalTarget.classList.remove("hidden")
  }

  hide() {
    this.modalTarget.classList.add("hidden")
  }

  confirm() {
    // Create a form and submit it with DELETE method to work with Rails/Turbo
    const form = document.createElement("form")
    form.method = "POST"
    form.action = this.deleteUrlTarget.value

    const csrfToken = document.querySelector('meta[name="csrf-token"]').content
    const csrfInput = document.createElement("input")
    csrfInput.type = "hidden"
    csrfInput.name = "authenticity_token"
    csrfInput.value = csrfToken
    form.appendChild(csrfInput)

    const methodInput = document.createElement("input")
    methodInput.type = "hidden"
    methodInput.name = "_method"
    methodInput.value = "delete"
    form.appendChild(methodInput)

    document.body.appendChild(form)
    form.submit()
  }
}