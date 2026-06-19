const button = document.getElementById("generateBtn");
const loader = document.getElementById("loader");

button.addEventListener("click", async () => {

    const url = document.getElementById("videoUrl").value.trim();

    if (!url) {
        alert("Please enter a YouTube URL");
        return;
    }

    loader.style.display = "flex";

    try {

        const response = await fetch("/api/summarize", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to generate summary");
        }

        document.getElementById("summary").innerText =
            data.summary || "No summary available.";

        let topicsText = "";

        if (Array.isArray(data.topics)) {
            topicsText = data.topics.map(topic => `• ${topic}`).join("\n");
        } else if (typeof data.topics === "string") {
            topicsText = data.topics;
        } else {
            topicsText = "No topics available.";
        }

        document.getElementById("topics").innerText = topicsText;

        document.getElementById("explanation").innerText =
            data.explanation || "No explanation available.";

    } catch (error) {

        console.error(error);

        alert(error.message);

    } finally {

        loader.style.display = "none";

    }

});