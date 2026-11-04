// Allow-list HTML cleaner for imported question packs. The built-in deck is sanitized at build
// time, but a pack is a file someone picked, so its HTML is cleaned before it is ever rendered.

const TAGS = new Set([
  "div", "p", "span", "b", "strong", "i", "em", "u", "sup", "sub", "br", "var", "img", "blockquote",
  "table", "thead", "tbody", "tr", "td", "th", "ol", "ul", "li",
  // MathML
  "math", "mi", "mn", "mo", "mtext", "mspace", "mrow", "mfrac", "msqrt", "mroot", "msup", "msub", "msubsup",
  "mover", "munder", "munderover", "mtable", "mtr", "mtd", "mstyle", "mpadded", "semantics",
]);

const ATTRS: Record<string, Set<string>> = {
  img: new Set(["src", "alt", "width", "height"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan"]),
  math: new Set(["display", "displaystyle"]),
  mo: new Set(["stretchy", "fence", "separator", "form", "lspace", "rspace"]),
  mfrac: new Set(["linethickness"]),
  mspace: new Set(["width"]),
  mstyle: new Set(["displaystyle", "scriptlevel"]),
};

/** Elements dropped together with everything inside them. */
const DROP = new Set(["script", "style", "iframe", "object", "embed", "template", "svg", "annotation", "annotation-xml", "form", "input", "button", "link", "meta"]);

const DATA_IMAGE = /^data:image\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/=\s]+$/;
const CLASS_OK = /^[\w\s-]{1,80}$/;
const NUMBER_OK = /^\d{1,4}$/;

function clean(el: ParentNode): void {
  for (const child of [...el.children]) {
    const tag = child.localName;
    if (DROP.has(tag)) {
      child.remove();
      continue;
    }
    if (!TAGS.has(tag)) {
      // Keep the text of unknown elements, lose the element.
      clean(child);
      child.replaceWith(...child.childNodes);
      continue;
    }
    for (const attr of [...child.attributes]) {
      const name = attr.name.toLowerCase();
      const value = attr.value;
      const ok =
        (name === "class" && CLASS_OK.test(value)) ||
        (ATTRS[tag]?.has(name) &&
          (name === "src" ? DATA_IMAGE.test(value) : name === "width" || name === "height" || name.endsWith("span") ? NUMBER_OK.test(value) : value.length < 200));
      if (!ok) child.removeAttribute(attr.name);
    }
    if (tag === "img" && !child.hasAttribute("src")) {
      child.remove();
      continue;
    }
    clean(child);
  }
}

/** Return `html` with only allowed tags and attributes left. Images must be inline data URIs. */
export function sanitizeHtml(html: string): string {
  // Template content is inert: nothing loads or runs while it is being cleaned.
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  clean(tpl.content);
  return tpl.innerHTML;
}
