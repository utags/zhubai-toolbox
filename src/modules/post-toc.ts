import { $, $$, addElement } from "browser-extension-utils"

export function showTOC() {
  const aside =
    $("#right_aside") ||
    addElement(document.body, "aside", {
      id: "right_aside",
    })

  const container =
    $("#right_aside .container") ||
    addElement(aside, "div", {
      class: "container",
    })

  container.innerHTML = ""
  let skippedFirst = false
  for (const heading of $$("#root h1, #root h2, #root h3")) {
    if (!skippedFirst) {
      skippedFirst = true
      continue
    }

    const a = addElement(container, "a", {
      class: "item",
      onclick() {
        setTimeout(() => {
          heading.scrollIntoView({ block: "start" })
          setTimeout(() => {
            document.scrollingElement?.scrollBy({
              top: -92,
            })
          }, 1)
        })
      },
    })
    addElement(a, heading.tagName.toLowerCase(), {
      class: "title",
      textContent: heading.textContent?.replace(/(↗|→)$/, ""),
    })
  }

  if (!skippedFirst) {
    // Content not loaded
    setTimeout(showTOC, 100)
  }
}
