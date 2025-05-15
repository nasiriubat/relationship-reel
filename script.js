document.addEventListener('DOMContentLoaded', () => {
    const videoElement = document.getElementById('bgVideo');
    const quoteTextElement = document.getElementById('quoteText'); // Overlay quote
    const nextBtn = document.getElementById('nextBtn');
    
    const generatedTitleElement = document.getElementById('generatedTitle');
    const copyTitleBtn = document.getElementById('copyTitleBtn');
    const generatedDescriptionElement = document.getElementById('generatedDescription');
    const copyDescriptionBtn = document.getElementById('copyDescriptionBtn');

    const pixabayApiKey = '47019390-6889d1805ab0c476cb894cdc4';
    const defaultPixabayCategories = ['backgrounds', 'nature', 'feelings', 'health', 'places', 'transportation', 'travel', 'fun', 'animals', 'music', 'buildings', 'people', 'education', 'science', 'industry', 'food', 'sports'];
    let quotes = [];
    let currentQuote = null;
    let allQuotesLoaded = false;

    fetch('quotes.json')
        .then(response => response.json())
        .then(data => {
            quotes = data;
            allQuotesLoaded = true;
            if (quotes.length === 0) {
                console.error('No quotes loaded from quotes.json');
                quoteTextElement.textContent = 'Error: No quotes found.';
                generatedTitleElement.value = 'Error';
                generatedDescriptionElement.value = 'Could not load any quotes. Please check quotes.json.';
                return;
            }
            loadNewReelContent();
        })
        .catch(error => {
            console.error('Error loading quotes.json:', error);
            quoteTextElement.textContent = 'Failed to load quotes file.';
            generatedTitleElement.value = 'Error';
            generatedDescriptionElement.value = 'Failed to load quotes.json. Please check the file and console for errors.';
        });

    function getRandomItem(arr) {
        if (!arr || arr.length === 0) return null;
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function getRandomQuote() {
        if (!allQuotesLoaded || !quotes || quotes.length === 0) {
            // This case should ideally be handled by the fetch error/empty check
            currentQuote = { quote: 'No quotes available.', category: getRandomItem(defaultPixabayCategories) || 'general', title: 'Error', description: 'No quotes.' };
            return currentQuote;
        }
        currentQuote = getRandomItem(quotes); // Simply get a random quote
        if (!currentQuote) { // Fallback if getRandomItem returns null (e.g. empty quotes array after load)
             currentQuote = { quote: 'Could not retrieve a quote.', category: getRandomItem(defaultPixabayCategories) || 'general', title: 'Error', description: 'Quote retrieval failed.' };
        }
        return currentQuote;
    }

    async function fetchVideo() {
        let videoCategory;
        if (currentQuote && currentQuote.category && currentQuote.category.trim() !== '') {
            videoCategory = currentQuote.category;
        } else {
            // If quote has no category or it's empty, pick a random one from the default list
            videoCategory = getRandomItem(defaultPixabayCategories);
            console.warn('Current quote has no category or empty category, using random Pixabay category:', videoCategory);
        }
         if (!videoCategory) videoCategory = 'nature'; // Absolute fallback

        const videoApiUrl = `https://pixabay.com/api/videos/?key=${pixabayApiKey}&q=${encodeURIComponent(videoCategory)}&orientation=vertical&per_page=100&min_duration=10&safesearch=true`;
        try {
            const response = await fetch(videoApiUrl);
            if (!response.ok) {
                throw new Error(`Pixabay API error: ${response.status} for category ${videoCategory}`);
            }
            const data = await response.json();
            if (data.hits && data.hits.length > 0) {
                const videoInfo = getRandomItem(data.hits);
                const videoUrl = videoInfo.videos.medium?.url || videoInfo.videos.small?.url || videoInfo.videos.large?.url;
                if (videoUrl) {
                    videoElement.src = videoUrl;
                    videoElement.play().catch(e => console.error("Video play failed", e));
                } else {
                    console.error('No suitable video format found:', videoInfo);
                    setVideoPlaceholder('Video format error.');
                }
            } else {
                console.warn('No videos found for category:', videoCategory, 'API Response:', data);
                // Try one more time with a very generic category if the specific one fails
                if (videoCategory !== 'backgrounds') { 
                    console.log('Retrying with category: backgrounds');
                    currentQuote.category = 'backgrounds'; // Modify for the retry call.
                    await fetchVideo(); // Recursive call, be careful with this
                } else {
                    setVideoPlaceholder(`No videos for '${videoCategory}'.`);
                }
            }
        } catch (error) {
            console.error('Error fetching video:', error);
            setVideoPlaceholder('Could not load video.');
        }
    }
    
    function setVideoPlaceholder(message = 'Loading video...'){
        videoElement.poster = ''; 
        videoElement.src = ''; 
        console.info(message);
        quoteTextElement.textContent = message; 
        // Potentially update title/description too if video error is critical
        // generatedTitleElement.value = 'Video Error';
        // generatedDescriptionElement.value = message;
    }

    function updateMetaInfo(quote) {
        if (!quote || !quote.quote) {
            quoteTextElement.textContent = 'No quote loaded.';
            generatedTitleElement.value = 'Error: Quote has no text.';
            generatedDescriptionElement.value = 'Error: Quote has no text.';
            return;
        }

        quoteTextElement.textContent = quote.quote; // Update overlay with quote.quote
        
        // Use pre-defined title and description from the quote object
        generatedTitleElement.value = quote.title || 'Title not available.';
        generatedDescriptionElement.value = quote.description || 'Description not available.';

        // Ensure title is not overly long in case it wasn't properly set in JSON (optional safety)
        if (generatedTitleElement.value.length > 100) {
            // This is a fallback, ideally titles in JSON are already compliant
            console.warn("Title from JSON exceeds 100 chars, consider shortening in quotes.json:", quote.title);
            // generatedTitleElement.value = generatedTitleElement.value.substring(0, 97) + "..."; 
        }
    }

    function loadNewReelContent() {
        if (!allQuotesLoaded) {
            console.log("Quotes not loaded yet, deferring content load.");
            return;
        }
        if (quotes.length === 0){
            console.error("Cannot load new content, quotes array is empty.");
             quoteTextElement.textContent = 'Error: Quotes list is empty.';
            return;
        }
        const quote = getRandomQuote(); 
        updateMetaInfo(quote);
        fetchVideo();
    }


    function copyToClipboard(text, buttonElement, originalText) {
        if (text) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    buttonElement.textContent = 'Copied!';
                    setTimeout(() => { buttonElement.textContent = originalText; }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                    alert('Failed to copy. Please use Ctrl+C or Cmd+C.');
                });
        } else {
            alert('Nothing to copy.');
        }
    }

    copyTitleBtn.addEventListener('click', () => {
        copyToClipboard(generatedTitleElement.value, copyTitleBtn, 'Copy Title');
    });

    copyDescriptionBtn.addEventListener('click', () => {
        copyToClipboard(generatedDescriptionElement.value, copyDescriptionBtn, 'Copy Description');
    });

    nextBtn.addEventListener('click', loadNewReelContent);
    
    // Initial load is triggered after quotes are fetched
}); 