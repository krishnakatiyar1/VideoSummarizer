const button = document.getElementById("generateBtn");
const loader = document.getElementById("loader");

function getVideoId(url) {

    try {

        const parsedUrl = new URL(url);

        if (parsedUrl.pathname.includes("/shorts/")) {
            return parsedUrl.pathname.split("/shorts/")[1];
        }

        if (parsedUrl.hostname === "youtu.be") {
            return parsedUrl.pathname.substring(1);
        }

        return parsedUrl.searchParams.get("v");

    } catch {

        return null;
    }
}

function copyText(id) {

    const text =
        document.getElementById(id).innerText;

    navigator.clipboard.writeText(text);

    alert("Copied Successfully!");
}

button.addEventListener("click", async () => {

    const url =
        document.getElementById("videoUrl").value.trim();

    if (!url) {

        alert("Please enter a YouTube URL");

        return;
    }

    loader.style.display = "flex";

    try {

        const response = await fetch(
            "/api/summarize",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({ url })
            }
        );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to generate summary"
            );
        }

        const videoId =
            getVideoId(url);

        const thumbnail =
            `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

        document
            .getElementById("videoThumbnail")
            .src = thumbnail;

        document
            .getElementById("videoThumbnail")
            .style.display = "block";

        document
            .getElementById("videoTitle")
            .innerText =
            `Video ID: ${videoId}`;

        document.getElementById("summary")
            .innerText =
            data.summary ||
            "No summary available.";

        let topicsText = "";

        if (Array.isArray(data.topics)) {

            topicsText =
                data.topics
                    .map(
                        topic =>
                            `• ${topic}`
                    )
                    .join("\n");

        } else {

            topicsText =
                data.topics ||
                "No topics available.";
        }

        document
            .getElementById("topics")
            .innerText =
            topicsText;

        document
            .getElementById("explanation")
            .innerText =
            data.explanation ||
            "No explanation available.";

    } catch (error) {

        console.error(error);

        alert(error.message);

    } finally {

        loader.style.display = "none";
    }

});