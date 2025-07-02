async function submitQuery() {
    if (!this.query.trim()) {
        alert('Please enter a query');
        return;
    }

    this.loading = true;

    try {
        const response = await fetch('/api/count', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: this.query })
        });

        if (!response.ok) {
            const message = "The agent encountered a problem trying to handle your query:"
            throw new Error(`${message} ${response.status}`);
        }

        const data = await response.json();
        console.log('Response:', data);

        this.char_found = data.char_found;
        this.in_string = data.in_string;
        this.num_times = data.num_times;

    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    } finally {
        this.loading = false;
    }
}

window.submitQuery = submitQuery;
