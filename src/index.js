import fs from 'fs'
import { join } from 'path'
import bufferSplit from 'buffer-split'

class CryptumMarkupParser
{
    static defaultFilePath = null
    static defaultFileEncoding = 'utf-8'
    static defaultOutputFolder = null
    static defaultCleanStringRegExp = /[^0-9a-zA-Zéêèàâùûçòô'%\[\]\-\+ ]/gi

    static nodeTypeSubmenu = 'submenu'
    static nodeTypeParameter = 'parameter'

    constructor() {
        this.filePath = CryptumMarkupParser.defaultFilePath;
        this.fileEncoding = CryptumMarkupParser.defaultFileEncoding;
        this.outputFolder = CryptumMarkupParser.defaultOutputFolder;
        this.cleanStringRegExp = CryptumMarkupParser.defaultCleanStringRegExp;
    }

    getFilePath = () => this.filePath
    getFileEncoding = () => this.fileEncoding
    getOutputFolder = () => this.outputFolder
    getCleanStringRegExp = () => this.cleanStringRegExp
    getAllIndexes = (arr, values) => {

        let i = -1;
        const list = [];

        (Array.isArray(values) ? values : [values]).forEach(value => {
            while ((i = arr.indexOf(value, i + 1, 'hex')) !== -1) list.push(i);
        });

        return list;

    }

    setFilePath = (path = null) => {
        this.filePath = path;
        return this;
    }

    setFileEncoding = (encoding = CryptumMarkupParser.defaultFileEncoding) => {
        this.fileEncoding = encoding;
        return this;
    }

    setOutputFolder = (folder = CryptumMarkupParser.defaultOutputFolder) => {
        this.outputFolder = folder;
        return this;
    }

    setCleanStringRegExp = (regexp = CryptumMarkupParser.defaultCleanStringRegExp) => {
        this.cleanStringRegExp = regexp;
        return this;
    }

    createOutputFileName = (format = 'json') => (
        `${this.getFilePath().split('/').reverse()[0].replace(/\./g, '_')}.${format}`
    )

    hexToString = hex => {
        return hex.toString(this.getFileEncoding())
        .replace(/ /g, ' ')
        .replace(this.getCleanStringRegExp(), '')
        .trim();
    }

    readFile = (cb = () => {}) => {

        try {

            fs.readFile(this.getFilePath(), (err, data) => {

                if (null !== err) {
                    return cb(err);
                }

                const Settings = [];

                const Submenus = bufferSplit(data, new Buffer('Submenu'))
                .map(BufferData => BufferData.slice(1));

                Submenus.shift();

                Submenus.forEach(Submenu => {

                    let SubmenuInfo = {
                        name: null,
                        description: null,
                        type: CryptumMarkupParser.nodeTypeSubmenu
                    };

                    const SubmenuPrefix = data.slice(
                        data.indexOf(Submenu) - 12,
                        data.indexOf(Submenu) - 10
                    );

                    const SectionInfo = Submenu.slice(0, Submenu.indexOf('0001', 'hex'));
                    const SectionInfoDelimiterKeysPosition = this.getAllIndexes(SectionInfo, '0052');
                    const SectionName = SectionInfo.slice(
                        0, SectionInfoDelimiterKeysPosition[SectionInfoDelimiterKeysPosition.length - 1] + 1
                    );
                    const SectionDescription = SectionInfo.slice(
                        SectionInfoDelimiterKeysPosition[SectionInfoDelimiterKeysPosition.length - 1] + 3
                    );

                    SubmenuInfo.name = this.hexToString(SectionName);
                    SubmenuInfo.description = `${this.hexToString(SectionDescription)}.`

                    const EnumeratedParameters = bufferSplit(Submenu, new Buffer('EnumeratedParameter'))
                    .map(BufferData => BufferData.slice(1));

                    EnumeratedParameters.shift();

                    if (EnumeratedParameters.length !== 0) {

                        SubmenuInfo.options = [];

                        if (
                            ['BB1A', 'FE1B', 'E901', 'FF39', 'E801', 'B902', 'B302', 'B21E', 'D11D', '8D02']
                            .map(Prefix => SubmenuPrefix.indexOf(Prefix, 'hex'))
                            .filter(Index => Index !== -1).length
                        ) Settings.push({
                            name: SubmenuInfo.name,
                            description: SubmenuInfo.description,
                            type: CryptumMarkupParser.nodeTypeSubmenu
                        });

                        EnumeratedParameters.forEach(Parameter => {
                        
                            const ParameterInfo = Parameter.slice(0, Parameter.indexOf('0001', 'hex'));
                            const ParameterInfoDelimiterKeysPosition = this.getAllIndexes(ParameterInfo, '0052');
                            const ParameterName = ParameterInfo.slice(
                                0, ParameterInfoDelimiterKeysPosition[ParameterInfoDelimiterKeysPosition.length - 1] + 1
                            );
                            const ParameterDescription = ParameterInfo.slice(
                                ParameterInfoDelimiterKeysPosition[ParameterInfoDelimiterKeysPosition.length - 1] + 3
                            );

                            const OptionsListStartKeyPosition = Parameter.indexOf('012B', 'hex');
                            const OptionsListStart = Parameter.slice(OptionsListStartKeyPosition);
                            const OptionsList = OptionsListStart.slice(OptionsListStart.indexOf('00', 'hex') - 1);

                            let PreviousDelimiterIndex = 0;
                            let ParametersOptions = [];

                            this.getAllIndexes(OptionsList, ['2A04', '2A05', '2A06', '2A07']).forEach(DelimiterIndex => {

                                let Option = OptionsList.slice(PreviousDelimiterIndex, DelimiterIndex + 8);
                                let OptionKey = Option.slice(0, Option.indexOf('2A', 'hex'));
                                let OptionValue = Option.slice(Option.indexOf('2A', 'hex'));

                                PreviousDelimiterIndex = DelimiterIndex + 10;

                                if (OptionKey[1] !== 0) {
                                    OptionKey = OptionKey.slice(OptionKey.indexOf('00', 'hex') - 1);
                                }

                                if (this.getAllIndexes(OptionValue, '2A').length >= 2) {
                                    OptionValue = OptionValue.slice(0, 8);
                                }

                                ParametersOptions.push({
                                    key: this.hexToString(OptionKey),
                                    value: OptionValue
                                });

                            });
                            
                            SubmenuInfo.options.push({
                                name: this.hexToString(ParameterName),
                                description: `${this.hexToString(ParameterDescription)}.`,
                                type: CryptumMarkupParser.nodeTypeParameter,
                                options: ParametersOptions
                            });

                        });

                    }

                    Settings.push(SubmenuInfo);
                
                });

                let SettingsOutput = [];
                let SettingIndex = 0;

                while (SettingIndex < Settings.length - 1) {

                    const CurrentSettings = Object.assign({}, Settings[SettingIndex]);

                    if (undefined === CurrentSettings.options) {
                        CurrentSettings.options = [];
                        while (undefined !== (Settings[++SettingIndex] || {}).options) {
                            CurrentSettings.options.push(
                                Settings[SettingIndex]
                            );
                        }
                    } else ++SettingIndex;

                    SettingsOutput.push(
                        CurrentSettings
                    );

                }

                if (null === this.getOutputFolder()) {
                    return cb(null, SettingsOutput);
                }
                
                try {
                    
                    fs.writeFileSync(
                        join(
                            this.getOutputFolder(),
                            this.createOutputFileName()
                        ),
                        JSON.stringify(
                            SettingsOutput,
                            null,
                            4
                        ),
                        'utf-8'
                    );

                    return cb(null, SettingsOutput);
                
                } catch (err) {
                    return cb(err);
                }

            });

        } catch (err) {
            return cb(err);
        }

    }
}

export default (new CryptumMarkupParser())