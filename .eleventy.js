const htmlMinTransform = require('./src/transforms/html-min-transform.js');

module.exports = function (eleventyConfig) {
    eleventyConfig.addPassthroughCopy('assets');

    eleventyConfig.addNunjucksGlobal('calculateLine', function (aPosition, bPosition, connectionRadius, color, type) {
        const round = (n) => {
            return Math.round(n * 1000000) / 1000000;
        };

        const calculateAngles = (x, y, z) => {

            // Cylinder/Box
            // (x, y, z) = (0, d, 0)
            // x'' = d*sin(rx)*sin(ry)
            // y'' = d*cos(rx)
            // z'' = d*sin(rx)*cos(ry)

            if (x == 0 && y == 0 && z == 0) {
                return {
                    rx: 0.0,
                    ry: 0.0,
                };
            }

            const d = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
            // Can't divide by zero if d = 0 when x=0, y=0, z=0
            let rx = Math.acos(y / d);
            // ps = math.sqrt(x**2 + z**2) -> ps <=> p
            const p = d * Math.sin(rx);

            if (p === 0.0) {
                return {
                    rx: rx,
                    ry: 0.0,
                };
            }
            let ry = Math.asin(x / p)

            if (z < 0) {
                rx *= -1
                ry *= -1
            }

            return {
                rx: round(rx),
                ry: round(ry),
            };
        };

        const x = bPosition[0] - aPosition[0];
        const y = bPosition[1] - aPosition[1];
        const z = bPosition[2] - aPosition[2];
        const d = round(Math.sqrt(x ** 2 + y ** 2 + z ** 2));
        const angles = calculateAngles(x, y, z)

        // Move Cylinder/Box in positive y-axis
        const tyf = round(d / 2);

        // Line height
        let ch = d;
        // Line radius
        let cr = connectionRadius;

        if (type === 'edge' || type === 'face' || type === 'face-hidden') {
            ch = ch + 2 * cr;
            cr = 2 * cr;
        } else if (type === 'inner') {
            ch = ch - 4 * cr;
        } else if (type === 'cn') {
            ch = ch - 4 * cr;
            color = [1, 0, 0];
        }

        return {
            rx: angles.rx,
            ry: angles.ry,
            tyf: tyf,
            color: color,
            ch: ch,
            cr: cr,
        };
    });

    eleventyConfig.addNunjucksGlobal('genUvSphereSegment', function (radius = 1.0, latitudeBands = 24, longitudeBands = 24, thetaMax, phiMax) {
        const round = (n) => {
            return Math.round(n * 1000000) / 1000000;
        };

        thetaMax *= Math.PI;
        phiMax *= Math.PI;

        let points = [];
        let coordIndex = [];
        let capc = [[], [], []];

        for (let lat = 0; lat <= latitudeBands; lat++) {
            // Theta belongs to [0, Pi]
            const theta = (thetaMax * lat) / latitudeBands;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            for (let lon = 0; lon <= longitudeBands; lon++) {
                // Phi belongs to [0, 2*Pi]
                const phi = (phiMax * lon) / longitudeBands;
                const x = round(Math.cos(phi) * sinTheta * radius);
                const y = round(cosTheta * radius);
                const z = round(Math.sin(phi) * sinTheta * radius);

                // theta = maxTheta
                if (lat === latitudeBands) {
                    capc[0].push([x, y, z]);
                }

                // phi == 0
                if (lon === 0) {
                    capc[1].push([x, y, z]);
                }

                // phi == maxPhi
                if (lon === longitudeBands) {
                    capc[2].push([x, y, z]);
                }

                points.push([x, y, z]);

            }
        }

        for (let lat = 0; lat < latitudeBands; lat++) {
            for (let lon = 0; lon < longitudeBands; lon++) {
                const first = (lat * (longitudeBands + 1)) + lon;
                const second = first + longitudeBands + 1;

                coordIndex.push([first, second, first + 1, -1]);
                coordIndex.push([second, second + 1, first + 1, -1]);
            }
        }

        return {
            coordIndex: coordIndex,
            points: points,
            capc: capc,
        };

    });

    eleventyConfig.addNunjucksGlobal('genCapForSphereSegment', function (capc, type) {

        // Python like range function
        const range = (start, stop, step) => {
            if (typeof stop == 'undefined') {
                stop = start;
                start = 0;
            }

            if (typeof step == 'undefined') {
                step = 1;
            }

            if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
                return [];
            }

            var result = [];
            for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
                result.push(i);
            }

            return result;
        }

        let coordIndex = null;
        let points = null;

        const capA = capc[0].length;
        const capB = capc[0].length + capc[1].length;
        const capC = capc[0].length + capc[1].length + capc[2].length;

        if (type === 'first') {
            coordIndex = [range(0, capA), -1];
            points = capc[0];
        }
        else if (type === 'all') {
            coordIndex = [
                range(0, capA), -1,
                range(capA, capB), -1,
                range(capC - 1, capB - 1, -1), -1,
                0, capC, capA - 1, -1,
                capA, capC, capB - 1, -1,
                capB, capC, capC - 1, -1
            ];
            points = [capc, [0, 0, 0]];
        }
        return {
            coordIndex: coordIndex,
            points: points,
        };

    });

    eleventyConfig.addNunjucksGlobal('checkIfAtomsHasType', function (atoms, type) {
        for (let key in atoms) {
            if (atoms[key].type === type) {
                return true;
            }
        }

        return false;
    });

    eleventyConfig.addTransform('htmlmin', htmlMinTransform);

    return {
        passthroughFileCopy: true,
        markdownTemplateEngine: 'njk',
        templateFormats: ['html', 'njk', 'md'],
        dir: {
            input: 'src',
            output: '_site',
            include: 'includes',
        },
    };
};
