import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { parseHTML } from "linkedom";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const javascript = await readFile(
  new URL("../assets/js/main.js", import.meta.url),
  "utf8",
);

function loadSite({ reducedMotion = true } = {}) {
  const { document, window } = parseHTML(html);
  let activeElement = document.body;
  let audioPlayed = false;

  Object.defineProperty(document, "activeElement", {
    configurable: true,
    get: () => activeElement,
  });
  window.HTMLElement.prototype.focus = function focus() {
    activeElement = this;
  };
  window.Element.prototype.getBoundingClientRect = () => ({
    bottom: 100,
    height: 100,
    left: 0,
    right: 100,
    top: 0,
    width: 100,
  });
  window.matchMedia = (query) => ({
    addEventListener() {},
    matches: query.includes("prefers-reduced-motion") && reducedMotion,
  });
  window.requestAnimationFrame = (callback) => {
    callback(0);
    return 1;
  };
  window.cancelAnimationFrame = () => {};

  const audio = document.querySelector("[data-celebration-sound]");
  audio.play = () => {
    audioPlayed = true;
    return Promise.resolve();
  };

  const context = vm.createContext(window);
  context.document = document;
  context.window = window;
  vm.runInContext(javascript, context);

  return { audioPlayed: () => audioPlayed, document, window };
}

function dispatchKey(window, target, key) {
  const event = new window.Event("keydown", { bubbles: true });
  Object.defineProperty(event, "key", { value: key });
  target.dispatchEvent(event);
}

test("mobile navigation opens accessibly and closes with Escape", () => {
  const { document, window } = loadSite();
  const button = document.querySelector("[data-mobile-nav-button]");
  const menu = document.querySelector("[data-mobile-nav]");
  const main = document.querySelector("[data-page-content]");
  const firstLink = menu.querySelector("[data-mobile-nav-link]");

  button.click();

  assert.equal(button.getAttribute("aria-expanded"), "true");
  assert.equal(menu.getAttribute("aria-hidden"), "false");
  assert.equal(menu.inert, false);
  assert.equal(main.inert, true);
  assert.equal(document.activeElement, firstLink);

  dispatchKey(window, document, "Escape");

  assert.equal(button.getAttribute("aria-expanded"), "false");
  assert.equal(menu.getAttribute("aria-hidden"), "true");
  assert.equal(menu.inert, true);
  assert.equal(main.inert, false);
  assert.equal(document.activeElement, button);
});

test("reduced-motion mode keeps sound but skips confetti", () => {
  const site = loadSite({ reducedMotion: true });
  site.document.querySelector("[data-celebrate]").click();

  assert.equal(site.audioPlayed(), true);
  assert.equal(site.document.querySelectorAll("canvas").length, 0);
});
