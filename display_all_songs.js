// ==UserScript==
// @name        Deezer List All Releases
// @description Lists ALL releases at the artist page, not just hand picked ones by deezer.
// @author      bertigert
// @version     1.0.1
// @icon        https://www.google.com/s2/favicons?sz=64&domain=deezer.com
// @namespace   Violentmonkey Scripts
// @match       https://www.deezer.com/*
// @grant       none
// ==/UserScript==


(function() {
    function log(...args) {
        console.log("[Display All Songs]", ...args);
    }
    function error(...args) {
        console.error("[Display All Songs]", ...args);
    }
    function debug(...args) {
        console.debug("[Display All Songs]", ...args);
    }

    const orig_fetch = window.fetch;

    window.history.pushState = new Proxy(window.history.pushState, {
        apply: (target, thisArg, argArray) => {
            if (location.pathname.includes("/artist/")) {
                artist_main();
            } else {
                log("Unhooking");
                window.fetch = orig_fetch;
            }
            return target.apply(thisArg, argArray);
        },
    });
    window.addEventListener("popstate", (e) => {
        if (location.pathname.includes("/artist/")) {
            artist_main();
        } else {
            log("Unhooking");
            window.fetch = orig_fetch;
        }
    });

    if (location.pathname.includes("/artist/")) {
        artist_main();
    }

    async function artist_main() {
        if (window.fetch != orig_fetch) { // already patched bc last page was artist
            return;
        }

        log("Hooking fetch");

        window.fetch = (...args) => {
            try {
                if (args[0] !== "https://pipe.deezer.com/api" ||
                    args[1].method !== "POST" ||
                    typeof args[1].body !== "string"
                ) {
                    return orig_fetch.apply(window, args);
                }
                const operation_name = args[1].body.match(/"operationName":\s*"(.*?)"/);
                if (operation_name && operation_name[1] === "ArtistDiscographyByType") {
                    debug('Catched original artist page fetch call');
                    args[1].body = args[1].body.replace(/"subType":\s*"(.*?)"/, '"subType": null')
                                                .replace(/"mode":\s*"(.*?)"/, '"mode": "ALL"');
                }

                return orig_fetch.apply(window, args);
            } catch (e) {
                error("Error in fetch hook:", e);
                return orig_fetch.apply(window, args);
            }
        }
    }
})();
