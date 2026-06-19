const button = document.getElementById("generateBtn");
const loader = document.getElementById("loader");

button.addEventListener("click", async () => {

    const url = document.getElementById("videoUrl").value;

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

        console.log("SERVER RESPONSE:");
        console.log(data);

        if (!response.ok) {
            throw new Error(
                data.message || "Server Error"
            );
        }

        document.getElementById("summary").innerText =
            data.summary;

        document.getElementById("topics").innerText =
            data.topics;

        document.getElementById("explanation").innerText =
            data.explanation;

    } catch (error) {

        console.error(error);

        alert(error.message);

    } finally {

        loader.style.display = "none";

    }

});