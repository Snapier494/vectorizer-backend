const express = require('express');
const request = require('request');
const multer = require('multer');
const fs = require('fs');
const app = express();
const port = 8000; // or any port you prefer

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Assuming you're using body-parser middleware to parse incoming request bodies
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Define a route
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// Configure multer to handle file uploads
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 50 * 1024 * 1024, // 10MB, adjust this value according to your requirements
    },
});

app.post('/vectorize', upload.single('imageData'), (req, res) => {
    try {
        const imageData = req.file;
        console.log('imageFile = ', imageData);

        // Send the image data to Vectorizer AI API
        request.post({
            url: 'https://vectorizer.ai/api/v1/vectorize',
            formData: {
                image: fs.createReadStream(imageData.path),
                mode: 'test',
                format: 'eps',
                colors: '0'
            },
            auth: { user: 'vks5298npigd3lh', pass: 'jvh4jek39ossop8oggp8i5j2otefph218rc36rg3f6as4csm80i9' },
            followAllRedirects: true,
            encoding: null
        }, function (error, response, body) {
            if (error) {
                console.error('Request failed:', error);
                res.status(500).send({ error: 'Request failed' });
            } else if (!response || response.statusCode != 200) {
                console.error('Error:', response && response.statusCode, body.toString('utf8'));
                res.status(500).send({ error: 'Internal server error' });
            } else {
                // Save result
                console.log('body = ', body.toString('utf8'));
                fs.writeFileSync("result.png", body);
                res.status(200).send({ message: 'Image vectorized successfully', vectorizedData: body.toString('utf8') });
            }
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send({ error: 'Internal server error' });
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
