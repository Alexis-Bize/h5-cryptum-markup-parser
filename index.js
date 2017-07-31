const MarkupParser = require('./lib');

if (false === module.parent) {
    return MarkupParser;
}

const argv = require('argv');
const args = argv.option([
    {
        name: 'filePath',
        short: 'f',
        type: 'path',
        description: 'Defines the file path',
        example: "'index.js -f /path/to/markup.bin' or 'index.js --filePath /path/to/markup.bin'"
    },
    {
        name: 'fileEncoding',
        short: 'e',
        type: 'string',
        description: 'Defines file encoding',
        example: "'index.js -e latin1' or 'index.js --fileEncoding latin1'"
    },
    {
        name: 'outputPath',
        short: 'o',
        type: 'path',
        description: 'Defines the output path',
        example: "'index.js -o /path/for/output' or 'index.js --outputPath /path/for/output'"
    }
]).run();

if (args.options.filePath) MarkupParser.setFilePath(args.options.filePath);
if (args.options.fileEncoding) MarkupParser.setFileEncoding(args.options.fileEncoding);
if (args.options.outputPath) MarkupParser.setOutputPath(args.options.outputPath);

MarkupParser.readFile((err, result) => {
    if (err) console.error(err);
    else console.log(result);
});