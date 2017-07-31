const fs = require('fs');
const path = require('path');
const bufferSplit = require('buffer-split');

const MarkupParser = function() {
    this.filePath = null;
    this.fileEncoding = 'utf-8';
    this.outputPath = null;
    this.cleanStringRegExp = /[^0-9a-zA-Zéêèàâùûçòô'%\[\]\-\+ ]/gi;
};

MarkupParser.prototype.getFilePath = function() { return this.filePath };
MarkupParser.prototype.getFileEncoding = function() { return this.fileEncoding; };
MarkupParser.prototype.getOutputPath = function() { return this.outputPath; };
MarkupParser.prototype.getCleanStringRegExp = function() { return this.cleanStringRegExp; };
MarkupParser.prototype.getAllIndexes = function(arr, values) {

    let i = -1;
    const list = [];

    (Array.isArray(values) ? values : [values]).forEach(function(value) {
        while ((i = arr.indexOf(value, i + 1, 'hex')) !== -1) list.push(i);
    });

    return list;

};

MarkupParser.prototype.setFilePath = function(path) {
    this.filePath = path || null;
    return this;
};

MarkupParser.prototype.setFileEncoding = function(encoding) {
    this.fileEncoding = encoding;
    return this;
};

MarkupParser.prototype.setOutputPath = function(path) {
    this.outputPath = path || null;
    return this;
};

MarkupParser.prototype.setCleanStringRegExp = function(regexp) {
    this.cleanStringRegExp = regexp;
    return this;
};

MarkupParser.prototype.hexToString = function(hex) {
    return hex.toString(this.getFileEncoding())
    .replace(/ /g, ' ')
    .replace(this.getCleanStringRegExp(), '')
    .trim();
};

MarkupParser.prototype.readFile = function(cb) {

    fs.readFile(this.getFilePath(), function(err, data) {

        if (null !== err) {
            return cb(err);
        }

        const Settings = [];

        const Submenus = bufferSplit(data, new Buffer('Submenu'))
        .map(function(BufferData) { return BufferData.slice(1); });

        Submenus.shift();

        Submenus.forEach(function(Submenu) {

            let MenuInfo = {
                name: null,
                description: null,
                type: 'submenu'
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

            MenuInfo.name = this.hexToString(SectionName);
            MenuInfo.description = this.hexToString(SectionDescription) + '.'

            const EnumeratedParameters = bufferSplit(Submenu, new Buffer('EnumeratedParameter'))
            .map(function(BufferData) { return BufferData.slice(1); });

            EnumeratedParameters.shift();

            if (EnumeratedParameters.length !== 0) {

                MenuInfo.options = [];

                if (
                    ['BB1A', 'FE1B', 'E901', 'FF39', 'E801', 'B902', 'B302', 'B21E', 'D11D', '8D02']
                    .map(function(Prefix) { return SubmenuPrefix.indexOf(Prefix, 'hex'); })
                    .filter(function(Index) { return Index !== -1; }).length
                ) Settings.push({
                    name: MenuInfo.name,
                    description: MenuInfo.description,
                    type: 'submenu'
                });

                EnumeratedParameters.forEach(function(Parameter) {
                
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

                    this.getAllIndexes(OptionsList, ['2A04', '2A05', '2A06', '2A07']).forEach(function(DelimiterIndex) {

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

                    }.bind(this));
                    
                    MenuInfo.options.push({
                        name: this.hexToString(ParameterName),
                        description: this.hexToString(ParameterDescription) + '.',
                        type: 'parameter',
                        options: ParametersOptions,
                    });

                }.bind(this));

            }

            Settings.push(MenuInfo);
        
        }.bind(this));

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

        if (null !== this.getOutputPath()) {
            return fs.writeFile(path.join(
                this.getOutputPath(),
                this.getFilePath().split('/').reverse()[0].replace(/\./g, '_') + '.json'
            ), JSON.stringify(SettingsOutput, null, 4), 'utf8', function(err) {
                return err ? cb(err) : cb (null, SettingsOutput);
            });
        } else return cb(null, SettingsOutput);

    }.bind(this));

};

module.exports = (new MarkupParser());
