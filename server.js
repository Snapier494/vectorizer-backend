const express = require('express');
const request = require('request');
const multer = require('multer');
const fs = require('fs');
const app = express();
const path = require('path');
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

app.post('/vectorize', upload.single('imageData'), (req, res) => {
    try {
        const imageData = req.file;
        const {processingMax_colors, outputBitmapAnti_aliasing_mode, outputDraw_style, outputStokesUse_override_color, 
            outputSvgAdobe_compatibility_mode, outputGroup_by, outputShape_stacking, outputDxfCompatibility_level,
            outputParameterized_shapes_flatten, outputCurves_allowed_quadratic_bezier, outputCurves_allowed_cubic_bezier,
            outputCurves_allowed_circular_arc, outputCurves_allowed_elliptical_arc
            } = req.body;
        console.log('imageFile = ', imageData);
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

        // Send the image data to Vectorizer AI API
        request.post({
            url: 'https://vectorizer.ai/api/v1/vectorize',
            formData: {
                image: fs.createReadStream(imageData.path),
                mode: 'test',
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
