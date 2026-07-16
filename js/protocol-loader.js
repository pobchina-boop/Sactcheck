(() => {
    "use strict";

    async function loadProtocols() {
        try {
            const indexResponse = await fetch("protocols/index.json");
            const index = await indexResponse.json();

            const protocols = [];

            for (const item of index.protocols) {
                if (item.enabled === false) continue;

                const response = await fetch(item.path);
                const protocol = await response.json();

                protocols.push(protocol);
            }

            window.SACTCHECK_PROTOCOLS = protocols;

            console.log("Loaded protocols:", protocols);

        } catch (err) {
            console.error("Protocol loader failed", err);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadProtocols);
    } else {
        loadProtocols();
    }
})();