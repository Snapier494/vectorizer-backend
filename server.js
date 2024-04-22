const express = require('express');
const request = require('request');
const multer = require('multer');
const nFetch = require("node-fetch");
const fs = require('fs');
const app = express();
const path = require('path');
const port = 8000; // or any port you prefer
require('dotenv').config();

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


// Assuming 'build' directory is where your front-end build output resides
app.use(express.static(path.join(__dirname, 'build')));

// This route will serve your index.html file from the build directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Configure multer to handle file uploads
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 50 * 1024 * 1024, // 10MB, adjust this value according to your requirements
    },
});

app.get('/fetch-image', async (req, res) => {
    try {
        const { imageUrl } = req.query;
        
        // Validate imageUrl
        if (!imageUrl || typeof imageUrl !== 'string') {
            throw new Error('imageUrl parameter is missing or invalid');
        }

        // Check if the URL is valid
        const urlRegex = /^(http|https):\/\/[^ "]+$/;
        if (!urlRegex.test(imageUrl)) {
            throw new Error('Invalid imageUrl format');
        }

        console.log('imageUrl = ', imageUrl);

        // Fetch the image
        const response = await nFetch(imageUrl);
        
        // Check if the response is successful
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        
        // Set appropriate Content-Type header
        const contentType = response.headers.get('Content-Type');
        if (!contentType || !contentType.startsWith('image/')) {
            throw new Error('Response is not an image');
        }
        console.log('contentType = ', contentType);
        // Stream the image directly to the response
        response.body.pipe(res);
    } catch (error) {
        console.error('Error fetching image:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/vectorize', upload.single('imageData'), (req, res) => {
    try {
        const imageData = req.file;
        const {viewMode, processingMax_colors, outputBitmapAnti_aliasing_mode, outputDraw_style, outputStokesUse_override_color, 
            outputSvgAdobe_compatibility_mode, outputGroup_by, outputShape_stacking, outputDxfCompatibility_level,
            outputParameterized_shapes_flatten, outputCurves_allowed_quadratic_bezier, outputCurves_allowed_cubic_bezier,
            outputCurves_allowed_circular_arc, outputCurves_allowed_elliptical_arc, outputGap_filler_enabled
            } = req.body;
        console.log('imageFile = ', imageData);
        console.log('ViewMode = ', viewMode);
        console.log('processingMax_colors = ', processingMax_colors);
        console.log('outputBitmapAnti_aliasing_mode = ', outputBitmapAnti_aliasing_mode);
        console.log('outputDraw_style = ', outputDraw_style);
        console.log('outputStokesUse_override_color = ', outputStokesUse_override_color);
        console.log('outputSvgAdobe_compatibility_mode = ', outputSvgAdobe_compatibility_mode);
        console.log('outputGroup_by = ', outputGroup_by);
        console.log('outputShape_stacking = ', outputShape_stacking);
        console.log('outputDxfCompatibility_level = ', outputDxfCompatibility_level);
        console.log('outputParameterized_shapes_flatten = ', outputParameterized_shapes_flatten);  
        console.log('outputCurves_allowed_quadratic_bezier = ', outputCurves_allowed_quadratic_bezier);
        console.log('outputCurves_allowed_cubic_bezier = ', outputCurves_allowed_cubic_bezier);
        console.log('outputCurves_allowed_circular_arc = ', outputCurves_allowed_circular_arc);
        console.log('outputCurves_allowed_elliptical_arc = ', outputCurves_allowed_elliptical_arc);
        console.log('outputGap_filler_enabled = ', outputGap_filler_enabled);
        
        const formData = {
            image: fs.createReadStream(imageData.path),
            'processing.max_colors': processingMax_colors,
            'output.dxf.compatibility_level': outputDxfCompatibility_level,
            'output.parameterized_shapes.flatten': outputParameterized_shapes_flatten,
            'output.bitmap.anti_aliasing_mode': outputBitmapAnti_aliasing_mode,
            'output.draw_style': outputDraw_style,
            'output.shape_stacking': outputShape_stacking,
            'output.group_by': outputGroup_by,
            'output.svg.adobe_compatibility_mode': outputSvgAdobe_compatibility_mode,
            'output.strokes.use_override_color': outputStokesUse_override_color,              
            'output.curves.allowed.quadratic_bezier' : outputCurves_allowed_quadratic_bezier,
            'output.curves.allowed.cubic_bezier' : outputCurves_allowed_cubic_bezier,
            'output.curves.allowed.circular_arc' : outputCurves_allowed_circular_arc,
            'output.curves.allowed.elliptical_arc' : outputCurves_allowed_elliptical_arc,
            'output.gap_filler.enabled' : outputGap_filler_enabled
        };

        if (viewMode === 'test') {
            formData.mode = 'test';

        }

        // Send the image data to Vectorizer AI API
        request.post({
            url: 'https://vectorizer.ai/api/v1/vectorize',
            formData: formData,
            auth: { user: (viewMode === 'test' ? process.env.TEST_VECTORIZED_USER : process.env.VECTORIZED_USER), pass: (viewMode === 'test' ? process.env.TEST_VECTORIZED_PASS : process.env.VECTORIZED_PASS) },
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
                // console.log('body = ', body.toString('utf8'));
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
