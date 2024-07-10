const readline = require('readline'); // Import the readline module to read input from the console

// Function to dynamically import node-fetch as it is an ES module
const importFetch = async () => {
    const { default: fetch } = await import('node-fetch');
    return fetch;
}

// Create an interface for reading input from the console
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Spotify API credentials
const SPOTIFY_CLIENT_ID = '3849d1f4666d48f6a1e7104e919198a0';
const SPOTIFY_CLIENT_SECRET = '05b5504b21094161a74d332dc58709b8';

// Function to get an access token from Spotify API
const getToken = async (id, secret) => {
    const fetch = await importFetch(); // Dynamically import node-fetch

    try {
        // Make a POST request to Spotify's token endpoint
        const tokenUrl = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials'
            })
        });

        if (!tokenUrl.ok) { // Check if the response is not OK
            throw new Error(tokenUrl.status); // Throw an error if the response status is not OK
        }

        const data = await tokenUrl.json(); // Parse the response JSON
        return data.access_token; // Return the access token
    } catch (error) {
        console.log('Error fetching token:', error); // Log any errors that occur during the request
    }
};

// Function to search for a song on Spotify
const searchSong = async (accessToken, input) => {
    const fetch = await importFetch(); // Dynamically import node-fetch

    try {
        const url = 'https://api.spotify.com/v1/search'; // Spotify search endpoint
        const query = encodeURIComponent(input); // Encode the input query
        const type = 'track'; // Search for tracks

        // Make a GET request to the Spotify search endpoint
        const result = await fetch(`${url}?q=${query}&type=${type}`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + accessToken },
        });

        if (!result.ok) { // Check if the response is not OK
            throw new Error(result.status); // Throw an error if the response status is not OK
        }

        const data = await result.json(); // Parse the response JSON

        // Check if no tracks were found
        if (!data.tracks || !data.tracks.items || data.tracks.items.length === 0) {
            console.log('No Songs were found with the name that was entered');
            return;
        } else {
            // Get the first track from the search results
            const track = data.tracks.items[0];
            const artist = track.artists[0].name; // Get the artist name
            const song = track.name; // Get the song name
            const link = track.external_urls.spotify; // Get the Spotify link
            const album = track.album.name; // Get the album name

            // Display the song information
            console.log('The top result for this song is');
            console.log("Artist: " + artist,
                "\nTrack: " + song,
                "\nFrom: " + album,
                "\nSpotify: " + link);
        }
    } catch (error) {
        console.log('Error searching for song:', error); // Log any errors that occur during the request
    }
};

// Function to prompt the user for a song name and search for it
const promptForSong = async (token) => {
    rl.question('Please enter a song name (or type "exit" to quit): ', async (songname) => {
        if (songname.toLowerCase() === 'exit') {
            rl.close(); // Close the readline interface
            return;
        }
        await searchSong(token, songname); // Search for the song with the entered name
        promptForSong(token); // Prompt for another song
    });
};

// Main function to run the application
const app = async () => {
    const token = await getToken(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET); // Get the access token

    if (!token) { // Check if the token was not retrieved
        console.log("Cannot get token");
        return;
    }
    promptForSong(token); // Start prompting for songs
};

app();