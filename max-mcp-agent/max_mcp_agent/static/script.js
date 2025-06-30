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
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Response:', data);
        
        this.char_found = data.char_found;
        this.in_string = data.in_string;
        this.num_times = data.num_times;
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error making request: ' + error.message);
    } finally {
        this.loading = false;
    }
}

window.submitQuery = submitQuery;
